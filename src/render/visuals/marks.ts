// Marks for things that are not fish: a hand or movement in the tank, drawn so it is clear what the camera is seeing.
import type { Influence } from '../../core/steering';
import type { Frame } from './types';

/** Colours for a hand's mark, as CSS colour functions taking an opacity. */
export interface HandColours {
  open: (alpha: number) => string;
  fist: (alpha: number) => string;
  /** For movement seen by the camera, which has no hand shape. */
  motion?: (alpha: number) => string;
}

/**
 * A hand: a filled disc the size of its reach, a firm ring, and a word saying what shape it is making.
 * An open hand and a fist are different colours, so the change is visible the moment it counts.
 */
export function drawHand({ ctx, scale }: Frame, influence: Influence, colours: HandColours): void {
  const motion = influence.kind === 'motion';
  const colour = motion ? (colours.motion ?? colours.open) : influence.shape === 'fist' ? colours.fist : colours.open;
  const x = influence.x * scale;
  const y = influence.y * scale;
  const r = influence.radius * scale;
  if (r <= 0) return;
  ctx.fillStyle = colour(0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colour(0.8);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = colour(0.9);
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(motion ? 'movement' : influence.shape === 'fist' ? 'fist: scatter' : 'open hand', x, y);
}
