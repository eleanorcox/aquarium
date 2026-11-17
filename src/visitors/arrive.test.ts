import { describe, expect, it } from 'vitest';
import { loadTank, saveTank } from '../core/save';
import { makeTank, run } from '../core/testing';
import { fishGroups } from '../ui/groups';
import { addVisitorFish, clearVisitorFish } from './arrive';
import type { VisitorFish } from './visitorFish';

const bubbles: VisitorFish = { version: 1, name: 'Bubbles', outline: 'round', hues: [20, 200], pattern: 'stripes', temperament: 0.6 };

describe('a visitor fish arriving in the tank', () => {
  it('swims freely, with the name, colours, outline, pattern and temperament it was made with', () => {
    const tank = makeTank();
    tank.addFish('sine');
    const fish = tank.get(addVisitorFish(tank, bubbles));
    expect(fish).toMatchObject({ model: 'free', name: 'Bubbles', hue: 20, secondHue: 200, outline: 'round', pattern: 'stripes', curiosity: 0.6, visitor: true });
  });

  it('swims in from a side of the tank, so its arrival can be seen', () => {
    const tank = makeTank();
    const fish = tank.get(addVisitorFish(tank, bubbles));
    const edge = Math.min(fish.x, tank.width - fish.x);
    expect(edge).toBeLessThan(0.2);
    const start = fish.x;
    run(tank, 2);
    expect(Math.min(fish.x, tank.width - fish.x)).toBeGreaterThan(edge);
    expect(Math.abs(fish.x - start)).toBeGreaterThan(0.05);
  });

  it('carries the id of its coloured-in picture', () => {
    const tank = makeTank();
    const fish = tank.get(addVisitorFish(tank, { ...bubbles, pattern: 'coloured', picture: 'data:image/png;base64,AAAA' }, 'picture-7'));
    expect(fish.picture).toBe('picture-7');
  });

  it('is never smaller than the fish already there, so visitors can find theirs', () => {
    const tank = makeTank();
    for (let i = 0; i < 5; i++) tank.setFishSize(tank.addFish('sine').id, 0.02);
    expect(tank.get(addVisitorFish(tank, bubbles)).size).toBeGreaterThanOrEqual(0.02);
  });

  it('keeps its look when the tank is saved, but not its picture, which is too big for a link', () => {
    const tank = makeTank();
    addVisitorFish(tank, { ...bubbles, pattern: 'coloured' }, 'picture-1');
    const loaded = loadTank(saveTank(tank));
    if (typeof loaded === 'string') throw new Error(loaded);
    expect(loaded.fish[0]).toMatchObject({ secondHue: 200, outline: 'round', pattern: 'coloured', visitor: true });
    expect(loaded.fish[0]!.picture).toBeUndefined();
  });
});

describe('visitor fish together', () => {
  it('are offered as a group to change at once', () => {
    const tank = makeTank();
    tank.addFish('sine');
    addVisitorFish(tank, bubbles);
    addVisitorFish(tank, { ...bubbles, name: 'Finn' });
    expect(fishGroups(tank, []).map((g) => g.name)).toContain("Visitors' fish (2)");
  });

  it('can all be cleared, leaving everything else', () => {
    const tank = makeTank();
    tank.addFish('sine');
    addVisitorFish(tank, bubbles);
    addVisitorFish(tank, bubbles);
    expect(clearVisitorFish(tank)).toBe(2);
    expect(tank.fish.map((f) => f.model)).toEqual(['sine']);
  });

  it('leave one behind if they are all there is, since a tank always has a fish', () => {
    const tank = makeTank();
    addVisitorFish(tank, bubbles);
    addVisitorFish(tank, bubbles);
    expect(clearVisitorFish(tank)).toBe(1);
    expect(tank.fish).toHaveLength(1);
  });
});
