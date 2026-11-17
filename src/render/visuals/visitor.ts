// Visitor fish are drawn from their picture, cut into strips laid along the bending spine, so a coloured-in
// fish swims with the same body wave as every other fish.
import { PICTURE, drawBent } from '../../visitors/outlines';
import type { DrawnFish } from '../drawn';
import { PICTURES } from '../pictures';
import { faceFish, type Swimmers } from './body';
import type { Frame } from './types';

/** Draws a visitor fish and returns true, or returns false if it is not one or its picture is not ready. */
export function drawVisitorFish(
  { ctx, scale }: Frame,
  fish: DrawnFish,
  swimmers: Swimmers,
  options: { selected: boolean; ring: string; glow?: string },
): boolean {
  if (fish.outline === undefined) return false;
  const picture = PICTURES.forFish(fish);
  if (!picture) return false;
  const body = swimmers.bodyOf(fish, scale);
  const height = (body.length * PICTURE.height) / PICTURE.width;
  ctx.save();
  faceFish(ctx, fish, scale);
  if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = 10;
  }
  drawBent(ctx, picture, body.spine, height);
  if (options.selected) {
    ctx.shadowBlur = 0;
    ctx.strokeStyle = options.ring;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, body.length * 0.75, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  return true;
}
