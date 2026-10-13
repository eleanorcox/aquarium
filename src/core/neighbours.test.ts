import { describe, expect, it } from 'vitest';
import { Grid } from './neighbours';
import { seededRandom } from './random';

describe('Grid', () => {
  it('finds exactly the neighbours that checking every pair finds', () => {
    const random = seededRandom(5);
    const points = Array.from({ length: 400 }, () => ({ x: random() * 3, y: random() }));
    for (const radius of [0.05, 0.12, 0.3]) {
      const grid = new Grid(0.12);
      points.forEach((p, i) => grid.insert(i, p.x, p.y));
      for (const [i, p] of points.entries()) {
        const within = (j: number) => j !== i && Math.hypot(points[j]!.x - p.x, points[j]!.y - p.y) < radius;
        const everyPair = points.map((_, j) => j).filter(within);
        const fromGrid = grid.near(p.x, p.y, radius).filter(within);
        expect(fromGrid.sort((a, b) => a - b)).toEqual(everyPair);
      }
    }
  });

  it('looks at far fewer candidates than there are points', () => {
    const random = seededRandom(6);
    const grid = new Grid(0.1);
    for (let i = 0; i < 2000; i++) grid.insert(i, random() * 3, random());
    expect(grid.near(1.5, 0.5, 0.1).length).toBeLessThan(200);
  });

  it('copes with points outside the tank and with negative positions', () => {
    const grid = new Grid(0.1);
    grid.insert(0, -0.05, -0.05);
    grid.insert(1, 5, 5);
    expect(grid.near(-0.04, -0.04, 0.1)).toEqual([0]);
  });
});
