// Steering: what moves a fish off its route, and what brings it back.
// A fish's position is its route position plus an offset. The offset is pulled back to zero by a spring
// and pushed around by influences, so an unpushed fish is exactly on its route.
// The strengths below are first guesses to be tuned by eye. Units are tank units and seconds.
import type { Vec2 } from './motion';

/** Something in the tank that fish react to: a pointer, a hand, a person. */
export interface Influence {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** How far its effect reaches. */
  radius: number;
  /** Overrides each fish's own temperament: every fish in reach is drawn in or driven off. */
  effect?: 'attract' | 'scatter';
  /** What it is, for drawing only: the fish do not care. */
  kind?: 'pointer' | 'hand' | 'motion';
  /** For a hand, the shape it is making. */
  shape?: 'open' | 'fist';
}

/** Pull back to the route, per unit of offset, at full path strength. */
export const ROUTE_STIFFNESS = 60;
/** The fish size the strengths below were set for. Drift and schooling distances scale from it. */
export const REFERENCE_SIZE = 0.04;
/**
 * Push or pull on a fully shy or fully curious fish right beside an influence, per unit of the
 * influence's radius. A short reach pushes less hard, so its effect stays the same size on screen.
 */
export const INFLUENCE_PUSH = 24;
/** An influence moving faster than this scatters every fish, curious or not. Three tank heights a second. */
export const STARTLE_SPEED = 3;
/** A curious fish eases off inside this fraction of the radius, so it stops short of the influence. */
export const STANDOFF = 0.3;
/** Top speed of a fish relative to its route. */
export const MAX_OFFSET_SPEED = 1.5;

/** The pull back towards the route for a fish displaced by `offset`. */
export function routeForce(offset: Vec2, offsetVelocity: Vec2, pathStrength: number): Vec2 {
  const stiffness = ROUTE_STIFFNESS * pathStrength;
  // Enough drag that a fish at full path strength settles on its route without swinging past it.
  // The drag does not weaken with path strength, so a fish that barely holds its route drifts back
  // slowly, and a curious one settles beside an influence instead of wobbling around it.
  const damping = 2 * Math.sqrt(ROUTE_STIFFNESS);
  return {
    x: -stiffness * offset.x - damping * offsetVelocity.x,
    y: -stiffness * offset.y - damping * offsetVelocity.y,
  };
}

/** The push on a fish from one influence. `dx`, `dy` point from the influence to the fish. */
export function influenceForce(dx: number, dy: number, curiosity: number, influence: Influence): Vec2 {
  const distance = Math.hypot(dx, dy);
  if (distance >= influence.radius) return { x: 0, y: 0 };
  const startled = Math.hypot(influence.vx, influence.vy) > STARTLE_SPEED;
  const pull = startled || influence.effect === 'scatter' ? -1 : influence.effect === 'attract' ? 1 : curiosity;
  // Strongest beside the influence, fading to nothing at the edge of its reach.
  const reach = 1 - distance / influence.radius;
  const easeOff = pull > 0 ? Math.min(1, distance / (STANDOFF * influence.radius)) : 1;
  const away = -pull * INFLUENCE_PUSH * influence.radius * reach * easeOff;
  // A fish exactly on the influence has no direction to flee in, so pick one.
  return distance === 0 ? { x: away, y: 0 } : { x: (dx / distance) * away, y: (dy / distance) * away };
}

/** Push on a fully drifting fish of the reference size when its wander is at its strongest along one axis. */
export const DRIFT_FORCE = 2.5;
/** Seconds over which a fish's wander forgets where it was heading. */
const WANDER_MEMORY = 1.5;
/** How hard the wander is jostled each second. */
const WANDER_JITTER = 1.2;

/**
 * Moves a fish's wander on by one step. The wander is a direction that changes slowly and never
 * repeats, each axis staying between -1 and 1. Drift pushes the fish along it.
 */
export function stepWander(wander: Vec2, random: () => number, dt: number): void {
  for (const axis of ['x', 'y'] as const) {
    const jostle = WANDER_JITTER * (random() * 2 - 1) * Math.sqrt(dt);
    wander[axis] = Math.min(1, Math.max(-1, wander[axis] - (wander[axis] / WANDER_MEMORY) * dt + jostle));
  }
}

