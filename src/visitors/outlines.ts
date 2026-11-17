// The fish outlines visitors choose from, drawn straight and side-on, facing right, like a colouring sheet.
// The phone colours them in or paints them from choices; the tank bends the picture as the fish swims.
// Shapes are in picture widths: x from 0 (tail) to 1 (nose), y from 0 (top) to half a width (bottom).
import type { Vec2 } from '../core/motion';
import type { Outline, Pattern } from './visitorFish';

/** The size of every visitor fish picture, in pixels. Twice as wide as tall. */
export const PICTURE = { width: 256, height: 128 } as const;
const MIDDLE = PICTURE.height / PICTURE.width / 2;
const INK = '#14202a';

export interface OutlineShape {
  body: Vec2[];
  fins: Vec2[][];
  eye: Vec2;
}

/**
 * A fish body from its tail end to its nose, `top` and `bottom` being its greatest depth above and below
 * the middle line. Blunt at the nose, slim at the tail, never pinching to nothing where the tail fin joins.
 */
function body(tail: number, nose: number, top: number, bottom: number): Vec2[] {
  const n = 24;
  const depth = (s: number) => {
    const shape = (s ** 0.5 * (1 - s) ** 0.7) / 0.4426;
    return s > 0.5 ? Math.max(0.15, shape) : shape;
  };
  // s runs from the nose (0) to the tail (1).
  const at = (s: number) => nose - s * (nose - tail);
  const upper = Array.from({ length: n + 1 }, (_, i) => ({ x: at(i / n), y: MIDDLE - top * depth(i / n) }));
  const lower = Array.from({ length: n + 1 }, (_, i) => ({ x: at(i / n), y: MIDDLE + bottom * depth(i / n) }));
  return [...upper, ...lower.reverse()];
}

/** Points given as [x, y below the middle line], for writing fins briefly. */
const fin = (...points: [number, number][]): Vec2[] => points.map(([x, y]) => ({ x, y: MIDDLE + y }));

export const OUTLINE_SHAPES: Record<Outline, OutlineShape> = {
  // Long and slim, with a forked tail, like a mackerel.
  slim: {
    body: body(0.2, 0.97, 0.085, 0.075),
    fins: [fin([0.23, -0.02], [0.03, -0.11], [0.11, 0], [0.03, 0.11], [0.23, 0.02]), fin([0.65, -0.07], [0.55, -0.13], [0.45, -0.07])],
    eye: { x: 0.9, y: MIDDLE - 0.025 },
  },
  // Round and deep, with a fan tail, like a goldfish.
  round: {
    body: body(0.26, 0.95, 0.17, 0.16),
    fins: [fin([0.29, -0.02], [0.05, -0.14], [0.08, 0], [0.05, 0.14], [0.29, 0.02]), fin([0.7, -0.14], [0.58, -0.21], [0.45, -0.14])],
    eye: { x: 0.85, y: MIDDLE - 0.05 },
  },
  // Tall with sweeping fins, like an angelfish.
  tall: {
    body: body(0.32, 0.94, 0.14, 0.13),
    fins: [
      fin([0.35, -0.015], [0.1, -0.12], [0.14, 0], [0.1, 0.12], [0.35, 0.015]),
      fin([0.75, -0.11], [0.5, -0.23], [0.38, -0.07]),
      fin([0.7, 0.1], [0.48, 0.23], [0.38, 0.06]),
    ],
    eye: { x: 0.84, y: MIDDLE - 0.04 },
  },
};

/** Starts a closed path round a shape, at `width` pixels to a picture width. The caller fills, strokes or clips. */
export function traceShape(ctx: CanvasRenderingContext2D, shape: Vec2[], width: number = PICTURE.width): void {
  ctx.beginPath();
  shape.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * width, p.y * width) : ctx.lineTo(p.x * width, p.y * width)));
  ctx.closePath();
}

