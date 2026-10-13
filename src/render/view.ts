// The view: which part of the tank a screen shows, and how large. The tank has its own size; a view is
// one screen's window onto it. No DOM here, only the arithmetic, so it can be tested.
import type { Vec2 } from '../core/motion';

export interface Size {
  width: number;
  height: number;
}

/** A typical fish is never shown with a `size` smaller than this many pixels, so fish stay readable. */
export const MIN_FISH_PIXELS = 6;
/** How far in the view can zoom, as a multiple of its most zoomed-out state. */
const MAX_ZOOM_IN = 8;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export class View {
  /** Pixels per tank unit. */
  zoom = 1;
  /** The tank position shown at the centre of the screen. */
  private centre: Vec2 = { x: 0, y: 0 };

  /** `fishSize` is the size of a typical fish in the tank, in tank units. */
  constructor(
    private tank: Size,
    private screen: Size,
    private fishSize: number,
  ) {
    this.zoom = this.minZoom;
    this.centre = { x: tank.width / 2, y: tank.height / 2 };
  }

  /** The most zoomed-out the view goes: the whole tank on screen, unless that makes fish too small to read. */
  get minZoom(): number {
    const whole = Math.min(this.screen.width / this.tank.width, this.screen.height / this.tank.height);
    return Math.max(whole, MIN_FISH_PIXELS / this.fishSize);
  }

  /** True when the whole tank is on screen, so there is nowhere to pan to. */
  get fits(): boolean {
    const slack = 1e-9;
    return this.pixels(this.tank.width) <= this.screen.width + slack && this.pixels(this.tank.height) <= this.screen.height + slack;
  }

  /** Keeps the same amount of zoom-in when the screen changes size or shape. */
  setScreen(screen: Size): void {
    const zoomedIn = this.zoom / this.minZoom;
    this.screen = screen;
    this.zoom = this.minZoom * zoomedIn;
    this.keepInTank();
  }

  toScreen(point: Vec2): Vec2 {
    return {
      x: (point.x - this.centre.x) * this.zoom + this.screen.width / 2,
      y: (point.y - this.centre.y) * this.zoom + this.screen.height / 2,
    };
  }

  toTank(point: Vec2): Vec2 {
    return {
      x: (point.x - this.screen.width / 2) / this.zoom + this.centre.x,
      y: (point.y - this.screen.height / 2) / this.zoom + this.centre.y,
    };
  }

  /** A tank length in pixels. */
  pixels(tankLength: number): number {
    return tankLength * this.zoom;
  }

  /** A length in pixels as a tank length. Used so a pointer reaches the same distance on screen at any zoom. */
  tankLength(pixels: number): number {
    return pixels / this.zoom;
  }

  /** Moves the tank by a number of pixels, as when it is dragged. */
  pan(dx: number, dy: number): void {
    this.centre.x -= dx / this.zoom;
    this.centre.y -= dy / this.zoom;
    this.keepInTank();
  }

  /** Zooms by a factor, keeping the tank position under `point` (in pixels) where it is. */
  zoomAt(factor: number, point: Vec2): void {
    const anchor = this.toTank(point);
    this.zoom = clamp(this.zoom * factor, this.minZoom, this.minZoom * MAX_ZOOM_IN);
    this.centre.x = anchor.x - (point.x - this.screen.width / 2) / this.zoom;
    this.centre.y = anchor.y - (point.y - this.screen.height / 2) / this.zoom;
    this.keepInTank();
  }

  /** Moves the view just enough to keep `target` within the middle third of the screen. */
  follow(target: Vec2): void {
    const on = this.toScreen(target);
    for (const [axis, length] of [['x', this.screen.width], ['y', this.screen.height]] as const) {
      const overshoot = on[axis] < length / 3 ? on[axis] - length / 3 : on[axis] > (length * 2) / 3 ? on[axis] - (length * 2) / 3 : 0;
      this.centre[axis] += overshoot / this.zoom;
    }
    this.keepInTank();
  }

  /** Whether something at `point`, reaching `margin` tank units around it, is at least partly on screen. */
  sees(point: Vec2, margin: number): boolean {
    const halfWidth = this.screen.width / 2 / this.zoom + margin;
    const halfHeight = this.screen.height / 2 / this.zoom + margin;
    return Math.abs(point.x - this.centre.x) <= halfWidth && Math.abs(point.y - this.centre.y) <= halfHeight;
  }

  /** The view never shows beyond the tank's edges. Along an axis where the whole tank fits, it is centred. */
  private keepInTank(): void {
    for (const [axis, tank, screen] of [['x', this.tank.width, this.screen.width], ['y', this.tank.height, this.screen.height]] as const) {
      const half = screen / 2 / this.zoom;
      this.centre[axis] = tank <= half * 2 ? tank / 2 : clamp(this.centre[axis], half, tank - half);
    }
  }
}
