import { describe, expect, it } from 'vitest';
import { HandInput, classifyHand, type Landmark } from './hands';

/**
 * A made-up hand as a camera would see it, palm facing the camera, fingers up. `x`, `y` place the
 * knuckles in the camera picture (0 to 1 across and down). The 21 points follow the standard layout:
 * 0 wrist; thumb 1 to 4; then index, middle, ring and little finger, four points each from knuckle to tip.
 */
function hand(x: number, y: number, shape: 'open' | 'fist'): Landmark[] {
  const size = 0.1;
  const points: Landmark[] = [{ x, y: y + size, z: 0 }];
  // Thumb, off to one side.
  for (let i = 1; i <= 4; i++) points.push({ x: x - size * 0.25 * i, y: y + size * (0.8 - 0.15 * i), z: 0 });
  for (let finger = 0; finger < 4; finger++) {
    const fx = x - size * 0.45 + finger * size * 0.3;
    // Knuckle, middle joint, upper joint, tip. A curled finger folds back down towards the palm.
    const heights = shape === 'open' ? [0, -0.35, -0.6, -0.8] : [0, -0.25, -0.05, 0.15];
    for (const h of heights) points.push({ x: fx, y: y + size * h, z: 0 });
  }
  return points;
}

const TANK_WIDTH = 1.6;
const setUp = () => new HandInput(TANK_WIDTH);
/** Camera frames arrive about 30 times a second. */
const FRAME = 1 / 30;

/** Feeds the same view for a number of camera frames, returning the time after the last. */
function hold(input: HandInput, hands: Landmark[][], frames: number, from = 0): number {
  let time = from;
  for (let i = 0; i < frames; i++) input.update(hands, (time += FRAME));
  return time;
}

describe('classifyHand', () => {
  it('reads an open hand as open and a fist as a fist', () => {
    expect(classifyHand(hand(0.5, 0.5, 'open'))).toBe('open');
    expect(classifyHand(hand(0.5, 0.5, 'fist'))).toBe('fist');
  });

  it('reads a hand the same way wherever it is and however it is turned', () => {
    const turned = hand(0.3, 0.6, 'open').map((p) => ({ x: 0.3 + (p.y - 0.6), y: 0.6 - (p.x - 0.3), z: 0 }));
    expect(classifyHand(turned)).toBe('open');
  });
});

describe('HandInput', () => {
  it('a hand is one influence at its palm, mirrored so moving your hand right moves it right', () => {
    const input = setUp();
    const time = hold(input, [hand(0.2, 0.5, 'open')], 10);
    const [influence] = input.influences(time);
    // The camera sees your right hand on its left, so the picture is flipped like a mirror.
    expect(influence!.x).toBeGreaterThan(TANK_WIDTH * 0.7);
    expect(influence!.y).toBeGreaterThan(0.4);
    expect(influence!.y).toBeLessThan(0.7);
  });

  it('an open hand lets each fish decide; a fist scatters them', () => {
    const input = setUp();
    let time = hold(input, [hand(0.5, 0.5, 'open')], 10);
    expect(input.influences(time)[0]!.effect).toBeUndefined();
    time = hold(input, [hand(0.5, 0.5, 'fist')], 10, time);
    expect(input.influences(time)[0]!.effect).toBe('scatter');
  });

  it('a hand flickering to a fist for a frame or two does not change what it does', () => {
    const input = setUp();
    let time = hold(input, [hand(0.5, 0.5, 'open')], 10);
    time = hold(input, [hand(0.5, 0.5, 'fist')], 2, time);
    expect(input.influences(time)[0]!.effect).toBeUndefined();
    time = hold(input, [hand(0.5, 0.5, 'open')], 1, time);
    time = hold(input, [hand(0.5, 0.5, 'fist')], 2, time);
    expect(input.influences(time)[0]!.effect).toBeUndefined();
  });

  it('reports how fast the hand is moving', () => {
    const input = setUp();
    let time = 0;
    for (let i = 0; i < 20; i++) input.update([hand(0.7 - i * 0.01, 0.5, 'open')], (time += FRAME));
    // Moving left in the camera picture is moving right in the tank.
    expect(input.influences(time)[0]!.vx).toBeGreaterThan(0);
  });

  it('smooths out the jitter of tracking', () => {
    const input = setUp();
    let time = hold(input, [hand(0.5, 0.5, 'open')], 10);
    const steady = input.influences(time)[0]!.x;
    time = hold(input, [hand(0.53, 0.5, 'open')], 1, time);
    const jumped = Math.abs(input.influences(time)[0]!.x - steady);
    // A sudden one-frame jump is only partly followed.
    expect(jumped).toBeGreaterThan(0);
    expect(jumped).toBeLessThan(0.03 * TANK_WIDTH * 0.8);
  });

  it('when the hand leaves, its effect fades away instead of stopping dead or staying', () => {
    const input = setUp();
    let time = hold(input, [hand(0.5, 0.5, 'open')], 10);
    const radius = input.influences(time)[0]!.radius;
    time = hold(input, [], 3, time);
    const fading = input.influences(time);
    expect(fading).toHaveLength(1);
    expect(fading[0]!.radius).toBeLessThan(radius);
    expect(fading[0]!.radius).toBeGreaterThan(0);
    time = hold(input, [], 30, time);
    expect(input.influences(time)).toEqual([]);
  });

  it('two hands give two influences, each keeping its own place', () => {
    const input = setUp();
    let time = hold(input, [hand(0.2, 0.5, 'open'), hand(0.8, 0.5, 'fist')], 10);
    // The tracker may list the hands in either order from frame to frame.
    time = hold(input, [hand(0.8, 0.5, 'fist'), hand(0.2, 0.5, 'open')], 10, time);
    const influences = input.influences(time).sort((a, b) => a.x - b.x);
    expect(influences).toHaveLength(2);
    expect(influences[0]!.effect).toBe('scatter');
    expect(influences[1]!.effect).toBeUndefined();
  });

  it('ignores a malformed hand with missing points', () => {
    const input = setUp();
    const time = hold(input, [hand(0.5, 0.5, 'open').slice(0, 10)], 5);
    expect(input.influences(time)).toEqual([]);
  });
});
