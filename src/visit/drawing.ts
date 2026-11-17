// Drawing for the phone page: the colouring sheet, the fish on it, and the swimming preview.
// Everything takes a canvas context and does not look at the page.
import type { Vec2 } from '../core/motion';
import { STYLES, amplitudeScale, bodyWave } from '../render/swimming';
import { PICTURE, inkOutline, paintChoices, pictureStrips, traceWhole } from '../visitors/outlines';
import type { Outline } from '../visitors/visitorFish';
import type { Stroke } from './colouring';
import type { Choices } from './fishState';

/** The colours to paint with: hues round the wheel, as the fish format keeps only hues. */
export const HUES = [0, 28, 50, 90, 150, 180, 210, 250, 290, 325];
export const paint = (hue: number) => `hsl(${hue} 72% 58%)`;

/** The colouring layer, clipped to inside the lines, then the ink on top. `scale` is pixels per picture pixel. */
export function drawColouring(ctx: CanvasRenderingContext2D, outline: Outline, strokes: readonly Stroke[], scale: number, sheet = false): void {
  const width = PICTURE.width * scale;
  ctx.clearRect(0, 0, width, PICTURE.height * scale);
  ctx.save();
  traceWhole(ctx, outline, width);
  ctx.clip('nonzero');
  if (sheet) {
    ctx.fillStyle = '#fbfdfe';
    ctx.fillRect(0, 0, width, PICTURE.height * scale);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const stroke of strokes) {
    ctx.strokeStyle = paint(stroke.hue);
    ctx.fillStyle = paint(stroke.hue);
    ctx.lineWidth = stroke.size * scale;
    const [first, ...rest] = stroke.points;
    if (!first) continue;
    // A single touch is a dab; a stroke of one point has no length to draw.
    ctx.beginPath();
    ctx.arc(first.x * scale, first.y * scale, (stroke.size * scale) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(first.x * scale, first.y * scale);
    for (const p of rest) ctx.lineTo(p.x * scale, p.y * scale);
    ctx.stroke();
  }
  ctx.restore();
  // Ink last, outside the clip, so the outline is never painted over.
  inkOutline(ctx, outline, width);
}

/** The fish as it will be sent or previewed, at picture size: from colouring, or painted from choices. */
export function drawFish(ctx: CanvasRenderingContext2D, choices: Choices): void {
  ctx.clearRect(0, 0, PICTURE.width, PICTURE.height);
  if (choices.mode === 'colour') drawColouring(ctx, choices.outline, choices.strokes, 1);
  else paintChoices(ctx, { outline: choices.outline, hues: choices.hues, pattern: choices.pattern });
}

/** Points along a swimming body from nose to tail, laid out as the tank does, for `length` pixels of fish. */
export function swimSpine(length: number, phase: number): Vec2[] {
  const points = 16;
  const style = STYLES.subcarangiform;
  return Array.from({ length: points }, (_, i) => {
    const s = i / (points - 1);
    return { x: (0.5 - s) * length, y: bodyWave(style, s, phase) * amplitudeScale(1) * length };
  });
}

/** The picture bent along the body, centred on the canvas, as it is drawn in the tank. */
export function drawSwimming(ctx: CanvasRenderingContext2D, picture: CanvasImageSource, width: number, height: number, phase: number): void {
  ctx.clearRect(0, 0, width, height);
  const length = Math.min(width * 0.86, height * 1.8);
  const tall = (length * PICTURE.height) / PICTURE.width;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  for (const strip of pictureStrips(swimSpine(length, phase), PICTURE.width)) {
    ctx.save();
    ctx.translate(strip.at.x, strip.at.y);
    ctx.rotate(strip.angle);
    ctx.drawImage(picture, strip.from, 0, strip.to - strip.from, PICTURE.height, -0.5, -tall / 2, strip.length + 1, tall);
    ctx.restore();
  }
  ctx.restore();
}
