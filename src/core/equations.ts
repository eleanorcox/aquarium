// Typed equations: parse x(t) and y(t) with math.js and turn them into a fast position function.
import { all, create } from 'mathjs/number';
import type { EquationSource, Params, Vec2 } from './motion';

const math = create(all!);
const compile = math.compile;
// Equations may later arrive in shared links, so switch off the functions that can change math.js itself.
const disabled = () => {
  throw new Error('This function is not available in equations');
};
math.import(
  { import: disabled, createUnit: disabled, evaluate: disabled, parse: disabled, compile: disabled, simplify: disabled, derivative: disabled },
  { override: true },
);

/** What a typed equation can refer to. */
export interface Scope {
  t: number;
  W: number;
  cx: number;
  cy: number;
  a: number;
  b: number;
  c: number;
}

export type PositionFn = (scope: Scope) => Vec2;

export type CompileResult = { ok: true; position: PositionFn } | { ok: false; error: string };

export const MAX_EQUATION_LENGTH = 300;

export function scopeFor(t: number, width: number, params: Params): Scope {
  return { t, W: width, cx: width / 2, cy: 0.5, a: params.a ?? 0, b: params.b ?? 0, c: params.c ?? 0 };
}

function compileOne(axis: 'x' | 'y', source: string): ((scope: Scope) => number) | string {
  if (!source.trim()) return `${axis}(t) is empty`;
  if (source.length > MAX_EQUATION_LENGTH) return `${axis}(t) is longer than ${MAX_EQUATION_LENGTH} characters`;
  let code: { evaluate(scope: object): unknown };
  try {
    code = compile(source);
  } catch (e) {
    return `${axis}(t): ${(e as Error).message}`;
  }
  const fn = (scope: Scope) => code.evaluate({ ...scope }) as number;
  // Try a few moments so a typo such as an unknown name, or a formula that gives no number, is caught now.
  for (const t of [0, 0.37, 1.9, 7.3]) {
    let value: unknown;
    try {
      value = code.evaluate({ ...scopeFor(t, 1.6, { a: 1, b: 2, c: 0.5 }) });
    } catch (e) {
      return `${axis}(t): ${(e as Error).message}`;
    }
    if (typeof value !== 'number') return `${axis}(t) must give a single number`;
  }
  return fn;
}

export function compileEquations(source: EquationSource): CompileResult {
  const x = compileOne('x', source.x);
  if (typeof x === 'string') return { ok: false, error: x };
  const y = compileOne('y', source.y);
  if (typeof y === 'string') return { ok: false, error: y };
  return { ok: true, position: (scope) => ({ x: x(scope), y: y(scope) }) };
}
