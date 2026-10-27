import { describe, expect, it } from 'vitest';
import { buildScene } from '../scenes/scenes';
import { Tank } from '../core/tank';
import { run } from '../core/testing';
import { isDisplayMessage, isFrameMessage, packFrame, unpackFrame } from './frames';

const details = { visual: 'natural', fill: true, selected: 3, trails: false };

describe('frames sent to the display window', () => {
  it('carry every fish as it should be drawn, and the influences, unchanged', () => {
    const tank = new Tank();
    buildScene(tank, 'mixed');
    run(tank, 1);
    tank.setInfluences([{ x: 0.5, y: 0.4, vx: 0, vy: 0, radius: 0.2, kind: 'hand', shape: 'fist', effect: 'scatter' }]);
    const drawn = unpackFrame(structuredClone(packFrame(tank, details)));
    expect([drawn.width, drawn.height, drawn.t]).toEqual([tank.width, 1, tank.t]);
    expect(drawn.influences).toEqual(tank.influences);
    const looks = (fish: { id: number; x: number; y: number; heading: number; speed: number; size: number; hue: number }[]) =>
      fish.map((f) => [f.id, f.x, f.y, f.heading, f.speed, f.size, f.hue]);
    expect(looks(drawn.fish)).toEqual(looks(tank.fish));
  });

  it('carry how the operator wants it shown', () => {
    const tank = new Tank();
    tank.addFish('sine');
    const frame = structuredClone(packFrame(tank, details));
    expect([frame.visual, frame.fill, frame.selected, frame.trails]).toEqual(['natural', true, 3, false]);
  });

  it('stay small for a big tank', () => {
    const tank = new Tank();
    buildScene(tank, 'field');
    // Seven numbers of eight bytes per fish.
    expect(packFrame(tank, details).fish.byteLength).toBe(tank.fish.length * 7 * 8);
  });
});

describe('recognising messages between the windows', () => {
  it('accepts the messages it knows and nothing else', () => {
    const tank = new Tank();
    tank.addFish('sine');
    expect(isFrameMessage(packFrame(tank, details))).toBe(true);
    expect(isDisplayMessage({ type: 'hello' })).toBe(true);
    expect(isDisplayMessage({ type: 'shown', area: { x: 0, y: 0, width: 1, height: 1 } })).toBe(true);
    expect(isDisplayMessage({ type: 'pointer', influence: null })).toBe(true);
    for (const junk of [null, 'frame', { type: 'frame' }, { type: 'shown' }, { type: 'pointer' }, { type: 'nope' }]) {
      expect(isFrameMessage(junk) || isDisplayMessage(junk)).toBe(false);
    }
  });
});
