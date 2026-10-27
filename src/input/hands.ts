// Hand input: turns hand-tracking points from a camera into influences the fish react to.
// It knows nothing about the camera or the tracking library. The caller passes, for each camera frame,
// the 21 points of every hand seen, in the camera picture's 0 to 1 coordinates, and the time in seconds.
import type { Influence } from '../core/steering';

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type HandShape = 'open' | 'fist' | 'unsure';

/** The standard layout of the 21 points: the wrist, then four points per digit from knuckle to tip. */
const WRIST = 0;
const KNUCKLES = [5, 9, 13, 17];
const MIDDLE_JOINTS = [6, 10, 14, 18];
const TIPS = [8, 12, 16, 20];
const POINTS = 21;

/** A changed hand shape has to be seen this many camera frames running before it counts. */
const SETTLE_FRAMES = 4;
/** How much of each new position is taken. Lower is smoother and slower to follow. */
const FOLLOW = 0.45;
/** Seconds a hand's effect takes to fade once the hand has gone. */
const FADE = 0.4;
/** Two sightings this far apart, in the camera picture, are taken to be different hands. */
const SAME_HAND = 0.25;

const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Open or fist, from how many of the four fingers are straight. A finger is straight when its tip is
 * further from the wrist than its middle joint is, which holds wherever the hand is and however it is turned.
 */
export function classifyHand(points: Landmark[]): HandShape {
  const wrist = points[WRIST]!;
  let straight = 0;
  for (let finger = 0; finger < 4; finger++) {
    if (distance(points[TIPS[finger]!]!, wrist) > distance(points[MIDDLE_JOINTS[finger]!]!, wrist) * 1.1) straight++;
  }
  return straight >= 3 ? 'open' : straight === 0 ? 'fist' : 'unsure';
}

/** The middle of the palm: the wrist and the four knuckles. */
function palm(points: Landmark[]): { x: number; y: number } {
  const used = [WRIST, ...KNUCKLES].map((i) => points[i]!);
  return { x: used.reduce((s, p) => s + p.x, 0) / used.length, y: used.reduce((s, p) => s + p.y, 0) / used.length };
}

interface TrackedHand {
  /** Smoothed palm position in the camera picture. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  shape: 'open' | 'fist';
  /** A different shape seen recently, and for how many frames running. */
  pending: HandShape;
  pendingFrames: number;
  seenAt: number;
}

export class HandInput {
  /** How far a hand's effect reaches, in tank units. */
  radius = 0.25;
  private hands: TrackedHand[] = [];

  /** `tankWidth` maps the camera picture across the whole tank. */
  constructor(private tankWidth: number) {}

  /** Takes the hands seen in one camera frame. */
  update(seen: Landmark[][], time: number): void {
    const unmatched = new Set(this.hands);
    for (const points of seen) {
      if (points.length !== POINTS) continue;
      const at = palm(points);
      const shape = classifyHand(points);
      // The tracker may list hands in any order, so each sighting goes to the nearest hand already known.
      let match: TrackedHand | undefined;
      let best = SAME_HAND;
      for (const hand of unmatched) {
        const d = Math.hypot(hand.x - at.x, hand.y - at.y);
        if (d < best) [match, best] = [hand, d];
      }
      if (!match) {
        this.hands.push({ ...at, vx: 0, vy: 0, shape: shape === 'fist' ? 'fist' : 'open', pending: shape, pendingFrames: 0, seenAt: time });
        continue;
      }
      unmatched.delete(match);
      this.follow(match, at, shape, time);
    }
    // Hands not seen for longer than the fade are gone.
    this.hands = this.hands.filter((hand) => time - hand.seenAt < FADE);
  }

  influences(time: number): Influence[] {
    return this.hands
      .filter((hand) => time - hand.seenAt < FADE)
      .map((hand) => {
        // A hand that has just gone fades out, so fish do not jolt when tracking drops for a moment.
        const fade = Math.min(1, Math.max(0, 1 - (time - hand.seenAt - 2 / 30) / FADE));
        return {
          // Flipped like a mirror: the camera sees your right hand on its left.
          x: (1 - hand.x) * this.tankWidth,
          y: hand.y,
          vx: -hand.vx * this.tankWidth,
          vy: hand.vy,
          radius: this.radius * fade,
          ...(hand.shape === 'fist' ? { effect: 'scatter' as const } : {}),
        };
      });
  }

  private follow(hand: TrackedHand, at: { x: number; y: number }, shape: HandShape, time: number): void {
    const elapsed = time - hand.seenAt;
    const x = hand.x + (at.x - hand.x) * FOLLOW;
    const y = hand.y + (at.y - hand.y) * FOLLOW;
    if (elapsed > 0) {
      hand.vx = (x - hand.x) / elapsed;
      hand.vy = (y - hand.y) / elapsed;
    }
    hand.x = x;
    hand.y = y;
    hand.seenAt = time;
    // A new shape counts only once it has been seen several frames running; unsure keeps the old one.
    if (shape === 'unsure' || shape === hand.shape) {
      hand.pendingFrames = 0;
      return;
    }
    hand.pendingFrames = hand.pending === shape ? hand.pendingFrames + 1 : 1;
    hand.pending = shape;
    if (hand.pendingFrames >= SETTLE_FRAMES) {
      hand.shape = shape;
      hand.pendingFrames = 0;
    }
  }
}
