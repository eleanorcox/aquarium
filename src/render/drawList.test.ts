import { describe, expect, it } from 'vitest';
import { Tank } from '../core/tank';
import { fishInView } from './drawList';
import { View } from './view';

describe('fishInView', () => {
  /** A fish held at one spot. */
  const at = (tank: Tank, x: number) => tank.addFish('sine', { A: 0, v: 0, y0: 0.5, x0: x / tank.width });

  it('lists fish on screen and fish straddling its edge, and leaves out the rest', () => {
    const tank = new Tank(2);
    const view = new View({ width: 2, height: 1 }, { width: 400, height: 800 }, 0.01);
    const left = view.toTank({ x: 0, y: 400 }).x;
    const onScreen = at(tank, 1);
    const straddling = at(tank, left - 0.01);
    at(tank, left - 0.5);
    expect(fishInView(tank.fish, view).map((fish) => fish.id)).toEqual([onScreen.id, straddling.id]);
  });

  it('lists every fish when the whole tank is on screen', () => {
    const tank = new Tank(2);
    const view = new View({ width: 2, height: 1 }, { width: 1000, height: 800 }, 0.04);
    for (const x of [0, 0.5, 1, 1.5, 2]) at(tank, x);
    expect(fishInView(tank.fish, view)).toHaveLength(5);
  });
});
