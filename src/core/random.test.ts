import { describe, expect, it } from 'vitest';
import { seededRandom } from './random';

describe('seededRandom', () => {
  it('gives the same numbers for the same seed', () => {
    const a = seededRandom(7);
    const b = seededRandom(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives different numbers for different seeds', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it('stays between 0 and 1 and is spread across that range', () => {
    const random = seededRandom(3);
    const values = Array.from({ length: 2000 }, random);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...values)).toBeLessThan(1);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    // A fair spread averages 0.5; 2000 draws land within 0.05 of it.
    expect(Math.abs(mean - 0.5)).toBeLessThan(0.05);
  });
});
