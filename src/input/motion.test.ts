import { describe, expect, it } from 'vitest';
import { MotionInput, type Picture } from './motion';

const W = 64;
const H = 48;

/** A grey camera picture, with optional bright squares: [left, top, size]. */
function picture(squares: [number, number, number][] = [], background = 60): Picture {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const lit = squares.some(([left, top, size]) => x >= left && x < left + size && y >= top && y < top + size);
      const value = lit ? 220 : background;
      data.set([value, value, value, 255], (y * W + x) * 4);
    }
  }
  return { width: W, height: H, data };
}

/** Maps the mirrored picture straight onto a tank 1.6 wide. */
const setUp = () => new MotionInput((across, down) => ({ x: across * 1.6, y: down }));
const FRAME = 1 / 15;

describe('MotionInput', () => {
  it('sees nothing when nothing moves', () => {
    const motion = setUp();
    for (let i = 0; i < 10; i++) motion.update(picture([[20, 20, 12]]), i * FRAME);
    expect(motion.influences(10 * FRAME)).toEqual([]);
  });

  it('follows something moving across the picture, mirrored like the hands', () => {
    const motion = setUp();
    let time = 0;
    const xs: number[] = [];
    for (let left = 4; left < 48; left += 3) {
      motion.update(picture([[left, 18, 12]]), (time += FRAME));
      const [seen] = motion.influences(time);
      if (seen) xs.push(seen.x);
    }
    expect(xs.length).toBeGreaterThan(5);
    // Moving right in the camera picture is moving left in the tank, as in a mirror.
    expect(xs.at(-1)!).toBeLessThan(xs[0]!);
    expect(motion.influences(time)[0]!.kind).toBe('motion');
  });

  it('takes no notice of the whole picture getting lighter or darker, as when a projector flickers', () => {
    const motion = setUp();
    let time = 0;
    for (let i = 0; i < 10; i++) motion.update(picture([[20, 20, 12]], i % 2 ? 60 : 72), (time += FRAME));
    expect(motion.influences(time)).toEqual([]);
  });

  it('sees two people moving in different places as two', () => {
    const motion = setUp();
    let time = 0;
    for (let step = 0; step < 6; step++) motion.update(picture([[2 + step * 2, 4, 10], [40, 30 - step * 2, 10]]), (time += FRAME));
    expect(motion.influences(time)).toHaveLength(2);
  });

  it('lets go once the movement stops', () => {
    const motion = setUp();
    let time = 0;
    for (let left = 4; left < 30; left += 3) motion.update(picture([[left, 18, 12]]), (time += FRAME));
    for (let i = 0; i < 15; i++) motion.update(picture([[31, 18, 12]]), (time += FRAME));
    expect(motion.influences(time)).toEqual([]);
  });

  it('says in words what it sees', () => {
    const motion = setUp();
    expect(motion.describe()).toBe('Nothing moving');
    let time = 0;
    for (let left = 4; left < 20; left += 3) motion.update(picture([[left, 18, 12]]), (time += FRAME));
    expect(motion.describe()).toBe('1 moving');
  });
});
