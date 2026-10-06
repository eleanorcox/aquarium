// Motion models: each one maps parameters and time to a position in tank units.
// Tank units: the tank is 1 tall and `width` wide (width = screen aspect ratio).

export interface Vec2 {
  x: number;
  y: number;
}

export interface ParamSpec {
  symbol: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export type Params = Record<string, number>;

export interface MotionModel {
  name: string;
  params: Record<string, ParamSpec>;
  /** True when the path runs off one side of the tank and re-enters on the other. */
  wraps: boolean;
  position(p: Params, t: number, width: number): Vec2;
  /** Human-readable equations with the current values filled in. */
  equation(p: Params): string;
}

const n = (v: number | undefined) => String(Math.round((v ?? 0) * 100) / 100);
const wrap = (x: number, w: number) => ((x % w) + w) % w;

export const MODELS = {
  sine: {
    name: 'Sine wave',
    wraps: true,
    params: {
      A: { symbol: 'A', label: 'amplitude', min: 0, max: 0.4, step: 0.01, value: 0.12 },
      w: { symbol: 'ω', label: 'angular frequency', min: 0.2, max: 8, step: 0.1, value: 2 },
      phi: { symbol: 'φ', label: 'phase', min: 0, max: 6.28, step: 0.01, value: 0 },
      v: { symbol: 'v', label: 'drift speed', min: -0.4, max: 0.4, step: 0.01, value: 0.12 },
      y0: { symbol: 'y₀', label: 'centre line', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
      x0: { symbol: 'x₀', label: 'start', min: 0, max: 1, step: 0.01, value: 0 },
    },
    position: (p, t, width) => ({
      x: wrap(p.x0! * width + p.v! * t, width),
      y: p.y0! + p.A! * Math.sin(p.w! * t + p.phi!),
    }),
    equation: (p) => `x(t) = x₀ + ${n(p.v)}·t\ny(t) = ${n(p.y0)} + ${n(p.A)}·sin(${n(p.w)}t + ${n(p.phi)})`,
  },
  lissajous: {
    name: 'Lissajous figure',
    wraps: false,
    params: {
      A: { symbol: 'A', label: 'x amplitude', min: 0.05, max: 0.8, step: 0.01, value: 0.35 },
      B: { symbol: 'B', label: 'y amplitude', min: 0.05, max: 0.45, step: 0.01, value: 0.3 },
      a: { symbol: 'a', label: 'x frequency', min: 1, max: 5, step: 1, value: 1 },
      b: { symbol: 'b', label: 'y frequency', min: 1, max: 5, step: 1, value: 2 },
      delta: { symbol: 'δ', label: 'phase shift', min: 0, max: 6.28, step: 0.01, value: 1.57 },
      speed: { symbol: 's', label: 'time scale', min: 0.05, max: 2, step: 0.05, value: 0.4 },
    },
    position: (p, t, width) => {
      const s = p.speed! * t;
      return { x: width / 2 + p.A! * Math.sin(p.a! * s + p.delta!), y: 0.5 + p.B! * Math.sin(p.b! * s) };
    },
    equation: (p) =>
      `x(t) = cₓ + ${n(p.A)}·sin(${n(p.a)}·s + ${n(p.delta)})\ny(t) = c_y + ${n(p.B)}·sin(${n(p.b)}·s)\ns = ${n(p.speed)}·t`,
  },
  circle: {
    name: 'Circle',
    wraps: false,
    params: {
      R: { symbol: 'R', label: 'radius', min: 0.03, max: 0.45, step: 0.01, value: 0.25 },
      w: { symbol: 'ω', label: 'angular speed', min: -3, max: 3, step: 0.05, value: 0.6 },
      cx: { symbol: 'cₓ', label: 'centre x (fraction of width)', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
      cy: { symbol: 'c_y', label: 'centre y', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
    },
    position: (p, t, width) => ({
      x: p.cx! * width + p.R! * Math.cos(p.w! * t),
      y: p.cy! + p.R! * Math.sin(p.w! * t),
    }),
    equation: (p) => `x(t) = ${n(p.cx)}·W + ${n(p.R)}·cos(${n(p.w)}t)\ny(t) = ${n(p.cy)} + ${n(p.R)}·sin(${n(p.w)}t)`,
  },
} satisfies Record<string, MotionModel>;

export type ModelId = keyof typeof MODELS;

export function defaultParams(model: ModelId): Params {
  const out: Params = {};
  for (const [key, spec] of Object.entries(MODELS[model].params)) out[key] = spec.value;
  return out;
}
