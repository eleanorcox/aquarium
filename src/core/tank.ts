// The simulation core. No DOM access: renderers read this state, inputs change it through the methods below.
import { compileEquations, scopeFor, type PositionFn } from './equations';
import { DEFAULT_CUSTOM, MODELS, defaultParams, type EquationSource, type ModelId, type Params, type Vec2 } from './motion';
import { seededRandom } from './random';
import { Grid } from './neighbours';
import {
  DRIFT_FORCE,
  MAX_OFFSET_SPEED,
  REFERENCE_SIZE,
  SIGHT,
  Flock,
  influenceForce,
  limitSpeed,
  routeForce,
  stepWander,
  type FlockRules,
  type Influence,
} from './steering';

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
  /** How much it wanders either side of its route of its own accord: 0 not at all, 1 most. */
  drift: number;
  /** The direction the fish is currently wandering in; drift pushes it this way. */
  wander: Vec2;
  /** Whether it schools with the other schooling fish in sight. */
  schools: boolean;
}

export type Behaviour = Pick<Fish, 'pathStrength' | 'curiosity' | 'drift' | 'schools'>;

const BEHAVIOUR_RANGES = { pathStrength: [0, 1], curiosity: [-1, 1], drift: [0, 1] } as const;
/** Spreads fish evenly around a circle by their order, for parting fish that start in the same place. */
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const NAMES = ['Sina', 'Lissa', 'Orbit', 'Cosmo', 'Theta', 'Pi', 'Euler', 'Fourier', 'Gauss', 'Noether'];
const HUES = [172, 28, 290, 52, 205, 340, 110, 12, 240, 80];
const TRAIL_LENGTH = 240;
const DEFAULT_FISH_SIZE = 0.04;
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
  /** How strongly schooling fish follow each of the three schooling rules. */
  flock: FlockRules = { separation: 1, alignment: 1, cohesion: 1 };
  /** Compiled typed equations by fish id. Kept out of Fish so fish stay plain data. */
  private compiled = new Map<number, PositionFn>();
  /** Ids are never reused, so an id always means the same fish even after others are removed. */
  private nextId = 0;
  /** The schooling fish and a grid of where they are, rebuilt at the start of each step. */
  private school: Fish[] = [];
  private schoolGrid = new Grid(1);
  private schoolVelocity: Vec2[] = [];
  private flocking = new Flock();

  /** Tank units are tank heights, so every tank is 1 tall. A bigger tank is a wider one with smaller fish. */
  readonly height = 1;

  constructor(
    public width = 16 / 9,
    private random: () => number = seededRandom(1),
  ) {}

  addFish(model: ModelId, overrides: Params = {}): Fish {
    const id = this.nextId++;
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
      drift: 0,
      wander: { x: 0, y: 0 },
      schools: false,
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
    if (behaviour.schools !== undefined) fish.schools = behaviour.schools;
    for (const key of Object.keys(BEHAVIOUR_RANGES) as (keyof typeof BEHAVIOUR_RANGES)[]) {
      const value = behaviour[key];
      const [min, max] = BEHAVIOUR_RANGES[key];
      if (value !== undefined) fish[key] = clamp(value, min, max);
    }
  }

  setFlock(rules: Partial<FlockRules>): void {
    Object.assign(this.flock, rules);
  }

  setInfluences(influences: Influence[]): void {
    this.influences = influences;
  }

  /** The tank's size is its own: it is set when the tank is made up, never by the screen showing it. */
  setWidth(width: number): void {
    this.width = width;
    this.clearTrails();
  }

  clearTrails(): void {
    for (const fish of this.fish) fish.trail = [];
  }

  /** Sets what a fish is called and its colour, as when a saved tank is loaded. */
  setLook(id: number, look: { name?: string; hue?: number }): void {
    Object.assign(this.get(id), look);
  }

  setFishSize(id: number, size: number): void {
    this.get(id).size = size;
  }

  /** The middle fish size, which a view uses to decide how far to zoom in. */
  typicalFishSize(): number {
    const sizes = this.fish.map((fish) => fish.size).sort((a, b) => a - b);
    return sizes[Math.floor(sizes.length / 2)] ?? DEFAULT_FISH_SIZE;
  }

  step(dt: number): void {
    // Work out every push from where the fish are now, then move them all, so the order of the fish never matters.
    this.findSchool();
    const forces = this.fish.map((fish) => this.forceOn(fish, dt));
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

  removeFish(id: number): void {
    const fish = this.get(id);
    this.fish.splice(this.fish.indexOf(fish), 1);
    this.compiled.delete(id);
  }

  get(id: number): Fish {
    const fish = this.fish.find((f) => f.id === id);
    if (!fish) throw new Error(`No fish with id ${id}`);
    return fish;
  }

  private wrapsX(fish: Fish): boolean {
    return fish.model === 'custom' || MODELS[fish.model].wraps;
  }

  private wrapsY(fish: Fish): boolean {
    return fish.model === 'custom';
  }

  private forceOn(fish: Fish, dt: number): Vec2 {
    const force = routeForce(fish.offset, fish.offsetVelocity, fish.pathStrength);
    if (fish.drift > 0) {
      stepWander(fish.wander, this.random, dt);
      // A small fish wanders a small distance: drift is measured in fish sizes.
      const strength = (fish.drift * DRIFT_FORCE * fish.size) / REFERENCE_SIZE;
      force.x += strength * fish.wander.x;
      force.y += strength * fish.wander.y;
    }
    for (const influence of this.influences) {
      // Where the tank wraps, an influence just across the edge is close, not a tank-width away.
      const dx = this.wrapsX(fish) ? unwrap(fish.x - influence.x, this.width) : fish.x - influence.x;
      const dy = this.wrapsY(fish) ? unwrap(fish.y - influence.y, 1) : fish.y - influence.y;
      const push = influenceForce(dx, dy, fish.curiosity, influence);
      force.x += push.x;
      force.y += push.y;
    }
    if (fish.schools) {
      const push = this.schoolForce(fish);
      force.x += push.x;
      force.y += push.y;
    }
    return force;
  }

  /** Sorts the schooling fish into a grid, so each can find its schoolmates without checking every other fish. */
  private findSchool(): void {
    this.school = this.fish.filter((fish) => fish.schools);
    const furthestSight = this.school.reduce((max, fish) => Math.max(max, SIGHT * fish.size), 0);
    this.schoolGrid = new Grid(furthestSight || 1);
    // Each fish's velocity is worked out once here, not once for every fish that can see it.
    this.schoolVelocity = this.school.map((fish, i) => {
      this.schoolGrid.insert(i, fish.x, fish.y);
      return { x: fish.speed * Math.cos(fish.heading), y: fish.speed * Math.sin(fish.heading) };
    });
  }

  /** The push on a schooling fish from the schooling fish near it. */
  private schoolForce(fish: Fish): Vec2 {
    const sight = SIGHT * fish.size;
    const wrapsX = this.wrapsX(fish);
    const wrapsY = this.wrapsY(fish);
    this.flocking.start(fish.size, fish.id * GOLDEN_ANGLE);
    let own: Vec2 = { x: 0, y: 0 };
    const look = (x: number, y: number) => {
      for (const index of this.schoolGrid.near(x, y, sight)) {
        const other = this.school[index]!;
        const velocity = this.schoolVelocity[index]!;
        if (other === fish) {
          own = velocity;
          continue;
        }
        const dx = other.x - fish.x;
        const dy = other.y - fish.y;
        this.flocking.add(wrapsX ? unwrap(dx, this.width) : dx, wrapsY ? unwrap(dy, 1) : dy, velocity.x, velocity.y);
      }
    };
    look(fish.x, fish.y);
    // Where the tank wraps, fish just across an edge are near too, so also look from one tank-width away.
    if (wrapsX && fish.x < sight) look(fish.x + this.width, fish.y);
    if (wrapsX && fish.x > this.width - sight) look(fish.x - this.width, fish.y);
    if (wrapsY && fish.y < sight) look(fish.x, fish.y + 1);
    if (wrapsY && fish.y > 1 - sight) look(fish.x, fish.y - 1);
    return this.flocking.force(own.x, own.y, this.flock);
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
