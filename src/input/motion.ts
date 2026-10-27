// Movement input: finds where something is moving in a camera picture, such as people walking past a
// projection, and turns each moving area into an influence. It compares each picture with the one
// before, so it needs no skeletons or hand shapes. It knows nothing about the camera itself: the caller
// passes small pictures (a few dozen pixels across is plenty) and the time in seconds.
import type { Vec2 } from '../core/motion';
import type { Influence } from '../core/steering';

/** A camera picture as the browser gives it: red, green, blue and opacity for each pixel, row by row. */
export interface Picture {
  width: number;
  height: number;
  data: ArrayLike<number>;
}

/** A pixel counts as changed when its brightness moves by more than this, out of 255. */
const CHANGE = 30;
/** The picture is looked at in squares this many pixels across. */
const SQUARE = 8;
/** A square counts as moving when this share of its pixels changed. */
const BUSY = 0.2;
/** How much of each new position is taken. Lower is smoother and slower to follow. */
const FOLLOW = 0.5;
/** Seconds a moving area's effect lasts after the movement stops. */
const FADE = 0.3;
/** Two sightings this far apart, in the picture, are taken to be different things moving. */
const SAME_THING = 0.3;

interface Moving {
  x: number;
  y: number;
  vx: number;
  vy: number;
  seenAt: number;
}

export class MotionInput {
  /** How far a moving area's effect reaches, in tank units. */
  radius = 0.25;
  private previous: Float32Array | null = null;
  private moving: Moving[] = [];
  private latest = -Infinity;

  /** `toTank` places a point of the picture in the tank, given already flipped like a mirror, 0 to 1 across and down. */
  constructor(private toTank: (across: number, down: number) => Vec2) {}

  update(picture: Picture, time: number): void {
    this.latest = time;
    const brightness = new Float32Array(picture.width * picture.height);
    for (let i = 0; i < brightness.length; i++) {
      brightness[i] = 0.299 * picture.data[i * 4]! + 0.587 * picture.data[i * 4 + 1]! + 0.114 * picture.data[i * 4 + 2]!;
    }
    const previous = this.previous;
    this.previous = brightness;
    if (!previous || previous.length !== brightness.length) return;

    // Take away any change across the whole picture, such as a projector flickering or the room getting darker.
    let overall = 0;
    for (let i = 0; i < brightness.length; i++) overall += brightness[i]! - previous[i]!;
    overall /= brightness.length;

    const across = Math.ceil(picture.width / SQUARE);
    const down = Math.ceil(picture.height / SQUARE);
    const changed = new Uint16Array(across * down);
    for (let y = 0; y < picture.height; y++) {
      for (let x = 0; x < picture.width; x++) {
        const i = y * picture.width + x;
        if (Math.abs(brightness[i]! - previous[i]! - overall) > CHANGE) changed[Math.floor(y / SQUARE) * across + Math.floor(x / SQUARE)]!++;
      }
    }
    const busy = (cell: number) => changed[cell]! > BUSY * SQUARE * SQUARE;

    // Neighbouring busy squares are one moving thing. Each is found by spreading out from a busy square.
    const visited = new Uint8Array(across * down);
    const sightings: { x: number; y: number }[] = [];
    for (let start = 0; start < changed.length; start++) {
      if (visited[start] || !busy(start)) continue;
      let weight = 0;
      let sumX = 0;
      let sumY = 0;
      const queue = [start];
      visited[start] = 1;
      while (queue.length > 0) {
        const cell = queue.pop()!;
        const [cx, cy] = [cell % across, Math.floor(cell / across)];
        weight += changed[cell]!;
        sumX += (cx + 0.5) * SQUARE * changed[cell]!;
        sumY += (cy + 0.5) * SQUARE * changed[cell]!;
        for (const [nx, ny] of [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]] as const) {
          const next = ny * across + nx;
          if (nx >= 0 && ny >= 0 && nx < across && ny < down && !visited[next] && busy(next)) {
            visited[next] = 1;
            queue.push(next);
          }
        }
      }
      sightings.push({ x: sumX / weight / picture.width, y: sumY / weight / picture.height });
    }
    this.track(sightings, time);
  }

  influences(time: number): Influence[] {
    return this.moving
      .filter((m) => time - m.seenAt < FADE)
      .map((m) => {
        const at = this.toTank(1 - m.x, m.y);
        const ahead = this.toTank(1 - (m.x + m.vx), m.y + m.vy);
        return { x: at.x, y: at.y, vx: ahead.x - at.x, vy: ahead.y - at.y, radius: this.radius * (1 - (time - m.seenAt) / FADE), kind: 'motion' as const };
      });
  }

  /** What moved in the latest picture, in words, for the panel. */
  describe(): string {
    const count = this.moving.filter((m) => m.seenAt === this.latest).length;
    return count === 0 ? 'Nothing moving' : `${count} moving`;
  }

  private track(sightings: { x: number; y: number }[], time: number): void {
    const unmatched = new Set(this.moving);
    for (const at of sightings) {
      let match: Moving | undefined;
      let best = SAME_THING;
      for (const m of unmatched) {
        const d = Math.hypot(m.x - at.x, m.y - at.y);
        if (d < best) [match, best] = [m, d];
      }
      if (!match) {
        this.moving.push({ ...at, vx: 0, vy: 0, seenAt: time });
        continue;
      }
      unmatched.delete(match);
      const elapsed = time - match.seenAt;
      const x = match.x + (at.x - match.x) * FOLLOW;
      const y = match.y + (at.y - match.y) * FOLLOW;
      if (elapsed > 0) [match.vx, match.vy] = [(x - match.x) / elapsed, (y - match.y) / elapsed];
      [match.x, match.y, match.seenAt] = [x, y, time];
    }
    this.moving = this.moving.filter((m) => time - m.seenAt < FADE);
  }
}
