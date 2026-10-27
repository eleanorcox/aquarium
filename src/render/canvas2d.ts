// Canvas 2D renderer: owns the page's canvas and paints the tank onto it in the chosen visual mode.
// It never changes simulation state. The painting itself is in paint.ts and the visual modes.
import type { Vec2 } from '../core/motion';
import type { Tank } from '../core/tank';
import { paintTank, type Display } from './paint';
import type { Size, View } from './view';
import type { Visual } from './visuals/types';

export type { Display } from './paint';

export class Canvas2DRenderer {
  private ctx: CanvasRenderingContext2D;
  private screen: Size = { width: 0, height: 0 };
  private lastFrame = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    public visual: Visual,
  ) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
  }

  /** Matches the backing store to the element size. Returns the size of the screen area in pixels. */
  resize(): Size {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.screen = { width, height };
    return this.screen;
  }

  /** Converts a pointer position on the page to pixels from the canvas's top left corner. */
  toCanvas(clientX: number, clientY: number): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  /** The id of the fish nearest a tank position, if one is within `reach` tank units. */
  pick(at: Vec2, tank: Tank, reach: number): number | undefined {
    let best: number | undefined;
    let bestDistance = reach;
    for (const fish of tank.fish) {
      const d = Math.hypot(fish.x - at.x, fish.y - at.y);
      if (d < bestDistance) [best, bestDistance] = [fish.id, d];
    }
    return best;
  }

  render(tank: Tank, view: View, display: Display): void {
    const now = performance.now();
    // Animation that is only for show, such as a tail beat, uses real time; a long pause is not caught up.
    const dt = this.lastFrame ? Math.min(0.1, (now - this.lastFrame) / 1000) : 0;
    this.lastFrame = now;
    paintTank(this.ctx, this.screen, tank, view, display, this.visual, dt);
  }
}
