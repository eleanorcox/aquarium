// The simulation core. No DOM access: renderers read this state, inputs change it through the methods below.
import { MODELS, defaultParams, type ModelId, type Params, type Vec2 } from './motion';

export interface Fish {
  id: number;
  name: string;
  hue: number;
  /** Body length in tank units. */
  size: number;
  model: ModelId;
  params: Params;
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

export class Tank {
  t = 0;
  fish: Fish[] = [];

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
    this.place(fish);
    return fish;
  }

  setParam(id: number, key: string, value: number): void {
    const fish = this.get(id);
    fish.params[key] = value;
    fish.trail = [];
  }

  setModel(id: number, model: ModelId): void {
    const fish = this.get(id);
    fish.model = model;
    fish.params = { ...defaultParams(model), x0: fish.params.x0 ?? 0 };
    fish.trail = [];
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

  private place(fish: Fish): void {
    const model = MODELS[fish.model];
    const now = model.position(fish.params, this.t, this.width);
    const next = model.position(fish.params, this.t + DERIVATIVE_STEP, this.width);
    let dx = next.x - now.x;
    // A wrapping fish jumps across the tank; ignore that jump when working out its direction.
    if (model.wraps && Math.abs(dx) > this.width / 2) dx -= Math.sign(dx) * this.width;
    const dy = next.y - now.y;

    const last = fish.trail.at(-1);
    if (last && Math.abs(last.x - now.x) > this.width / 2) fish.trail.push(null);
    fish.trail.push(now);
    if (fish.trail.length > TRAIL_LENGTH) fish.trail.shift();

    fish.x = now.x;
    fish.y = now.y;
    fish.heading = Math.atan2(dy, dx);
    fish.speed = Math.hypot(dx, dy) / DERIVATIVE_STEP;
  }
}
