// The shape of a swimming fish's body, bent by the body wave, shared by the visual modes that bend fish.
// Coordinates are in pixels around the fish, with x pointing the way it faces and y to its side.
import type { Vec2 } from '../../core/motion';
import type { DrawnFish } from '../drawn';
import { STYLES, SwimPhases, amplitudeScale, bodyWave, tailBeatFrequency, type SwimStyle, type SwimStyleId } from '../swimming';

/** A bent fish is drawn this many fish sizes long, nose to tail fin. */
export const BODY_LENGTH = 3;
/** Points along the spine. More is smoother and slower. */
const SPINE_POINTS = 16;
/** The nose sits this far ahead of the fish's position, in body lengths. */
const NOSE = 0.45;

/** Until fish have species, each gets a swimming style from its id, so a tank shows a mix. Mostly ordinary swimmers. */
const STYLE_ORDER: SwimStyleId[] = ['subcarangiform', 'carangiform', 'subcarangiform', 'thunniform', 'anguilliform'];
/**
 * Styles the body wave cannot show directly are drawn as the nearest it can: fish that swim with their fins
 * (wrasse, boxfish) keep their bodies stiff, so they are drawn with the stiffest body; rays as trout for now.
 */
const DRAWN_AS: Record<string, SwimStyleId> = { labriform: 'thunniform', ostraciiform: 'thunniform', rajiform: 'subcarangiform' };

export const styleFor = (fish: DrawnFish): SwimStyle => {
  const named = fish.swimStyle ? (DRAWN_AS[fish.swimStyle] ?? fish.swimStyle) : undefined;
  return named && named in STYLES ? STYLES[named as SwimStyleId] : STYLES[STYLE_ORDER[fish.id % STYLE_ORDER.length]!];
};

export interface Body {
  style: SwimStyle;
  /** Nose to tail fin, in pixels. */
  length: number;
  spine: Vec2[];
  outline: Vec2[];
  fin: Vec2[];
}

/** How wide the body is at `s` along it (0 nose, 1 tail), as a fraction of its greatest width: blunt nose, slim tail. */
function profile(s: number): number {
  const shape = (s ** 0.45 * (1 - s) ** 0.8) / 0.442;
  // The narrow join between body and tail fin never pinches to nothing.
  return s > 0.5 ? Math.max(0.12, shape) : shape;
}

/** Keeps each fish's place in its tail beat from frame to frame. */
export class Swimmers {
  private phases = new SwimPhases();
  private state = new Map<number, { phase: number; amplitude: number }>();

  /** Moves every fish's tail beat on by `dt` seconds, at a rate set by how fast it is going. */
  update(fish: DrawnFish[], dt: number): void {
    for (const f of fish) {
      const speed = f.speed / (BODY_LENGTH * f.size);
      const phase = this.phases.advance(f.id, tailBeatFrequency(speed), dt);
      this.state.set(f.id, { phase, amplitude: amplitudeScale(speed) });
    }
    const ids = new Set(fish.map((f) => f.id));
    this.phases.keepOnly(ids);
    for (const id of this.state.keys()) if (!ids.has(id)) this.state.delete(id);
  }

  bodyOf(fish: DrawnFish, scale: number): Body {
    const style = styleFor(fish);
    const length = BODY_LENGTH * fish.size * scale;
    const { phase, amplitude } = this.state.get(fish.id) ?? { phase: 0, amplitude: 0 };
    const spine = Array.from({ length: SPINE_POINTS }, (_, i) => {
      const s = i / (SPINE_POINTS - 1);
      return { x: (NOSE - s) * length, y: bodyWave(style, s, phase) * amplitude * length };
    });

    const left: Vec2[] = [];
    const right: Vec2[] = [];
    spine.forEach((point, i) => {
      const ahead = spine[Math.max(0, i - 1)]!;
      const behind = spine[Math.min(SPINE_POINTS - 1, i + 1)]!;
      const along = Math.hypot(behind.x - ahead.x, behind.y - ahead.y) || 1;
      // Square to the spine, so the body keeps its width as it bends.
      const side = { x: -(behind.y - ahead.y) / along, y: (behind.x - ahead.x) / along };
      const half = style.depth * length * profile(i / (SPINE_POINTS - 1));
      left.push({ x: point.x + side.x * half, y: point.y + side.y * half });
      right.push({ x: point.x - side.x * half, y: point.y - side.y * half });
    });

    // A forked tail fin, pointing the way the end of the spine points.
    const tail = spine[SPINE_POINTS - 1]!;
    const before = spine[SPINE_POINTS - 2]!;
    const run = Math.hypot(tail.x - before.x, tail.y - before.y) || 1;
    const back = { x: (tail.x - before.x) / run, y: (tail.y - before.y) / run };
    const side = { x: -back.y, y: back.x };
    const reach = length * (style === STYLES.anguilliform ? 0.08 : 0.2);
    const spread = length * (style === STYLES.anguilliform ? 0.05 : style.depth * 1.6);
    const at = (forward: number, out: number) => ({ x: tail.x + back.x * forward + side.x * out, y: tail.y + back.y * forward + side.y * out });
    const fin = [at(-reach * 0.15, spread * 0.25), at(reach, spread), at(reach * 0.55, 0), at(reach, -spread), at(-reach * 0.15, -spread * 0.25)];

    return { style, length, spine, outline: [...left, ...right.reverse()], fin };
  }
}

/** Starts a closed path around a list of points. The caller fills or strokes it. */
export function tracePolygon(ctx: CanvasRenderingContext2D, points: Vec2[]): void {
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

/**
 * Turns the drawing to face the way the fish swims, keeping its back uppermost. A fish swimming left is
 * turned over instead of drawn upside down.
 */
export function faceFish(ctx: CanvasRenderingContext2D, fish: DrawnFish, scale: number): void {
  ctx.translate(fish.x * scale, fish.y * scale);
  ctx.rotate(fish.heading);
  if (Math.cos(fish.heading) < 0) ctx.scale(1, -1);
}

/** A repeatable number from 0 up to 1 for each whole number, for scattering things without randomness. */
export const scatter = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
