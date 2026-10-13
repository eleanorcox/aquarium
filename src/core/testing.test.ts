import { describe, expect, it } from 'vitest';
import { makeTank, run } from './testing';

describe('test helpers', () => {
  it('makeTank builds the same tank every time', () => {
    const a = makeTank();
    const b = makeTank();
    expect(a.addFish('sine').params.x0).toBe(b.addFish('sine').params.x0);
  });

  it('run advances the tank by the given number of seconds in 1/60 s steps', () => {
    const tank = makeTank();
    run(tank, 2);
    expect(tank.t).toBeCloseTo(2, 9);
  });
});
