// The invitation in the corner of the tank: a QR code for the phone page, on a white card with a line of text.
// Drawn on the canvas, after the tank, so corner correction straightens it along with everything else.
import type { Size } from './view';

/** Draws the card in the bottom right corner of the screen. `pattern` is rows of dark and light modules. */
export function drawInvite(ctx: CanvasRenderingContext2D, screen: Size, pattern: boolean[][], caption: string): void {
  const modules = pattern.length;
  // Big enough to scan from a few steps back, small enough not to cover much of the tank.
  const side = Math.round(Math.min(screen.height * 0.24, screen.width * 0.2, 280));
  const quiet = side * 0.08;
  const cell = (side - quiet * 2) / modules;
  const captionSize = Math.max(11, Math.round(side * 0.075));
  const margin = Math.round(side * 0.08);
  const x = screen.width - side - margin;
  const y = screen.height - side - captionSize * 1.8 - margin;

  ctx.save();
  ctx.fillStyle = 'rgba(250, 252, 253, 0.95)';
  ctx.beginPath();
  ctx.roundRect(x, y, side, side + captionSize * 1.8, side * 0.05);
  ctx.fill();
  ctx.fillStyle = '#061521';
  pattern.forEach((row, r) =>
    row.forEach((dark, c) => {
      // A hair larger than a cell, so no light lines show between dark modules.
      if (dark) ctx.fillRect(x + quiet + c * cell, y + quiet + r * cell, cell + 0.5, cell + 0.5);
    }),
  );
  ctx.font = `600 ${captionSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(caption, x + side / 2, y + side + captionSize * 0.6);
  ctx.restore();
}
