// The simulation core. No DOM access: renderers read this state, inputs change it through the methods below.
import { compileEquations, scopeFor, type PositionFn } from './equations';
import { DEFAULT_CUSTOM, MODELS, defaultParams, type EquationSource, type ModelId, type Params, type Vec2 } from './motion';
import { MAX_OFFSET_SPEED, influenceForce, limitSpeed, routeForce, type Influence } from './steering';

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
  /** How far the fish has been pushed from its route. Zero means it is exactly on it. */
  offset: Vec2;
  offsetVelocity: Vec2;
  /** How hard it holds to its route: 0 not at all, 1 fully. */
  pathStrength: number;
  /** How it responds to an influence: -1 shy (flees), 0 takes no notice, 1 curious (approaches). */
  curiosity: number;
}

export type Behaviour = Pick<Fish, 'pathStrength' | 'curiosity'>;

const BEHAVIOUR_RANGES: Record<keyof Behaviour, [number, number]> = { pathStrength: [0, 1], curiosity: [-1, 1] };

const NAMES = ['Sina', 'Lissa', 'Orbit', 'Cosmo', 'Theta', 'Pi', 'Euler', 'Fourier', 'Gauss', 'Noether'];
const HUES = [172, 28, 290, 52, 205, 340, 110, 12, 240, 80];
const TRAIL_LENGTH = 240;
const DERIVATIVE_STEP = 0.01;

const wrap = (v: number, size: number) => ((v % size) + size) % size;
/** Turns a step across a wrapped edge back into the short step it really was. */
const unwrap = (d: number, size: number) => (Math.abs(d) > size / 2 ? d - Math.sign(d) * size : d);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export class Tank {
  t = 0;
  fish: Fish[] = [];
  /** What the fish are reacting to right now. Inputs replace this list as pointers and hands move. */
  influences: Influence[] = [];
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
      offset: { x: 0, y: 0 },
      offsetVelocity: { x: 0, y: 0 },
      pathStrength: 1,
      curiosity: 0,
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

  /** Values outside a setting's range are brought to its nearest end. */
  setBehaviour(id: number, behaviour: Partial<Behaviour>): void {
    const fish = this.get(id);
    for (const key of Object.keys(behaviour) as (keyof Behaviour)[]) {
      const value = behaviour[key];
      if (value !== undefined) fish[key] = clamp(value, ...BEHAVIOUR_RANGES[key]);
    }
  }

  setInfluences(influences: Influence[]): void {
    this.influences = influences;
  }

  resize(width: number): void {
    this.width = width;
    for (const fish of this.fish) fish.trail = [];
  }

  step(dt: number): void {
    // Work out every push from where the fish are now, then move them all, so the order of the fish never matters.
    const forces = this.fish.map((fish) => this.forceOn(fish));
    this.t += dt;
    this.fish.forEach((fish, i) => {
      const force = forces[i]!;
      fish.offsetVelocity.x += force.x * dt;
      fish.offsetVelocity.y += force.y * dt;
      limitSpeed(fish.offsetVelocity, MAX_OFFSET_SPEED);
      fish.offset.x += fish.offsetVelocity.x * dt;
      fish.offset.y += fish.offsetVelocity.y * dt;
      this.place(fish);
    });
  }

  get(id: number): Fish {
    const fish = this.fish[id];
    if (!fish) throw new Error(`No fish with id ${id}`);
    return fish;
  }

  private wrapsX(fish: Fish): boolean {
    return fish.model === 'custom' || MODELS[fish.model].wraps;
  }

  private wrapsY(fish: Fish): boolean {
    return fish.model === 'custom';
  }

  private forceOn(fish: Fish): Vec2 {
    const force = routeForce(fish.offset, fish.offsetVelocity, fish.pathStrength);
    for (const influence of this.influences) {
      // Where the tank wraps, an influence just across the edge is close, not a tank-width away.
      const dx = this.wrapsX(fish) ? unwrap(fish.x - influence.x, this.width) : fish.x - influence.x;
      const dy = this.wrapsY(fish) ? unwrap(fish.y - influence.y, 1) : fish.y - influence.y;
      const push = influenceForce(dx, dy, fish.curiosity, influence);
      force.x += push.x;
      force.y += push.y;
    }
    return force;
  }

  /**
   * Adds the fish's offset to its route position along one axis. On a wrapping axis the fish re-enters
   * on the far side. Otherwise the offset may not carry it out of the tank, and it stops at the edge.
   */
  private offsetAlong(fish: Fish, axis: 'x' | 'y', route: number, size: number, wraps: boolean): number {
    const pushed = route + fish.offset[axis];
    if (wraps) return pushed < 0 || pushed >= size ? wrap(pushed, size) : pushed;
    // A route that itself leaves the tank is respected; only the offset is held back.
    const held = clamp(pushed, Math.min(0, route), Math.max(size, route));
    if (held !== pushed) {
      fish.offset[axis] = held - route;
      fish.offsetVelocity[axis] = 0;
    }
    return held;
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
    const route = this.positionAt(fish, this.t);
    const next = this.positionAt(fish, this.t + DERIVATIVE_STEP);
    // A typed equation can divide by zero or similar at some moments; hold position until it recovers.
    if (![route.x, route.y, next.x, next.y].every(Number.isFinite)) return;
    const now = {
      x: this.offsetAlong(fish, 'x', route.x, this.width, this.wrapsX(fish)),
      y: this.offsetAlong(fish, 'y', route.y, 1, this.wrapsY(fish)),
    };
    // The fish's own movement is its route's movement plus its movement relative to the route.
    // A wrapping route jumps across the tank; ignore that jump when working out its direction.
    const dx = unwrap(next.x - route.x, this.width) + fish.offsetVelocity.x * DERIVATIVE_STEP;
    const dy = unwrap(next.y - route.y, 1) + fish.offsetVelocity.y * DERIVATIVE_STEP;

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
