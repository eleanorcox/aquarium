// Natural: fish that bend as they swim, in the style of real swimmers, in sunlit water with drifting specks.
// The colours are muted and the water is lit from above, closer to a real tank than Classic's glow.
import type { Influence } from '../../core/steering';
import type { DrawnFish } from '../drawn';
import { traceTrail } from '../paint';
import { BODY_LENGTH, Swimmers, faceFish, scatter, tracePolygon } from './body';
import { drawHand } from './marks';
import type { Frame, Visual } from './types';

export class Natural implements Visual {
  readonly id = 'natural';
  readonly margin = '#02080d';
  readonly reach = BODY_LENGTH;
  private swimmers = new Swimmers();

  begin(frame: Frame, fish: DrawnFish[]): void {
    this.swimmers.update(fish, frame.dt);
  }

  water({ ctx, width: w, height: h, t }: Frame): void {
    const depth = ctx.createLinearGradient(0, 0, 0, h);
    depth.addColorStop(0, '#1c5568');
    depth.addColorStop(0.35, '#0d3346');
    depth.addColorStop(1, '#051520');
    ctx.fillStyle = depth;
    ctx.fillRect(0, 0, w, h);

    // Shafts of light from the surface, swaying slowly.
    ctx.fillStyle = 'rgba(180, 230, 255, 0.035)';
    for (let i = 0; i < 6; i++) {
      const x = w * (0.08 + 0.17 * i) + Math.sin(t * 0.15 + i * 1.7) * w * 0.02;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + w * 0.04, 0);
      ctx.lineTo(x + w * 0.2, h * 0.85);
      ctx.lineTo(x + w * 0.09, h * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // A sandy floor fading in at the bottom.
    const floor = ctx.createLinearGradient(0, h * 0.9, 0, h);
    floor.addColorStop(0, 'rgba(120, 110, 80, 0)');
    floor.addColorStop(1, 'rgba(120, 110, 80, 0.3)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.9, w, h * 0.1);

    // Specks drifting down through the water, about one per small patch of screen.
    ctx.fillStyle = 'rgba(220, 240, 255, 0.2)';
    const specks = Math.min(400, Math.ceil((w * h) / 9000));
    for (let i = 0; i < specks; i++) {
      const x = ((scatter(i, 1) + t * 0.002 * (1 + (i % 3))) % 1) * w;
      const y = ((scatter(i, 2) + t * 0.006 * (1 + (i % 5) / 4)) % 1) * h;
      ctx.fillRect(x, y, 1 + (i % 3) * 0.5, 1 + (i % 3) * 0.5);
    }
  }

  trail({ ctx, scale }: Frame, fish: DrawnFish, selected: boolean): void {
    ctx.strokeStyle = `rgba(220, 240, 255, ${selected ? 0.3 : 0.08})`;
    ctx.lineWidth = 1;
    traceTrail(ctx, fish, scale);
    ctx.stroke();
  }

  fish({ ctx, scale }: Frame, fish: DrawnFish, selected: boolean): void {
    const body = this.swimmers.bodyOf(fish, scale);
    const depth = body.style.depth * body.length;
    ctx.save();
    faceFish(ctx, fish, scale);

    // Darker along the back and pale underneath, as most fish are.
    const shading = ctx.createLinearGradient(0, -depth, 0, depth);
    shading.addColorStop(0, `hsl(${fish.hue} 35% 30%)`);
    shading.addColorStop(0.55, `hsl(${fish.hue} 32% 55%)`);
    shading.addColorStop(1, `hsl(${fish.hue} 25% 82%)`);

    ctx.fillStyle = `hsl(${fish.hue} 30% 38% / 0.85)`;
    tracePolygon(ctx, body.fin);
    ctx.fill();
    ctx.fillStyle = shading;
    tracePolygon(ctx, body.outline);
    ctx.fill();

    const eye = body.spine[1]!;
    const eyeSize = Math.max(0.8, body.length * 0.022);
    ctx.fillStyle = '#e8eef0';
    ctx.beginPath();
    ctx.arc(eye.x, eye.y - depth * 0.25, eyeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b1418';
    ctx.beginPath();
    ctx.arc(eye.x + eyeSize * 0.2, eye.y - depth * 0.25, eyeSize * 0.55, 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.strokeStyle = 'rgba(232, 238, 240, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, body.length * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /** A soft brightening of the water where an influence reaches. */
  influence(frame: Frame, influence: Influence): void {
    if (influence.kind === 'hand') return drawHand(frame, influence, { open: (a) => `rgba(110, 231, 214, ${a})`, fist: (a) => `rgba(255, 140, 90, ${a})` });
    const { ctx, scale } = frame;
    const x = influence.x * scale;
    const y = influence.y * scale;
    const r = influence.radius * scale;
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, 'rgba(200, 235, 255, 0.08)');
    glow.addColorStop(1, 'rgba(200, 235, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