/** How strongly each schooling rule applies: 0 switches a rule off, 1 is its normal strength. */
export interface FlockRules {
  separation: number;
  alignment: number;
  cohesion: number;
}

/** How far a schooling fish notices other schooling fish, as a multiple of its own size. */
export const SIGHT = 6;
/** Schooling fish closer than this push apart, as a multiple of the fish's own size. */
export const PERSONAL_SPACE = 2;
const SEPARATION_FORCE = 8;
const ALIGNMENT_FORCE = 2;
const COHESION_FORCE = 4;

/**
 * How many of its nearest schoolmates a fish lines up with and moves towards. Studies of real fish find
 * they react to one to three neighbours, not to everyone in sight (docs/research/fish-motion.md).
 */
export const NEIGHBOURS = 3;

/**
 * The three schooling rules for one fish: keep clear of any schoolmate that is too close, match the
 * heading of its nearest few in sight, and move towards their middle.
 * Distances scale with the fish's `size`, so small fish school more tightly than large ones.
 *
 * A fish in a large school has hundreds of schoolmates in sight, so this is the busiest loop in the
 * simulation. A Flock is filled one schoolmate at a time and reused from fish to fish, creating nothing.
 */
export class Flock {
  private sight = 0;
  private personalSpace = 0;
  private tiebreak = 0;
  private pushX = 0;
  private pushY = 0;
  /** The nearest schoolmates so far, nearest first: squared distance, offset and velocity, five numbers each. */
  private count = 0;
  private near = new Float64Array(NEIGHBOURS * 5);

  /** Starts again for a fish of this size. `tiebreak` is an angle unique to the fish, used to part fish in exactly the same place. */
  start(size: number, tiebreak: number): void {
    this.sight = SIGHT * size;
    this.personalSpace = PERSONAL_SPACE * size;
    this.tiebreak = tiebreak;
    this.count = this.pushX = this.pushY = 0;
  }

  /** Takes account of one schoolmate: `dx`, `dy` point from the fish to it, and `vx`, `vy` is its velocity. */
  add(dx: number, dy: number, vx: number, vy: number): void {
    const d2 = dx * dx + dy * dy;
    if (d2 >= this.sight * this.sight) return;
    // Anything too close is pushed away from, whether or not it is one of the nearest few.
    if (d2 < this.personalSpace * this.personalSpace) {
      const distance = Math.sqrt(d2);
      const push = SEPARATION_FORCE * (1 - distance / this.personalSpace);
      this.pushX -= (distance === 0 ? Math.cos(this.tiebreak) : dx / distance) * push;
      this.pushY -= (distance === 0 ? Math.sin(this.tiebreak) : dy / distance) * push;
    }
    // Keep the nearest few, nearest first, by sliding further ones down the list.
    const near = this.near;
    if (this.count === NEIGHBOURS && d2 >= near[(NEIGHBOURS - 1) * 5]!) return;
    let slot = Math.min(this.count, NEIGHBOURS - 1);
    while (slot > 0 && near[(slot - 1) * 5]! > d2) {
      near.copyWithin(slot * 5, (slot - 1) * 5, slot * 5);
      slot--;
    }
    near.set([d2, dx, dy, vx, vy], slot * 5);
    this.count = Math.min(this.count + 1, NEIGHBOURS);
  }

  /** The resulting push on the fish, given its own velocity and how strongly each rule applies. */
  force(velocityX: number, velocityY: number, rules: FlockRules): Vec2 {
    const force = { x: rules.separation * this.pushX, y: rules.separation * this.pushY };
    if (this.count === 0) return force;
    let dx = 0;
    let dy = 0;
    let vx = 0;
    let vy = 0;
    for (let i = 0; i < this.count; i++) {
      dx += this.near[i * 5 + 1]!;
      dy += this.near[i * 5 + 2]!;
      vx += this.near[i * 5 + 3]!;
      vy += this.near[i * 5 + 4]!;
    }
    force.x += rules.alignment * ALIGNMENT_FORCE * (vx / this.count - velocityX);
    force.y += rules.alignment * ALIGNMENT_FORCE * (vy / this.count - velocityY);
    force.x += (rules.cohesion * COHESION_FORCE * dx) / this.count;
    force.y += (rules.cohesion * COHESION_FORCE * dy) / this.count;
    return force;
  }
}

