// Classic: the original look. Glowing fish shapes with trails, on dark water with faint depth lines.
import type { Influence } from '../../core/steering';
import type { DrawnFish } from '../drawn';
import { traceTrail } from '../paint';
import { BODY_LENGTH, Swimmers } from './body';
import { drawHand } from './marks';
import { drawVisitorFish } from './visitor';
import type { Frame, Visual } from './types';

export class Classic implements Visual {
  readonly id = 'classic';
  readonly margin = '#02080d';
  // As far as a visitor fish's picture reaches; Classic's own fish are shorter.
  readonly reach = BODY_LENGTH;
  // Only visitor fish bend in Classic: they are drawn from pictures that need a spine.
  private swimmers = new Swimmers();

  begin(frame: Frame, fish: DrawnFish[]): void {
    this.swimmers.update(fish.filter((f) => f.outline !== undefined), frame.dt);
  }

  water({ ctx, width: w, height: h }: Frame): void {
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
  }

  trail({ ctx, scale }: Frame, fish: DrawnFish, selected: boolean): void {
    ctx.strokeStyle = `hsla(${fish.hue} 85% 66% / ${selected ? 0.55 : 0.2})`;
    ctx.lineWidth = selected ? 2 : 1.25;
    traceTrail(ctx, fish, scale);
    ctx.stroke();
  }

  fish(frame: Frame, fish: DrawnFish, selected: boolean): void {
    if (drawVisitorFish(frame, fish, this.swimmers, { selected, ring: 'rgba(220, 233, 238, 0.7)', glow: `hsl(${fish.hue} 85% 66% / 0.6)` })) return;
    const { ctx, scale, t } = frame;
    const s = fish.size * scale;
    // Tail beats faster when the fish swims faster.
    const wiggle = Math.sin(t * (6 + fish.speed * 25)) * 0.35;
    const colour = `hsl(${fish.hue} 85% 66%)`;

    ctx.save();
    ctx.translate(fish.x * scale, fish.y * scale);
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
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /** A faint ring showing how far an influence reaches. */
  influence(frame: Frame, influence: Influence): void {
    if (influence.kind === 'hand' || influence.kind === 'motion') return drawHand(frame, influence, { open: (a) => `rgba(110, 231, 214, ${a})`, fist: (a) => `rgba(255, 140, 90, ${a})`, motion: (a) => `rgba(240, 220, 120, ${a})` });
    const { ctx, scale } = frame;
    ctx.strokeStyle = 'rgba(220, 233, 238, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(influence.x * scale, influence.y * scale, influence.radius * scale, 0, Math.PI * 2);
    ctx.stroke();
  }
}
