import { describe, expect, it } from 'vitest';
import { compileEquations, scopeFor } from './equations';
import { MODELS, defaultParams, type BuiltinId } from './motion';
import { Tank } from './tank';

const fixedRandom = () => 0.5;
const wrap = (v: number, size: number) => ((v % size) + size) % size;

describe('compileEquations', () => {
  it('evaluates x(t) and y(t) with the tank variables and sliders', () => {
    const result = compileEquations({ x: 'cx + a * t', y: 'cy + b * sin(t)' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const p = result.position(scopeFor(2, 1.6, { a: 0.1, b: 0.2, c: 0 }));
    expect(p.x).toBeCloseTo(0.8 + 0.2);
    expect(p.y).toBeCloseTo(0.5 + 0.2 * Math.sin(2));
  });

  it.each([
    ['an unknown name', { x: 'cx + q', y: 'cy' }, /x\(t\).*q/],
    ['a syntax error', { x: 'cx', y: 'sin(t' }, /y\(t\)/],
    ['an empty equation', { x: '', y: 'cy' }, /x\(t\) is empty/],
    ['a result that is not a number', { x: 'cx > 1', y: 'cy' }, /single number/],
    ['a list', { x: '[1, 2]', y: 'cy' }, /x\(t\)/],
    ['a disabled function', { x: 'import({}, {})', y: 'cy' }, /x\(t\)/],
  ])('rejects %s with a message', (_label, source, message) => {
    const result = compileEquations(source);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(message);
  });
});

describe('built-in models written as equations', () => {
  const width = 1.6;
  it.each(Object.keys(MODELS) as BuiltinId[])('%s gives the same path when typed', (id) => {
    const model = MODELS[id];
    const params = defaultParams(id);
    const typed = compileEquations(model.source(params));
    expect(typed.ok).toBe(true);
    if (!typed.ok) return;
    for (const t of [0, 0.5, 3.1, 12]) {
      const expected = model.position(params, t, width);
      const actual = typed.position(scopeFor(t, width, params));
      expect(wrap(actual.x, width)).toBeCloseTo(expected.x, 3);
      expect(actual.y).toBeCloseTo(expected.y, 3);
    }
  });

  it('keeps built-in paths inside the tank', () => {
    for (const id of Object.keys(MODELS) as BuiltinId[]) {
      const params = defaultParams(id);
      for (let t = 0; t < 60; t += 0.25) {
        const { x, y } = MODELS[id].position(params, t, width);
        expect(x, id).toBeGreaterThanOrEqual(0);
        expect(x, id).toBeLessThanOrEqual(width);
        expect(y, id).toBeGreaterThanOrEqual(0);
        expect(y, id).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('Tank with typed equations', () => {
  it('turns the current path into editable equations when switching to custom', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('circle');
    tank.setModel(fish.id, 'custom');
    expect(fish.equations?.x).toContain('cos');
    const before = { x: fish.x, y: fish.y };
    tank.step(0);
    expect(fish.x).toBeCloseTo(before.x, 3);
    expect(fish.y).toBeCloseTo(before.y, 3);
  });

  it('keeps the old equations when new ones have an error', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('custom');
    const old = fish.equations;
    expect(tank.setEquations(fish.id, { x: 'cx + oops', y: 'cy' })).toMatch(/oops/);
    expect(fish.equations).toEqual(old);
  });

  it('wraps a typed path that leaves the tank back inside it', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('custom');
    tank.setEquations(fish.id, { x: '0.5 * t', y: '-0.3 * t' });
    for (let i = 0; i < 600; i++) {
      tank.step(1 / 60);
      expect(fish.x).toBeGreaterThanOrEqual(0);
      expect(fish.x).toBeLessThan(1.6);
      expect(fish.y).toBeGreaterThanOrEqual(0);
      expect(fish.y).toBeLessThan(1);
    }
  });

  it('holds position while an equation gives no number', () => {
    const tank = new Tank(1.6, fixedRandom);
    const fish = tank.addFish('custom');
    tank.setEquations(fish.id, { x: 'cx + 0.1 / (t - 1)', y: 'cy' });
    tank.step(0.99);
    const x = fish.x;
    tank.step(0.01); // t = 1 divides by zero
    expect(fish.x).toBe(x);
  });
});