/** Every part of an outline in one path, for colouring inside the lines. */
export function traceWhole(ctx: CanvasRenderingContext2D, outline: Outline, width: number = PICTURE.width): void {
  const shape = OUTLINE_SHAPES[outline];
  ctx.beginPath();
  for (const part of [shape.body, ...shape.fins]) {
    part.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * width, p.y * width) : ctx.lineTo(p.x * width, p.y * width)));
    ctx.closePath();
  }
}

/** The ink lines and eye of an outline, drawn over colouring so it always looks finished. */
export function inkOutline(ctx: CanvasRenderingContext2D, outline: Outline, width: number = PICTURE.width): void {
  const shape = OUTLINE_SHAPES[outline];
  ctx.strokeStyle = INK;
  ctx.lineWidth = width * 0.012;
  ctx.lineJoin = 'round';
  // Fins are inked only outside the body, where they join it, so their lines do not cross it.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, width);
  shape.body.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x * width, p.y * width) : ctx.lineTo(p.x * width, p.y * width)));
  ctx.closePath();
  ctx.clip('evenodd');
  for (const part of shape.fins) {
    traceShape(ctx, part, width);
    ctx.stroke();
  }
  ctx.restore();
  traceShape(ctx, shape.body, width);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(shape.eye.x * width, shape.eye.y * width, width * 0.014, 0, Math.PI * 2);
  ctx.fill();
}

/** Paints a fish from a visitor's choices: body in the first colour, fins and pattern in the second, then the ink. */
export function paintChoices(ctx: CanvasRenderingContext2D, look: { outline: Outline; hues: [number, number]; pattern: Exclude<Pattern, 'coloured'> }): void {
  const shape = OUTLINE_SHAPES[look.outline];
  const [main, second] = look.hues;
  const w = PICTURE.width;
  ctx.fillStyle = `hsl(${second} 70% 58%)`;
  for (const part of shape.fins) {
    traceShape(ctx, part);
    ctx.fill();
  }
  ctx.fillStyle = `hsl(${main} 72% 60%)`;
  traceShape(ctx, shape.body);
  ctx.fill();

  ctx.save();
  traceShape(ctx, shape.body);
  ctx.clip();
  ctx.fillStyle = `hsl(${second} 70% 50%)`;
  if (look.pattern === 'stripes') {
    for (const x of [0.4, 0.55, 0.7]) ctx.fillRect(x * w, 0, 0.05 * w, PICTURE.height);
  } else if (look.pattern === 'spots') {
    const spots: [number, number][] = [[0.35, -0.04], [0.45, 0.03], [0.55, -0.06], [0.62, 0.05], [0.7, -0.01], [0.42, -0.1], [0.52, 0.09], [0.77, 0.04]];
    for (const [x, y] of spots) {
      ctx.beginPath();
      ctx.arc(x * w, (MIDDLE + y) * w, 0.022 * w, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  inkOutline(ctx, look.outline);
}

/** One strip of a picture placed on the bent fish: picture columns `from` to `to`, laid from `at` towards the nose. */
export interface Strip {
  from: number;
  to: number;
  at: Vec2;
  angle: number;
  length: number;
}

/**
 * Cuts a picture `width` pixels wide into one strip for each piece of the spine, so it bends with the fish.
 * The spine runs from the nose to the tail end, as a bent body's does. Strips come tail first.
 */
export function pictureStrips(spine: Vec2[], width: number): Strip[] {
  const pieces = spine.length - 1;
  const strips: Strip[] = [];
  for (let i = pieces - 1; i >= 0; i--) {
    const nose = spine[i]!;
    const tail = spine[i + 1]!;
    strips.push({
      from: Math.round((width * (pieces - 1 - i)) / pieces),
      to: Math.round((width * (pieces - i)) / pieces),
      at: tail,
      angle: Math.atan2(nose.y - tail.y, nose.x - tail.x),
      length: Math.hypot(nose.x - tail.x, nose.y - tail.y),
    });
  }
  return strips;
}
