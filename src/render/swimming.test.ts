import { describe, expect, it } from 'vitest';
import { CRUISE_SPEED, STYLES, SwimPhases, amplitudeScale, bodyWave, envelope, tailBeatFrequency, type SwimStyleId } from './swimming';

const IDS = Object.keys(STYLES) as SwimStyleId[];
const along = (steps: number) => Array.from({ length: steps + 1 }, (_, i) => i / steps);

describe('the body wave', () => {
  it('is smallest at the head and grows all the way to the tail, in every style', () => {
    for (const id of IDS) {
      const sizes = along(20).map((s) => envelope(STYLES[id], s));
      for (let i = 1; i < sizes.length; i++) expect(sizes[i]!, id).toBeGreaterThanOrEqual(sizes[i - 1]!);
      expect(sizes[0]!, id).toBeLessThan(sizes[20]!);
    }
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
    expect(halfway('thunniform')).toBeLessThan(0.1);
    expect(halfway('subcarangiform')).toBeGreaterThan(halfway('carangiform'));
    expect(halfway('carangiform')).toBeGreaterThan(halfway('thunniform'));
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
