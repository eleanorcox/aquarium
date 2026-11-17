import { describe, expect, it } from 'vitest';
import { OUTLINES } from './visitorFish';
import { OUTLINE_SHAPES, PICTURE, paintChoices, pictureStrips, traceShape } from './outlines';

/** Records every drawing call, and any number in one that is not a real number. */
function recorder() {
  const problems: string[] = [];
  const calls: string[] = [];
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(target, name: string) {
      if (name in target) return target[name];
      return (...args: unknown[]) => {
        calls.push(name);
        for (const arg of args) if (typeof arg === 'number' && !Number.isFinite(arg)) problems.push(`${name}(${args.join(', ')})`);
        return name.startsWith('create') ? { addColorStop: () => {} } : undefined;
      };
    },
    set(target, name: string, value) {
      target[name] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, problems, calls };
}

describe('fish outlines', () => {
  it('there is a shape for every outline a visitor can choose', () => {
    for (const outline of OUTLINES) expect(OUTLINE_SHAPES[outline], outline).toBeDefined();
  });

  it('every shape fits inside the picture, facing right: nose at the right and tail at the left', () => {
    for (const outline of OUTLINES) {
      const shape = OUTLINE_SHAPES[outline];
      for (const part of [shape.body, ...shape.fins]) {
        for (const p of part) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(PICTURE.height / PICTURE.width);
        }
      }
      const xs = shape.body.map((p) => p.x);
      expect(Math.max(...xs)).toBeGreaterThan(0.9);
    }
  });

  it('paints every outline and pattern without broken numbers', () => {
    for (const outline of OUTLINES) {
      for (const pattern of ['plain', 'stripes', 'spots'] as const) {
        const { ctx, problems, calls } = recorder();
        paintChoices(ctx, { outline, hues: [20, 200], pattern });
        expect(problems, `${outline} ${pattern}`).toEqual([]);
        expect(calls).toContain('fill');
        expect(calls).toContain('stroke');
      }
    }
  });

  it('traces a shape at any size', () => {
    const { ctx, problems } = recorder();
    traceShape(ctx, OUTLINE_SHAPES.round.body, 512);
    expect(problems).toEqual([]);
  });
});

describe('cutting a picture into strips along a bent spine', () => {
  const straight = Array.from({ length: 16 }, (_, i) => ({ x: 30 - (60 * i) / 15, y: 0 }));
  const bent = straight.map((p, i) => ({ x: p.x, y: 5 * Math.sin(i / 3) }));

  it('covers the whole picture, tail to nose, strip after strip, with no gaps', () => {
    const strips = pictureStrips(bent, PICTURE.width);
    expect(strips[0]!.from).toBe(0);
    expect(strips.at(-1)!.to).toBe(PICTURE.width);
    for (let i = 1; i < strips.length; i++) expect(strips[i]!.from).toBe(strips[i - 1]!.to);
  });

  it('lays a straight spine out flat, nose first, the full length of the fish', () => {
    const strips = pictureStrips(straight, PICTURE.width);
    expect(strips.every((s) => Math.abs(Math.sin(s.angle)) < 1e-9)).toBe(true);
    const drawn = strips.reduce((sum, s) => sum + s.length, 0);
    expect(drawn).toBeCloseTo(60, 5);
    const nose = strips.at(-1)!;
    expect(nose.at.x + nose.length).toBeCloseTo(30);
  });

  it('gives only real numbers for a bent spine', () => {
    for (const s of pictureStrips(bent, PICTURE.width)) for (const v of [s.at.x, s.at.y, s.angle, s.length]) expect(Number.isFinite(v)).toBe(true);
  });
});
