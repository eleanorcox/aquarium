import { describe, expect, it } from 'vitest';
import { qrPattern, visitAddress } from './invite';

describe('the invitation on the tank', () => {
  it('points phones at the visit page beside this one, for this room', () => {
    expect(visitAddress('https://aquarium.eleanorcox.rocks/?scene=free&visuals=natural', 'ABC234')).toBe('https://aquarium.eleanorcox.rocks/visit.html?room=ABC234');
    expect(visitAddress('http://192.168.1.20:5173/index.html#x', 'ABC234')).toBe('http://192.168.1.20:5173/visit.html?room=ABC234');
    expect(visitAddress('https://eleanorcox.rocks/aquarium/', 'ABC234')).toBe('https://eleanorcox.rocks/aquarium/visit.html?room=ABC234');
  });

  it('is a square QR pattern with its three corner markers', () => {
    const pattern = qrPattern('https://aquarium.eleanorcox.rocks/visit.html?room=ABC234');
    const n = pattern.length;
    expect(n).toBeGreaterThanOrEqual(21);
    expect(pattern.every((row) => row.length === n)).toBe(true);
    // Each corner marker is a dark square ring seven modules across.
    for (const [r, c] of [[0, 0], [0, n - 7], [n - 7, 0]] as const) {
      expect(pattern[r]![c]).toBe(true);
      expect(pattern[r + 6]![c + 6]).toBe(true);
      expect(pattern[r + 1]![c + 1]).toBe(false);
      expect(pattern[r + 3]![c + 3]).toBe(true);
    }
  });
});