/** Limits a velocity to a top speed, keeping its direction. */
export function limitSpeed(velocity: Vec2, max: number): void {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed > max) {
    velocity.x *= max / speed;
    velocity.y *= max / speed;
  }
}

/** How quickly a free fish gets back to its cruising speed after being pushed faster or slower, per second. */
const CRUISE_GRIP = 1.5;
/** A free fish starts turning away from an edge this far from it, in tank heights. */
const WALL_MARGIN = 0.15;
/** Push away from an edge on a free fish touching it, fading to nothing at the margin. */
const WALL_FORCE = 3;
/** Pull back into its depth range on a free fish outside it, per tank height outside. */
const DEPTH_PULL = 8;
/** How strongly a free fish levels out when climbing or diving, per second. Fish mostly swim level. */
const LEVELLING = 1.5;
/** Fastest a fully drifting free fish turns of its own accord, in radians a second. */
export const FREE_TURN = 1.5;

/** How much harder free fish school than fish on routes, found by trying 1, 2, 3 and 5 on a free school of 30. */
export const FREE_SCHOOLING = 2;

/** What a free fish is doing now, and what it would like to do. */
export interface FreeSwimmer {
  x: number;
  y: number;
  velocity: Vec2;
  /** The way it faces, used when it is not moving. */
  heading: number;
  /** Its cruising speed, preferred depth and how far either side of that depth it will go. */
  cruise: number;
  depth: number;
  range: number;
  /** How hard it is turning of its own accord, from -1 to 1: drift times its wander. */
  turn: number;
}

/**
 * The pushes a fish with no route gives itself: keep up its cruising speed in the way it is going, turn
 * now and then as it wanders, turn away from the tank's edges, and keep to its depths.
 */
export function freeForce(fish: FreeSwimmer, width: number): Vec2 {
  const speed = Math.hypot(fish.velocity.x, fish.velocity.y);
  const ahead = speed > 1e-6 ? { x: fish.velocity.x / speed, y: fish.velocity.y / speed } : { x: Math.cos(fish.heading), y: Math.sin(fish.heading) };
  const force = {
    x: CRUISE_GRIP * (fish.cruise * ahead.x - fish.velocity.x),
    y: CRUISE_GRIP * (fish.cruise * ahead.y - fish.velocity.y),
  };
  // Wandering turns the fish rather than pushing it sideways, so it curves at the same rate whatever its speed.
  const sideways = FREE_TURN * fish.turn * Math.max(speed, fish.cruise);
  force.x += -ahead.y * sideways;
  force.y += ahead.x * sideways;
  // Climbing or diving, it turns back towards level.
  const level = -LEVELLING * fish.velocity.y * Math.sign(ahead.x || 1);
  force.x += -ahead.y * level;
  force.y += ahead.x * level;
  // Edges and depth say which way the fish should be going. It turns that way rather than braking, as a
  // fish does; heading straight at an edge, it turns left.
  const away = (distance: number) => (distance < WALL_MARGIN ? WALL_FORCE * (1 - distance / WALL_MARGIN) : 0);
  const keepIn = { x: away(fish.x) - away(width - fish.x), y: away(fish.y) - away(1 - fish.y) };
  const above = fish.depth - fish.range - fish.y;
  const below = fish.y - fish.depth - fish.range;
  if (above > 0) keepIn.y += DEPTH_PULL * above;
  if (below > 0) keepIn.y -= DEPTH_PULL * below;
  const across = keepIn.x * -ahead.y + keepIn.y * ahead.x;
  const towards = keepIn.x * ahead.x + keepIn.y * ahead.y;
  if (towards < 0) {
    // Going the wrong way: turn as hard as the whole push, in whichever direction it leans.
    const turn = Math.hypot(keepIn.x, keepIn.y) * (across < 0 ? -1 : 1);
    force.x += -ahead.y * turn;
    force.y += ahead.x * turn;
  } else {
    force.x += -ahead.y * across;
    force.y += ahead.x * across;
  }
  return force;
}
