import { describe, expect, it } from 'vitest';
import type { Vec2 } from '../core/motion';
import { CornerPin, type Corners } from './cornerPin';

const SCREEN = { width: 1000, height: 600 };
const SQUARE: Corners = [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 600 }, { x: 0, y: 600 }];
/** What a projector tilted up and to one side might need: a lopsided four-sided shape. */
const SKEWED: Corners = [{ x: 80, y: 40 }, { x: 960, y: 0 }, { x: 900, y: 590 }, { x: 30, y: 520 }];

const close = (a: Vec2, b: Vec2) => {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
};

describe('CornerPin', () => {
  it('leaves the picture alone until the corners are moved', () => {
    const pin = new CornerPin(SCREEN);
    close(pin.toScreen({ x: 123, y: 456 }), { x: 123, y: 456 });
    expect(pin.adjusted).toBe(false);
  });

  it('puts each corner of the picture where its corner was dragged to', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    SQUARE.forEach((corner, i) => close(pin.toScreen(corner), SKEWED[i]!));
  });

  it('puts the middle of the picture where the diagonals of the new shape cross', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    // Where the line from top left to bottom right crosses the line from top right to bottom left.
    const [a, b, c, d] = SKEWED;
    const t = ((b.x - a.x) * (d.y - b.y) - (b.y - a.y) * (d.x - b.x)) / ((c.x - a.x) * (d.y - b.y) - (c.y - a.y) * (d.x - b.x));
    close(pin.toScreen({ x: 500, y: 300 }), { x: a.x + t * (c.x - a.x), y: a.y + t * (c.y - a.y) });
  });

  it('turns a point on the screen back into the point of the picture shown there', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    for (const point of [{ x: 10, y: 10 }, { x: 640, y: 222 }, { x: 999, y: 599 }]) close(pin.toPicture(pin.toScreen(point)), point);
  });

  it('keeps straight lines straight', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    const [p, q, r] = [{ x: 100, y: 100 }, { x: 400, y: 250 }, { x: 700, y: 400 }].map((point) => pin.toScreen(point));
    const cross = (q!.x - p!.x) * (r!.y - p!.y) - (q!.y - p!.y) * (r!.x - p!.x);
    expect(Math.abs(cross)).toBeLessThan(1e-6);
  });

  it('can be written as a CSS transform that does the same', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    const numbers = pin.cssTransform().match(/-?[\d.e-]+/g)!.map(Number).slice(1);
    // CSS lists a 4 by 4 matrix column by column; apply it to a point the way a browser does.
    const [x, y] = [250, 450];
    const at = (row: number) => numbers[row]! * x + numbers[4 + row]! * y + numbers[12 + row]!;
    close({ x: at(0) / at(3), y: at(1) / at(3) }, pin.toScreen({ x, y }));
  });

  it('refuses a shape that would turn the picture inside out, and keeps the last good one', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    const twisted: Corners = [SKEWED[1], SKEWED[0], SKEWED[2], SKEWED[3]];
    expect(pin.setCorners(twisted)).toBe(false);
    close(pin.toScreen(SQUARE[0]), SKEWED[0]);
  });

  it('resets to the plain picture', () => {
    const pin = new CornerPin(SCREEN);
    pin.setCorners(SKEWED);
    pin.reset();
    close(pin.toScreen({ x: 300, y: 300 }), { x: 300, y: 300 });
    expect(pin.adjusted).toBe(false);
  });
});
