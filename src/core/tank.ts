// The simulation core. No DOM access: renderers read this state, inputs change it through the methods below.
import { compileEquations, scopeFor, type PositionFn } from './equations';
import { DEFAULT_CUSTOM, MODELS, defaultParams, type EquationSource, type ModelId, type Params, type Vec2 } from './motion';

export interface Fish {
  id: number;
  name: string;
  hue: number;
  /** Body length in tank units. */
  size: number;
  model: ModelId;
  params: Params;
  /** The typed equations, when model is 'custom'. */
  equations?: EquationSource;
  x: number;
  y: number;
  /** Direction of travel in radians, from the derivative of the path. */
  heading: number;
  speed: number;
  /** Recent positions; null marks a break where the fish wrapped across the tank. */
  trail: (Vec2 | null)[];
}

const NAMES = ['Sina', 'Lissa', 'Orbit', 'Cosmo', 'Theta', 'Pi', 'Euler', 'Fourier', 'Gauss', 'Noether'];
const HUES = [172, 28, 290, 52, 205, 340, 110, 12, 240, 80];
const TRAIL_LENGTH = 240;
const DERIVATIVE_STEP = 0.01;

const wrap = (v: number, size: number) => ((v % size) + size) % size;
/** Turns a step across a wrapped edge back into the short step it really was. */
const unwrap = (d: number, size: number) => (Math.abs(d) > size / 2 ? d - Math.sign(d) * size : d);

export class Tank {
  t = 0;
  fish: Fish[] = [];
  /** Compiled typed equations by fish id. Kept out of Fish so fish stay plain data. */
  private compiled = new Map<number, PositionFn>();

  constructor(
    public width = 1.6,
    private random: () => number = Math.random,
  ) {}

  addFish(model: ModelId, overrides: Params = {}): Fish {
    const id = this.fish.length;
    const fish: Fish = {
      id,
      name: (NAMES[id % NAMES.length] ?? 'Fish') + (id >= NAMES.length ? ` ${id + 1}` : ''),
      hue: HUES[id % HUES.length] ?? 0,
      size: 0.035 + this.random() * 0.015,
      model,
      params: { ...defaultParams(model), x0: this.random(), ...overrides },
      x: 0,
      y: 0,
      heading: 0,
      speed: 0,
      trail: [],
    };
    this.fish.push(fish);
    if (model === 'custom') this.setEquations(id, DEFAULT_CUSTOM);
    this.place(fish);
    return fish;
  }

  setParam(id: number, key: string, value: number): void {
    const fish = this.get(id);
    fish.params[key] = value;
    fish.trail = [];
  }

  /** Switching to 'custom' starts from the current path written as equations, so you can edit it. */
  setModel(id: number, model: ModelId): void {
    const fish = this.get(id);
    if (model === 'custom' && fish.model !== 'custom') {
      const start = MODELS[fish.model].source(fish.params);
      if (this.setEquations(id, start) !== null) this.setEquations(id, DEFAULT_CUSTOM);
    }
    fish.model = model;
    fish.params = { ...defaultParams(model), x0: fish.params.x0 ?? 0 };
    fish.trail = [];
  }

  /** Returns an error message and leaves the fish unchanged if the equations do not work. */
  setEquations(id: number, equations: EquationSource): string | null {
    const fish = this.get(id);
    const result = compileEquations(equations);
    if (!result.ok) return result.error;
    this.compiled.set(id, result.position);
    fish.equations = { ...equations };
    fish.trail = [];
    return null;
  }

  resize(width: number): void {
    this.width = width;
    for (const fish of this.fish) fish.trail = [];
  }

  step(dt: number): void {
    this.t += dt;
    for (const fish of this.fish) this.place(fish);
  }

  get(id: number): Fish {
    const fish = this.fish[id];
    if (!fish) throw new Error(`No fish with id ${id}`);
    return fish;
  }

  private positionAt(fish: Fish, t: number): Vec2 {
    if (fish.model !== 'custom') return MODELS[fish.model].position(fish.params, t, this.width);
    const position = this.compiled.get(fish.id);
    if (!position) return { x: fish.x, y: fish.y };
    const p = position(scopeFor(t, this.width, fish.params));
    // Typed equations can go anywhere, so wrap both axes to keep the fish in the tank.
    return { x: wrap(p.x, this.width), y: wrap(p.y, 1) };
  }

  private place(fish: Fish): void {
    const now = this.positionAt(fish, this.t);
    const next = this.positionAt(fish, this.t + DERIVATIVE_STEP);
    // A typed equation can divide by zero or similar at some moments; hold position until it recovers.
    if (![now.x, now.y, next.x, next.y].every(Number.isFinite)) return;
    // A wrapping fish jumps across the tank; ignore that jump when working out its direction.
    const dx = unwrap(next.x - now.x, this.width);
    const dy = unwrap(next.y - now.y, 1);

    const last = fish.trail.at(-1);
    if (last && (Math.abs(last.x - now.x) > this.width / 2 || Math.abs(last.y - now.y) > 0.5)) fish.trail.push(null);
    fish.trail.push(now);
    if (fish.trail.length > TRAIL_LENGTH) fish.trail.shift();

    fish.x = now.x;
    fish.y = now.y;
    fish.heading = Math.atan2(dy, dx);
    fish.speed = Math.hypot(dx, dy) / DERIVATIVE_STEP;
  }
}
