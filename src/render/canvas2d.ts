// Canvas 2D renderer: reads the tank and draws it. It never changes simulation state.
import type { Fish, Tank } from '../core/tank';

export interface ViewState {
  selected: number;
  trails: boolean;
}

export class Canvas2DRenderer {
  private ctx: CanvasRenderingContext2D;
  /** Pixels per tank unit (the tank is 1 unit tall). */
  private scale = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.ctx = ctx;
  }

  /** Matches the backing store to the element size. Returns the tank width (aspect ratio). */
  resize(): number {
    const { width, height } = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = height;
    return Math.max(0.6, width / height);
  }

  /** Converts a pointer position to the id of the nearest fish, if one is close enough. */
  pick(clientX: number, clientY: number, tank: Tank): number | undefined {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / this.scale;
    const y = (clientY - rect.top) / this.scale;
    let best: number | undefined;
    let bestDistance = 0.08;
    for (const fish of tank.fish) {
      const d = Math.hypot(fish.x - x, fish.y - y);
      if (d < bestDistance) [best, bestDistance] = [fish.id, d];
    }
    return best;
  }

  render(tank: Tank, view: ViewState): void {
    const { ctx } = this;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(138, 164, 177, 0.07)';
    ctx.lineWidth = 1;
    for (let gy = 0.1; gy < 1; gy += 0.1) {
      ctx.beginPath();
      ctx.moveTo(0, gy * h);
      ctx.lineTo(w, gy * h);
      ctx.stroke();
    }

    if (view.trails) for (const fish of tank.fish) this.drawTrail(fish, fish.id === view.selected);
    for (const fish of tank.fish) this.drawFish(fish, fish.id === view.selected, tank.t);
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
