import { describe, expect, it } from 'vitest';
import { loadTank, saveTank } from './save';
import type { Tank } from './tank';
import { makeTank, run } from './testing';

/** A ring of fish: each sits at its own angle around the centre, given by its place in the formation. */
const RING = { x: 'cx + 0.3 * cos(t + 2 * pi * i / n)', y: 'cy + 0.3 * sin(t + 2 * pi * i / n)' };

function ring(tank: Tank, count: number): number[] {
  const leader = tank.addFish('custom');
  tank.setEquations(leader.id, RING);
  return tank.makeFormation(leader.id, count);
}

describe('formations', () => {
  it('makes a group of fish sharing one equation, each knowing its place: i from 0, and how many there are, n', () => {
    const tank = makeTank();
    const ids = ring(tank, 6);
    expect(ids).toHaveLength(6);
    run(tank, 1);
    const angles = ids.map((id) => {
      const fish = tank.get(id);
      return Math.atan2(fish.y - 0.5, fish.x - tank.width / 2);
    });
    // Six fish spread evenly round the circle, a sixth of a turn apart.
    for (let k = 1; k < 6; k++) {
      const gap = (((angles[k]! - angles[k - 1]!) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      expect(gap).toBeCloseTo((2 * Math.PI) / 6, 6);
    }
  });

  it('changing the equation of any fish in a formation changes it for all of them', () => {
    const tank = makeTank();
    const ids = ring(tank, 4);
    expect(tank.setEquations(ids[2]!, { x: 'cx', y: 'cy + 0.1 * i' })).toBeNull();
    run(tank, 0.5);
    expect(ids.map((id) => tank.get(id).y)).toEqual([0.5, 0.6, 0.7, 0.8].map((y) => expect.closeTo(y, 9)));
  });

  it('turns a fish on a built-in path into a formation, starting from that path written as an equation', () => {
    const tank = makeTank();
    const fish = tank.addFish('circle');
    const ids = tank.makeFormation(fish.id, 3);
    expect(ids.map((id) => tank.get(id).model)).toEqual(['custom', 'custom', 'custom']);
    expect(tank.get(ids[1]!).equations).toEqual(tank.get(fish.id).equations);
  });

  it('closes ranks when a member is removed', () => {
    const tank = makeTank();
    const ids = ring(tank, 4);
    tank.removeFish(ids[1]!);
    run(tank, 1);
    const [a, b] = [tank.get(ids[0]!), tank.get(ids[2]!)];
    // Now three: a third of a turn apart.
    const gap = Math.atan2(b.y - 0.5, b.x - tank.width / 2) - Math.atan2(a.y - 0.5, a.x - tank.width / 2);
    expect(Math.cos(gap)).toBeCloseTo(Math.cos((2 * Math.PI) / 3), 6);
  });

  it('a single fish with no formation is a formation of one: i is 0 and n is 1', () => {
    const tank = makeTank();
    const fish = tank.addFish('custom');
    expect(tank.setEquations(fish.id, { x: 'cx + i', y: 'cy * n' })).toBeNull();
    run(tank, 0.1);
    expect(fish.x).toBeCloseTo(tank.width / 2, 9);
    expect(fish.y).toBeCloseTo(0.5, 9);
  });

  it('survives saving and loading', () => {
    const tank = makeTank();
    ring(tank, 5);
    run(tank, 2);
    const loaded = loadTank(JSON.parse(JSON.stringify(saveTank(tank))));
    if (typeof loaded === 'string') throw new Error(loaded);
    run(tank, 1);
    run(loaded, 1);
    expect(loaded.fish.map((f) => [f.x, f.y])).toEqual(tank.fish.map((f) => [f.x, f.y]));
  });
});
