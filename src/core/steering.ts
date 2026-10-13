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
 * The three schooling rules for one fish: keep clear of schoolmates that are too close, match the
 * average heading of those in sight, and move towards their middle.
 * Distances scale with the fish's `size`, so small fish school more tightly than large ones.
 *
 * A fish in a large school has hundreds of schoolmates in sight, so this is the busiest loop in the
 * simulation. A Flock is filled one schoolmate at a time and reused from fish to fish, creating nothing.
 */
export class Flock {
  private sight = 0;
  private personalSpace = 0;
  private tiebreak = 0;
  private inSight = 0;
  private pushX = 0;
  private pushY = 0;
  private sumDx = 0;
  private sumDy = 0;
  private sumVx = 0;
  private sumVy = 0;

  /** Starts again for a fish of this size. `tiebreak` is an angle unique to the fish, used to part fish in exactly the same place. */
  start(size: number, tiebreak: number): void {
    this.sight = SIGHT * size;
    this.personalSpace = PERSONAL_SPACE * size;
    this.tiebreak = tiebreak;
    this.inSight = this.pushX = this.pushY = this.sumDx = this.sumDy = this.sumVx = this.sumVy = 0;
  }

  /** Takes account of one schoolmate: `dx`, `dy` point from the fish to it, and `vx`, `vy` is its velocity. */
  add(dx: number, dy: number, vx: number, vy: number): void {
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= this.sight * this.sight) return;
    this.inSight++;
    this.sumDx += dx;
    this.sumDy += dy;
    this.sumVx += vx;
    this.sumVy += vy;
    if (distanceSquared < this.personalSpace * this.personalSpace) {
      const distance = Math.sqrt(distanceSquared);
      const push = SEPARATION_FORCE * (1 - distance / this.personalSpace);
      this.pushX -= (distance === 0 ? Math.cos(this.tiebreak) : dx / distance) * push;
      this.pushY -= (distance === 0 ? Math.sin(this.tiebreak) : dy / distance) * push;
    }
  }

  /** The resulting push on the fish, given its own velocity and how strongly each rule applies. */
  force(velocityX: number, velocityY: number, rules: FlockRules): Vec2 {
    const force = { x: rules.separation * this.pushX, y: rules.separation * this.pushY };
    if (this.inSight === 0) return force;
    force.x += rules.alignment * ALIGNMENT_FORCE * (this.sumVx / this.inSight - velocityX);
    force.y += rules.alignment * ALIGNMENT_FORCE * (this.sumVy / this.inSight - velocityY);
    force.x += (rules.cohesion * COHESION_FORCE * this.sumDx) / this.inSight;
    force.y += (rules.cohesion * COHESION_FORCE * this.sumDy) / this.inSight;
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
