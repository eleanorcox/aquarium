import { describe, expect, it } from 'vitest';
import { MODELS } from './motion';
import { Tank } from './tank';

const fixedRandom = () => 0.5;

describe('motion models', () => {
  it('sine follows y = y0 + A sin(ωt + φ)', () => {
    const p = { A: 0.1, w: 2, phi: 0.3, v: 0, y0: 0.5, x0: 0 };
    for (const t of [0, 0.4, 1.7]) {
      expect(MODELS.sine.position(p, t, 1.6).y).toBeCloseTo(0.5 + 0.1 * Math.sin(2 * t + 0.3));
    }
  });

  it('sine wraps x back into the tank', () => {
    const p = { A: 0, w: 1, phi: 0, v: -0.3, y0: 0.5, x0: 0 };
    for (const t of [0, 1, 10, 100]) {
      const { x } = MODELS.sine.position(p, t, 1.6);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1.6);
    }
  });

  it('circle stays at radius R from its centre', () => {
    const p = { R: 0.2, w: 1.3, cx: 0.5, cy: 0.5 };
    for (const t of [0, 0.9, 5]) {
      const { x, y } = MODELS.circle.position(p, t, 2);
      expect(Math.hypot(x - 1, y - 0.5)).toBeCloseTo(0.2);
    }
  });
});

describe('Tank', () => {
  it('gives the same result for the same steps (deterministic)', () => {
    const run = () => {
      const tank = new Tank(1.6, fixedRandom);
      tank.addFish('lissajous');
      for (let i = 0; i < 600; i++) tank.step(1 / 60);
      return tank.get(0);
    };
    const a = run();
    const b = run();
    expect([a.x, a.y]).toEqual([b.x, b.y]);
  });

  it('points a drifting fish in its direction of travel, including across a wrap', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('sine', { A: 0, v: 0.5, x0: 0.999 });
    for (let i = 0; i < 10; i++) {
      tank.step(1 / 60);
      expect(Math.cos(fish.heading)).toBeCloseTo(1);
    }
  });

  it('breaks the trail when a fish wraps so no line crosses the tank', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('sine', { A: 0, v: 0.5, x0: 0.99 });
    for (let i = 0; i < 30; i++) tank.step(1 / 60);
    expect(fish.trail).toContain(null);
  });

  it('clears the trail when a parameter changes', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('sine');
    tank.step(1 / 60);
    tank.setParam(fish.id, 'A', 0.3);
    expect(fish.params.A).toBe(0.3);
    expect(fish.trail).toEqual([]);
  });

  it('resets parameters to the new model’s defaults on a model change', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('sine');
    tank.setModel(fish.id, 'circle');
    expect(Object.keys(fish.params).sort()).toEqual(['R', 'cx', 'cy', 'w', 'x0'].sort());
  });
});
