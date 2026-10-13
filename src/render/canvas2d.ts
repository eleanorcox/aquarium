// Canvas 2D renderer: reads the tank and draws the part of it a view shows. It never changes simulation state.
import type { Vec2 } from '../core/motion';
import type { Influence } from '../core/steering';
import type { Fish, Tank } from '../core/tank';
import { fishInView } from './drawList';
import type { Size, View } from './view';

/** What the person looking has chosen to see. */
export interface Display {
  selected: number;
  trails: boolean;
}

export class Canvas2DRenderer {
  private ctx: CanvasRenderingContext2D;
  /** Pixels per tank unit, taken from the view at the start of each frame. */
  private scale = 1;

  constructor(private canvas: HTMLCanvasElement) {
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
    return { width, height };
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
    const { ctx } = this;
    const scale = (this.scale = view.zoom);
    const origin = view.toScreen({ x: 0, y: 0 });
    const w = tank.width * scale;
    const h = tank.height * scale;
    ctx.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);

    // Everything is drawn in pixels measured from the tank's top left corner, and nothing outside the tank.
    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();

    const water = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, Math.max(w * 0.7, h));
    water.addColorStop(0, '#0b2233');
    water.addColorStop(1, '#061521');
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(138, 164, 177, 0.07)';
    ctx.lineWidth = 1;
    for (let gy = 0.1; gy < 1; gy += 0.1) {
      ctx.beginPath();
      ctx.moveTo(0, gy * h);
      ctx.lineTo(w, gy * h);
      ctx.stroke();
    }

    const inView = fishInView(tank.fish, view);
    if (display.trails) for (const fish of inView) this.drawTrail(fish, fish.id === display.selected);
    for (const fish of inView) this.drawFish(fish, fish.id === display.selected, tank.t);
    for (const influence of tank.influences) this.drawInfluence(influence);
    ctx.restore();
  }

  /** A faint ring showing how far an influence reaches. */
  private drawInfluence(influence: Influence): void {
    const { ctx, scale } = this;
    ctx.strokeStyle = 'rgba(220, 233, 238, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(influence.x * scale, influence.y * scale, influence.radius * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  private drawTrail(fish: Fish, selected: boolean): void {
    const { ctx, scale } = this;
    ctx.strokeStyle = `hsla(${fish.hue} 85% 66% / ${selected ? 0.55 : 0.2})`;
    ctx.lineWidth = selected ? 2 : 1.25;
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
    ctx.stroke();
  }

  private drawFish(fish: Fish, selected: boolean, t: number): void {
    const { ctx } = this;
    const s = fish.size * this.scale;
    // Tail beats faster when the fish swims faster.
    const wiggle = Math.sin(t * (6 + fish.speed * 25)) * 0.35;
    const colour = `hsl(${fish.hue} 85% 66%)`;

    ctx.save();
    ctx.translate(fish.x * this.scale, fish.y * this.scale);
    ctx.rotate(fish.heading);
    ctx.fillStyle = colour;
    ctx.shadowColor = colour;
    ctx.shadowBlur = selected ? 22 : 10;

    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.lineTo(-s * 1.7, -s * 0.6 + wiggle * s);
    ctx.lineTo(-s * 1.7, s * 0.6 + wiggle * s);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#061521';
    ctx.beginPath();
    ctx.arc(s * 0.5, -s * 0.12, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = 'rgba(220, 233, 238, 0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, s * 2.1, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}
