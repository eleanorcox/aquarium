// Colouring in with a finger: the strokes made, undoing them, and which colours the fish ends up with.
// Strokes are kept in picture pixels, so the picture can be redrawn at any size.
import type { Vec2 } from '../core/motion';

export interface Stroke {
  hue: number;
  /** Brush width in picture pixels. */
  size: number;
  points: Vec2[];
}

/** Undo steps kept. A stroke is a few dozen points, so keeping many costs nothing. */
const MAX_STROKES = 200;

/** Everything painted so far, oldest first. */
export class StrokeBook {
  private list: Stroke[] = [];

  get strokes(): readonly Stroke[] {
    return [...this.list];
  }

  add(stroke: Stroke): void {
    this.list.push(stroke);
    // Past the limit the oldest stroke can no longer be undone, and is dropped from the picture too.
    if (this.list.length > MAX_STROKES) this.list.shift();
  }

  undo(): void {
    this.list.pop();
  }

  clear(): void {
    this.list = [];
  }
}

/** How much paint a stroke puts down: its length times its width, or a dab for a single touch. */
function area(stroke: Stroke): number {
  let length = 0;
  for (let i = 1; i < stroke.points.length; i++) length += Math.hypot(stroke.points[i]!.x - stroke.points[i - 1]!.x, stroke.points[i]!.y - stroke.points[i - 1]!.y);
  return (length + stroke.size) * stroke.size;
}

/** The most used colour and the second most used, by area painted; the same twice if only one was used. */
export function dominantHues(strokes: readonly Stroke[]): [number, number] {
  const used = new Map<number, number>();
  for (const stroke of strokes) used.set(stroke.hue, (used.get(stroke.hue) ?? 0) + area(stroke));
  const ranked = [...used.entries()].sort((a, b) => b[1] - a[1]).map(([hue]) => hue);
  const first = ranked[0] ?? 0;
  return [first, ranked[1] ?? first];
}
