// Paints one frame of the tank onto a 2D canvas context through a view, in a chosen visual mode.
// No page access, so every visual mode can be exercised in tests with a stand-in context.
import type { Fish, Tank } from '../core/tank';
import { fishInView } from './drawList';
import type { Size, View } from './view';
import type { Visual } from './visuals/types';

/** What the person looking has chosen to see. */
export interface Display {
  selected: number;
  trails: boolean;
}

export function paintTank(ctx: CanvasRenderingContext2D, screen: Size, tank: Tank, view: View, display: Display, visual: Visual, dt: number): void {
  ctx.fillStyle = visual.margin;
  ctx.fillRect(0, 0, screen.width, screen.height);

  // Everything is drawn in pixels measured from the tank's top left corner, and nothing outside the tank.
  const origin = view.toScreen({ x: 0, y: 0 });
  const frame = { ctx, scale: view.zoom, width: tank.width * view.zoom, height: tank.height * view.zoom, t: tank.t, dt };
  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.beginPath();
  ctx.rect(0, 0, frame.width, frame.height);
  ctx.clip();

  visual.begin?.(frame, tank.fish);
  visual.water(frame);
  const inView = fishInView(tank.fish, view, visual.reach);
  if (display.trails) for (const fish of inView) visual.trail(frame, fish, fish.id === display.selected);
  for (const fish of inView) visual.fish(frame, fish, fish.id === display.selected);
  for (const influence of tank.influences) visual.influence(frame, influence);
  ctx.restore();
}

/** Starts a path along a fish's trail, lifting the pen where it wrapped across the tank. The caller strokes it. */
export function traceTrail(ctx: CanvasRenderingContext2D, fish: Fish, scale: number): void {
  ctx.beginPath();
  let penDown = false;
  for (const point of fish.trail) {
    if (!point) {
      penDown = false;
      continue;
    }
    if (penDown) ctx.lineTo(point.x * scale, point.y * scale);
    else ctx.moveTo(point.x * scale, point.y * scale);
    penDown = true;
  }
}
