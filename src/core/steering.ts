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
}

/** Pull back to the route, per unit of offset, at full path strength. */
export const ROUTE_STIFFNESS = 60;
/** Push or pull on a fully shy or fully curious fish right beside an influence. */
export const INFLUENCE_FORCE = 6;
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
  const away = -pull * INFLUENCE_FORCE * reach * easeOff;
  // A fish exactly on the influence has no direction to flee in, so pick one.
  return distance === 0 ? { x: away, y: 0 } : { x: (dx / distance) * away, y: (dy / distance) * away };
}

/** Push on a fully drifting fish when its wander is at its strongest along one axis. */
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

/** Another schooling fish, as seen by the fish being steered. */
export interface Schoolmate {
  /** From the fish to its schoolmate. */
  dx: number;
  dy: number;
  /** The schoolmate's velocity. */
  vx: number;
  vy: number;
}

/** How far a schooling fish notices other schooling fish. */
export const SIGHT = 0.25;
/** Schooling fish closer than this push apart. About two fish lengths. */
export const PERSONAL_SPACE = 0.08;
const SEPARATION_FORCE = 8;
const ALIGNMENT_FORCE = 2;
const COHESION_FORCE = 4;

/**
 * The three schooling rules for one fish: keep clear of schoolmates that are too close, match the
 * average heading of those in sight, and move towards their middle.
 * `tiebreak` is an angle unique to the fish, used to part fish that are in exactly the same place.
 */
export function flockForce(mates: Schoolmate[], velocity: Vec2, rules: FlockRules, tiebreak: number): Vec2 {
  const force = { x: 0, y: 0 };
  let inSight = 0;
  const sum = { dx: 0, dy: 0, vx: 0, vy: 0 };
  for (const mate of mates) {
    const distance = Math.hypot(mate.dx, mate.dy);
    if (distance >= SIGHT) continue;
    inSight++;
    sum.dx += mate.dx;
    sum.dy += mate.dy;
    sum.vx += mate.vx;
    sum.vy += mate.vy;
    if (distance < PERSONAL_SPACE) {
      const push = rules.separation * SEPARATION_FORCE * (1 - distance / PERSONAL_SPACE);
      force.x -= (distance === 0 ? Math.cos(tiebreak) : mate.dx / distance) * push;
      force.y -= (distance === 0 ? Math.sin(tiebreak) : mate.dy / distance) * push;
    }
  }
  if (inSight === 0) return force;
  force.x += rules.alignment * ALIGNMENT_FORCE * (sum.vx / inSight - velocity.x);
  force.y += rules.alignment * ALIGNMENT_FORCE * (sum.vy / inSight - velocity.y);
  force.x += (rules.cohesion * COHESION_FORCE * sum.dx) / inSight;
  force.y += (rules.cohesion * COHESION_FORCE * sum.dy) / inSight;
  return force;
}

/** Limits a velocity to a top speed, keeping its direction. */
export function limitSpeed(velocity: Vec2, max: number): void {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed > max) {
    velocity.x *= max / speed;
    velocity.y *= max / speed;
  }
}
