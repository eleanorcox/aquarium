// Paper: ink drawings of fish on graph paper, like a page of working. Suits the equation side of the
// project. Light backgrounds wash out on a projector, so this one is for screens.
import type { Influence } from '../../core/steering';
import type { DrawnFish } from '../drawn';
import { traceTrail } from '../paint';
import { BODY_LENGTH, Swimmers, faceFish, tracePolygon } from './body';
import { drawHand } from './marks';
import type { Frame, Visual } from './types';

const INK = '#1d2b4f';

export class Paper implements Visual {
  readonly id = 'paper';
  readonly margin = '#2b2620';
  readonly reach = BODY_LENGTH;
  private swimmers = new Swimmers();

  begin(frame: Frame, fish: DrawnFish[]): void {
    this.swimmers.update(fish, frame.dt);
  }

  water({ ctx, width: w, height: h, scale }: Frame): void {
    ctx.fillStyle = '#f4eedf';
    ctx.fillRect(0, 0, w, h);
    // Fine squares every 0.05 tank units and a heavier line every 0.25, like squared paper.
    for (const [step, alpha] of [[0.05, 0.12], [0.25, 0.28]] as const) {
      ctx.strokeStyle = `rgba(70, 120, 170, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w + 0.5; x += step * scale) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h + 0.5; y += step * scale) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
    }
  }

  trail({ ctx, scale }: Frame, fish: DrawnFish, selected: boolean): void {
    ctx.strokeStyle = selected ? 'rgba(29, 43, 79, 0.6)' : 'rgba(29, 43, 79, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    traceTrail(ctx, fish, scale);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  fish({ ctx, scale }: Frame, fish: DrawnFish, selected: boolean): void {
    const body = this.swimmers.bodyOf(fish, scale);
    ctx.save();
    faceFish(ctx, fish, scale);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(0.75, body.length * 0.025);
    ctx.strokeStyle = INK;
    // A light wash of colour, as if pencilled in, under the ink line.
    ctx.fillStyle = `hsl(${fish.hue} 60% 62% / 0.35)`;
    for (const shape of [body.fin, body.outline]) {
      tracePolygon(ctx, shape);
      ctx.fill();
      ctx.stroke();
    }
    const eye = body.spine[1]!;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y - body.style.depth * body.length * 0.25, Math.max(0.7, body.length * 0.018), 0, Math.PI * 2);
    ctx.fill();

    if (selected) {
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(0, 0, body.length * 0.75, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  influence(frame: Frame, influence: Influence): void {
    if (influence.kind === 'hand' || influence.kind === 'motion') return drawHand(frame, influence, { open: (a) => `rgba(30, 110, 140, ${a})`, fist: (a) => `rgba(190, 60, 30, ${a})`, motion: (a) => `rgba(150, 110, 20, ${a})` });
    const { ctx, scale } = frame;
    ctx.strokeStyle = 'rgba(29, 43, 79, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.arc(influence.x * scale, influence.y * scale, influence.radius * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}
