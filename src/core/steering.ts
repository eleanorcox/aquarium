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
/** An influence moving faster than this scatters every fish, curious or not. */
export const STARTLE_SPEED = 1.5;
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

/** Limits a velocity to a top speed, keeping its direction. */
export function limitSpeed(velocity: Vec2, max: number): void {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed > max) {
    velocity.x *= max / speed;
    velocity.y *= max / speed;
  }
}
