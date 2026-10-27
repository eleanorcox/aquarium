import { describe, expect, it } from 'vitest';
import { CRUISE_SPEED, STYLES, SwimPhases, amplitudeScale, bodyWave, envelope, tailBeatFrequency, type SwimStyleId } from './swimming';

const IDS = Object.keys(STYLES) as SwimStyleId[];
const along = (steps: number) => Array.from({ length: steps + 1 }, (_, i) => i / steps);

describe('the body wave', () => {
  it('swings most at the tail and least in the front part of the body, in every style', () => {
    // Measured fish turn about a pivot near the front, so the head moves a little more than the point behind it.
    for (const id of IDS) {
      const sizes = along(20).map((s) => envelope(STYLES[id], s));
      expect(Math.max(...sizes), id).toBe(sizes[20]);
      expect(sizes.indexOf(Math.min(...sizes)), id).toBeLessThanOrEqual(8);
      for (const size of sizes) expect(size, id).toBeGreaterThan(0);
    }
  });

  it('swings about a tenth of a body length either way at the tail, as measured across many species', () => {
    for (const id of IDS) expect(envelope(STYLES[id], 1), id).toBeCloseTo(0.1, 2);
  });

  it('never swings further than the style allows', () => {
    for (const id of IDS) {
      for (const s of along(20)) {
        for (const phase of [0, 1, 2.5, 4]) expect(Math.abs(bodyWave(STYLES[id], s, phase)), id).toBeLessThanOrEqual(envelope(STYLES[id], s) + 1e-12);
      }
    }
  });

  it('an eel bends along its whole length; a tuna stays nearly straight until the tail', () => {
    const halfway = (id: SwimStyleId) => envelope(STYLES[id], 0.5) / envelope(STYLES[id], 1);
    expect(halfway('anguilliform')).toBeGreaterThan(0.5);
    expect(halfway('thunniform')).toBeLessThan(0.2);
    expect(halfway('subcarangiform')).toBeGreaterThan(halfway('carangiform'));
    expect(halfway('carangiform')).toBeGreaterThan(halfway('thunniform'));
  });

  it('has more than one wave along an eel and less than one along a tuna', () => {
    expect(STYLES.anguilliform.wavelength).toBeLessThan(1);
    expect(STYLES.thunniform.wavelength).toBeGreaterThan(1);
  });

  it('travels from head to tail', () => {
    // A crest a little way down the body is further down it a moment later.
    const style = STYLES.carangiform;
    const crestAt = (phase: number) => {
      let best = 0;
      for (const s of along(200)) if (s <= 0.9 && bodyWave(style, s, phase) / envelope(style, s) > bodyWave(style, best, phase) / envelope(style, best)) best = s;
      return best;
    };
    expect(crestAt(Math.PI)).toBeGreaterThan(crestAt(Math.PI - 0.5));
  });
});

describe('tail beat', () => {
  it('a faster fish beats its tail faster', () => {
    expect(tailBeatFrequency(2)).toBeGreaterThan(tailBeatFrequency(1));
    expect(tailBeatFrequency(1)).toBeGreaterThan(tailBeatFrequency(0));
  });

  it('a fish holding still still moves its tail a little, but much less than when cruising', () => {
    expect(amplitudeScale(0)).toBeGreaterThan(0);
    expect(amplitudeScale(0)).toBeLessThan(amplitudeScale(CRUISE_SPEED) * 0.4);
    expect(amplitudeScale(CRUISE_SPEED * 5)).toBe(amplitudeScale(CRUISE_SPEED));
  });
});

describe('SwimPhases', () => {
  it('carries the wave on smoothly when a fish changes speed, with no jump', () => {
    const phases = new SwimPhases();
    const before = phases.advance(1, 1, 0.5);
    const after = phases.advance(1, 3, 1 / 60);
    expect(after - before).toBeCloseTo(2 * Math.PI * 3 * (1 / 60));
  });

  it('keeps each fish in its own rhythm', () => {
    const phases = new SwimPhases();
    phases.advance(1, 1, 0.25);
    expect(phases.advance(2, 1, 0)).not.toBe(phases.advance(1, 1, 0));
  });

  it('forgets fish that have gone', () => {
    const phases = new SwimPhases();
    phases.advance(1, 1, 0.1);
    phases.advance(2, 1, 0.1);
    phases.keepOnly(new Set([2]));
    expect(phases.size).toBe(1);
  });
});
