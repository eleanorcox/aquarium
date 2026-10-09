// Motion models: each one maps parameters and time to a position in tank units.
// Tank units: the tank is 1 tall and `width` wide (width = screen aspect ratio). y points down.

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

/** Equations in math.js syntax. Variables: t, W (tank width), cx, cy (tank centre), a, b, c (sliders). */
export interface EquationSource {
  x: string;
  y: string;
}

export interface MotionModel {
  name: string;
  params: Record<string, ParamSpec>;
  /** True when the path runs off one side of the tank and re-enters on the other. */
  wraps: boolean;
  position(p: Params, t: number, width: number): Vec2;
  /** Human-readable equations with the current values filled in. */
  equation(p: Params): string;
  /** The same path written as typeable equations, used to start a custom equation from this one. */
  source(p: Params): EquationSource;
}

/** Rounds for display: at most two decimal places. */
export const n = (v: number | undefined) => String(Math.round((v ?? 0) * 100) / 100);
/** Formats for typed equations: enough precision that the typed path matches the original. */
const f = (v: number | undefined) => String(Math.round((v ?? 0) * 10000) / 10000);
const wrap = (x: number, w: number) => ((x % w) + w) % w;

const amplitude = (value: number, max = 0.4): ParamSpec => ({ symbol: 'A', label: 'amplitude', min: 0, max, step: 0.01, value });
const omega = (value: number, label = 'angular speed', max = 8): ParamSpec => ({ symbol: 'ω', label, min: -max, max, step: 0.05, value });
const drift = (value: number): ParamSpec => ({ symbol: 'v', label: 'drift speed', min: -0.4, max: 0.4, step: 0.01, value });
const centreLine = (value: number): ParamSpec => ({ symbol: 'y₀', label: 'centre line', min: 0.1, max: 0.9, step: 0.01, value });
const start: ParamSpec = { symbol: 'x₀', label: 'start', min: 0, max: 1, step: 0.01, value: 0 };

