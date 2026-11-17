import { describe, expect, it } from 'vitest';
import { buildScene } from '../scenes/scenes';
import { Tank } from '../core/tank';
import { run } from '../core/testing';
import { isDisplayMessage, isFrameMessage, isLooksMessage, isPictureMessage, lookMap, packFrame, packLooks, unpackFrame } from './frames';
import { addVisitorFish } from '../visitors/arrive';

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

  it('carry each fish’s swimming style, so real species swim the same way on the projector', () => {
    const tank = new Tank();
    const fish = tank.addFish('sine');
    tank.setSpecies(fish.id, 'european-eel', 'anguilliform');
    tank.addFish('sine');
    expect(unpackFrame(structuredClone(packFrame(tank, details))).fish.map((f) => f.swimStyle)).toEqual(['anguilliform', undefined]);
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
    // Eight numbers of eight bytes per fish.
    expect(packFrame(tank, details).fish.byteLength).toBe(tank.fish.length * 8 * 8);
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

describe('visitor fish looks for the display window', () => {
  it('are sent for visitor fish only, with their outline, colours, pattern and picture id', () => {
    const tank = new Tank();
    tank.addFish('sine');
    const id = addVisitorFish(tank, { version: 1, name: 'Dot', outline: 'tall', hues: [10, 250], pattern: 'coloured', temperament: 0 }, 'picture-3');
    expect(packLooks(tank)).toEqual({ type: 'looks', looks: [{ id, outline: 'tall', secondHue: 250, pattern: 'coloured', picture: 'picture-3', swimStyle: 'carangiform' }] });
  });

  it('are put back on the fish as the display window unpacks each frame', () => {
    const tank = new Tank();
    tank.addFish('sine');
    const id = addVisitorFish(tank, { version: 1, name: 'Dot', outline: 'round', hues: [10, 250], pattern: 'spots', temperament: 0 });
    const drawn = unpackFrame(packFrame(tank, { visual: 'classic', fill: false, selected: 0, trails: false }), lookMap(packLooks(tank)));
    expect(drawn.fish.find((f) => f.id === id)).toMatchObject({ outline: 'round', secondHue: 250, pattern: 'spots', hue: 10 });
    expect(drawn.fish.find((f) => f.id !== id)!.outline).toBeUndefined();
  });

  it('are only accepted in the shape they are sent in, as are pictures', () => {
    expect(isLooksMessage({ type: 'looks', looks: [] })).toBe(true);
    expect(isLooksMessage({ type: 'looks', looks: 'x' })).toBe(false);
    expect(isPictureMessage({ type: 'picture', id: 'p', dataUrl: 'data:image/png;base64,AA' })).toBe(true);
    expect(isPictureMessage({ type: 'picture', id: 'p', dataUrl: 'javascript:alert(1)' })).toBe(false);
  });
});