export const MODELS = {
  sine: {
    name: 'Sine wave',
    wraps: true,
    params: {
      A: amplitude(0.12),
      w: omega(2, 'angular frequency'),
      phi: { symbol: 'φ', label: 'phase', min: 0, max: 6.28, step: 0.01, value: 0 },
      v: drift(0.12),
      y0: centreLine(0.5),
      x0: start,
    },
    position: (p, t, width) => ({
      x: wrap(p.x0! * width + p.v! * t, width),
      y: p.y0! + p.A! * Math.sin(p.w! * t + p.phi!),
    }),
    equation: (p) => `x(t) = x₀ + ${n(p.v)}·t\ny(t) = ${n(p.y0)} + ${n(p.A)}·sin(${n(p.w)}t + ${n(p.phi)})`,
    source: (p) => ({ x: `${f(p.x0)} * W + ${f(p.v)} * t`, y: `${f(p.y0)} + ${f(p.A)} * sin(${f(p.w)} * t + ${f(p.phi)})` }),
  },
  zigzag: {
    name: 'Zigzag (triangle wave)',
    wraps: true,
    params: { A: amplitude(0.12), w: omega(2, 'angular frequency'), v: drift(0.12), y0: centreLine(0.5), x0: start },
    position: (p, t, width) => ({
      x: wrap(p.x0! * width + p.v! * t, width),
      y: p.y0! + p.A! * (2 / Math.PI) * Math.asin(Math.sin(p.w! * t)),
    }),
    equation: (p) => `x(t) = x₀ + ${n(p.v)}·t\ny(t) = ${n(p.y0)} + ${n(p.A)}·(2/π)·asin(sin(${n(p.w)}t))`,
    source: (p) => ({ x: `${f(p.x0)} * W + ${f(p.v)} * t`, y: `${f(p.y0)} + ${f(p.A)} * (2 / pi) * asin(sin(${f(p.w)} * t))` }),
  },
  bounce: {
    name: 'Bounce',
    wraps: true,
    params: { A: amplitude(0.2), w: omega(2.5, 'bounce rate'), v: drift(0.1), y0: centreLine(0.75), x0: start },
    position: (p, t, width) => ({
      x: wrap(p.x0! * width + p.v! * t, width),
      y: p.y0! - p.A! * Math.abs(Math.sin(p.w! * t)),
    }),
    equation: (p) => `x(t) = x₀ + ${n(p.v)}·t\ny(t) = ${n(p.y0)} − ${n(p.A)}·|sin(${n(p.w)}t)|`,
    source: (p) => ({ x: `${f(p.x0)} * W + ${f(p.v)} * t`, y: `${f(p.y0)} - ${f(p.A)} * abs(sin(${f(p.w)} * t))` }),
  },
  circle: {
    name: 'Circle',
    wraps: false,
    params: {
      R: { symbol: 'R', label: 'radius', min: 0.03, max: 0.45, step: 0.01, value: 0.25 },
      w: omega(0.6, 'angular speed', 3),
      cx: { symbol: 'cₓ', label: 'centre x (fraction of width)', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
      cy: { symbol: 'c_y', label: 'centre y', min: 0.1, max: 0.9, step: 0.01, value: 0.5 },
    },
    position: (p, t, width) => ({
      x: p.cx! * width + p.R! * Math.cos(p.w! * t),
      y: p.cy! + p.R! * Math.sin(p.w! * t),
    }),
    equation: (p) => `x(t) = ${n(p.cx)}·W + ${n(p.R)}·cos(${n(p.w)}t)\ny(t) = ${n(p.cy)} + ${n(p.R)}·sin(${n(p.w)}t)`,
    source: (p) => ({ x: `${f(p.cx)} * W + ${f(p.R)} * cos(${f(p.w)} * t)`, y: `${f(p.cy)} + ${f(p.R)} * sin(${f(p.w)} * t)` }),
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
    source: (p) => ({
      x: `cx + ${f(p.A)} * sin(${f(p.a)} * ${f(p.speed)} * t + ${f(p.delta)})`,
      y: `cy + ${f(p.B)} * sin(${f(p.b)} * ${f(p.speed)} * t)`,
    }),
  },
  figure8: {
    name: 'Figure eight (lemniscate)',
    wraps: false,
    params: { A: amplitude(0.45, 0.7), w: omega(0.5, 'angular speed', 3) },
    position: (p, t, width) => {
      const s = p.w! * t;
      const d = 1 + Math.sin(s) ** 2;
      return { x: width / 2 + (p.A! * Math.cos(s)) / d, y: 0.5 + (p.A! * Math.sin(s) * Math.cos(s)) / d };
    },
    equation: (p) => `s = ${n(p.w)}t\nx(t) = cₓ + ${n(p.A)}·cos s / (1 + sin²s)\ny(t) = c_y + ${n(p.A)}·sin s·cos s / (1 + sin²s)`,
    source: (p) => ({
      x: `cx + ${f(p.A)} * cos(${f(p.w)} * t) / (1 + sin(${f(p.w)} * t)^2)`,
      y: `cy + ${f(p.A)} * sin(${f(p.w)} * t) * cos(${f(p.w)} * t) / (1 + sin(${f(p.w)} * t)^2)`,
    }),
  },
  rose: {
    name: 'Rose curve',
    wraps: false,
    params: {
      R: { symbol: 'R', label: 'petal length', min: 0.05, max: 0.45, step: 0.01, value: 0.35 },
      k: { symbol: 'k', label: 'petal number', min: 1, max: 7, step: 1, value: 3 },
      w: omega(0.3, 'angular speed', 2),
    },
    position: (p, t, width) => {
      const th = p.w! * t;
      const r = p.R! * Math.cos(p.k! * th);
      return { x: width / 2 + r * Math.cos(th), y: 0.5 + r * Math.sin(th) };
    },
    equation: (p) => `θ = ${n(p.w)}t,  r = ${n(p.R)}·cos(${n(p.k)}θ)\nx(t) = cₓ + r·cos θ\ny(t) = c_y + r·sin θ`,
    source: (p) => ({
      x: `cx + ${f(p.R)} * cos(${f(p.k)} * ${f(p.w)} * t) * cos(${f(p.w)} * t)`,
      y: `cy + ${f(p.R)} * cos(${f(p.k)} * ${f(p.w)} * t) * sin(${f(p.w)} * t)`,
    }),
  },
  spirograph: {
    name: 'Spirograph (hypotrochoid)',
    wraps: false,
    params: {
      R: { symbol: 'R', label: 'outer ring radius', min: 0.1, max: 0.45, step: 0.01, value: 0.32 },
      q: { symbol: 'q', label: 'inner wheel size (fraction of R)', min: 0.1, max: 0.9, step: 0.05, value: 0.4 },
      d: { symbol: 'd', label: 'pen distance', min: 0, max: 0.3, step: 0.01, value: 0.12 },
      w: omega(0.4, 'angular speed', 2),
    },
    position: (p, t, width) => {
      const th = p.w! * t;
      const r = p.q! * p.R!;
      const k = (p.R! - r) / r;
      return {
        x: width / 2 + (p.R! - r) * Math.cos(th) + p.d! * Math.cos(k * th),
        y: 0.5 + (p.R! - r) * Math.sin(th) - p.d! * Math.sin(k * th),
      };
    },
    equation: (p) => {
      const r = p.q! * p.R!;
      return `θ = ${n(p.w)}t,  r = ${n(r)}\nx(t) = cₓ + (${n(p.R)} − r)·cos θ + ${n(p.d)}·cos(${n((p.R! - r) / r)}θ)\ny(t) = c_y + (${n(p.R)} − r)·sin θ − ${n(p.d)}·sin(${n((p.R! - r) / r)}θ)`;
    },
    source: (p) => {
      const r = p.q! * p.R!;
      const k = n((p.R! - r) / r);
      return {
        x: `cx + ${f(p.R! - r)} * cos(${f(p.w)} * t) + ${f(p.d)} * cos(${k} * ${f(p.w)} * t)`,
        y: `cy + ${f(p.R! - r)} * sin(${f(p.w)} * t) - ${f(p.d)} * sin(${k} * ${f(p.w)} * t)`,
      };
    },
  },
  spiral: {
    name: 'Breathing spiral',
    wraps: false,
    params: {
      R: { symbol: 'R', label: 'max radius', min: 0.05, max: 0.45, step: 0.01, value: 0.38 },
      w: omega(1.2, 'turn speed', 4),
      nu: { symbol: 'ν', label: 'breathing rate', min: 0.02, max: 1, step: 0.01, value: 0.12 },
    },
    position: (p, t, width) => {
      const r = p.R! * (0.55 + 0.45 * Math.sin(p.nu! * t));
      return { x: width / 2 + r * Math.cos(p.w! * t), y: 0.5 + r * Math.sin(p.w! * t) };
    },
    equation: (p) => `r = ${n(p.R)}·(0.55 + 0.45·sin(${n(p.nu)}t))\nx(t) = cₓ + r·cos(${n(p.w)}t)\ny(t) = c_y + r·sin(${n(p.w)}t)`,
    source: (p) => ({
      x: `cx + ${f(p.R)} * (0.55 + 0.45 * sin(${f(p.nu)} * t)) * cos(${f(p.w)} * t)`,
      y: `cy + ${f(p.R)} * (0.55 + 0.45 * sin(${f(p.nu)} * t)) * sin(${f(p.w)} * t)`,
    }),
  },
  heart: {
    name: 'Heart',
    wraps: false,
    params: {
      S: { symbol: 'S', label: 'size', min: 0.005, max: 0.025, step: 0.001, value: 0.017 },
      w: omega(0.5, 'speed', 2),
    },
    position: (p, t, width) => {
      const s = p.w! * t;
      return {
        x: width / 2 + p.S! * 16 * Math.sin(s) ** 3,
        y: 0.5 - p.S! * (13 * Math.cos(s) - 5 * Math.cos(2 * s) - 2 * Math.cos(3 * s) - Math.cos(4 * s)),
      };
    },
    equation: (p) =>
      `s = ${n(p.w)}t\nx(t) = cₓ + ${p.S}·16·sin³s\ny(t) = c_y − ${p.S}·(13cos s − 5cos 2s − 2cos 3s − cos 4s)`,
    source: (p) => ({
      x: `cx + ${f(p.S)} * 16 * sin(${f(p.w)} * t)^3`,
      y: `cy - ${f(p.S)} * (13 * cos(${f(p.w)} * t) - 5 * cos(2 * ${f(p.w)} * t) - 2 * cos(3 * ${f(p.w)} * t) - cos(4 * ${f(p.w)} * t))`,
    }),
  },
} satisfies Record<string, MotionModel>;

export type BuiltinId = keyof typeof MODELS;
export type ModelId = BuiltinId | 'custom';

/** Sliders available inside a typed equation as a, b and c. */
export const CUSTOM_PARAMS: Record<string, ParamSpec> = {
  a: { symbol: 'a', label: 'slider a', min: -5, max: 5, step: 0.01, value: 1 },
  b: { symbol: 'b', label: 'slider b', min: -5, max: 5, step: 0.01, value: 2 },
  c: { symbol: 'c', label: 'slider c', min: -5, max: 5, step: 0.01, value: 0.5 },
};

export const DEFAULT_CUSTOM: EquationSource = {
  x: 'cx + 0.4 * sin(a * t / 2)',
  y: 'cy + 0.2 * sin(b * t) * cos(c * t)',
};

export const MODEL_NAMES: Record<ModelId, string> = {
  ...(Object.fromEntries(Object.entries(MODELS).map(([id, m]) => [id, m.name])) as Record<BuiltinId, string>),
  custom: 'Your own equation',
};

export function paramSpecs(model: ModelId): Record<string, ParamSpec> {
  return model === 'custom' ? CUSTOM_PARAMS : MODELS[model].params;
}

export function defaultParams(model: ModelId): Params {
  const out: Params = {};
  for (const [key, spec] of Object.entries(paramSpecs(model))) out[key] = spec.value;
  return out;
}
