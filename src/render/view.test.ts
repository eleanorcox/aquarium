import { describe, expect, it } from 'vitest';
import { MIN_FISH_PIXELS, View } from './view';

const TANK = { width: 2, height: 1 };
/** A typical fish small enough that the whole tank fits on these screens. */
const SMALL_FISH = 0.04;

describe('a tank that fits the screen', () => {
  it('is shown whole and centred, as large as the screen allows', () => {
    const view = new View(TANK, { width: 1000, height: 800 }, SMALL_FISH);
    expect(view.zoom).toBe(500);
    expect(view.toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 150 });
    expect(view.toScreen({ x: 2, y: 1 })).toEqual({ x: 1000, y: 650 });
    expect(view.fits).toBe(true);
  });

  it('cannot be moved', () => {
    const view = new View(TANK, { width: 1000, height: 800 }, SMALL_FISH);
    view.pan(300, -200);
    expect(view.toScreen({ x: 0, y: 0 })).toEqual({ x: 0, y: 150 });
  });

  it('stays whole and centred when the screen changes shape', () => {
    const view = new View(TANK, { width: 1000, height: 800 }, SMALL_FISH);
    view.setScreen({ width: 600, height: 900 });
    expect(view.zoom).toBe(300);
    expect(view.toScreen({ x: 1, y: 0.5 })).toEqual({ x: 300, y: 450 });
  });
});

describe('a tank too big for the screen', () => {
  /** Fish this small would be specks if the whole tank were squeezed onto a phone. */
  const TINY_FISH = 0.01;
  const phone = () => new View(TANK, { width: 400, height: 800 }, TINY_FISH);

  it('is zoomed in until a typical fish is at least the smallest comfortable size', () => {
    const view = phone();
    expect(view.pixels(TINY_FISH)).toBeCloseTo(MIN_FISH_PIXELS);
    expect(view.fits).toBe(false);
  });

  it('starts centred on the middle of the tank', () => {
    expect(phone().toTank({ x: 200, y: 400 })).toEqual({ x: 1, y: 0.5 });
  });

  it('can be dragged, and the tank moves with the finger', () => {
    const view = phone();
    const before = view.toScreen({ x: 1, y: 0.5 });
    view.pan(-50, 0);
    expect(view.toScreen({ x: 1, y: 0.5 }).x).toBeCloseTo(before.x - 50);
  });

  it('cannot be dragged past the edges of the tank', () => {
    const view = phone();
    view.pan(100000, 100000);
    expect(view.toScreen({ x: 0, y: 0 }).x).toBeCloseTo(0);
    view.pan(-100000, -100000);
    expect(view.toScreen({ x: 2, y: 1 }).x).toBeCloseTo(400);
  });

  it('cannot be zoomed out past the smallest comfortable fish size', () => {
    const view = phone();
    view.zoomAt(0.01, { x: 200, y: 400 });
    expect(view.pixels(TINY_FISH)).toBeCloseTo(MIN_FISH_PIXELS);
  });

  it('zooms about the point under the cursor', () => {
    const view = phone();
    const cursor = { x: 120, y: 300 };
    const under = view.toTank(cursor);
    view.zoomAt(2, cursor);
    expect(view.toTank(cursor).x).toBeCloseTo(under.x);
    expect(view.toTank(cursor).y).toBeCloseTo(under.y);
    expect(view.pixels(TINY_FISH)).toBeCloseTo(MIN_FISH_PIXELS * 2);
  });

  it('following a fish keeps it within the middle of the screen', () => {
    const view = phone();
    for (const target of [{ x: 0.3, y: 0.5 }, { x: 1.7, y: 0.5 }, { x: 1, y: 0.5 }]) {
      view.follow(target);
      const on = view.toScreen(target);
      expect(on.x).toBeGreaterThanOrEqual(400 / 3 - 1e-9);
      expect(on.x).toBeLessThanOrEqual((400 * 2) / 3 + 1e-9);
    }
  });

  it('following does not move the view while the fish stays in the middle', () => {
    const view = phone();
    const before = view.toScreen({ x: 0, y: 0 });
    view.follow({ x: 1.01, y: 0.5 });
    expect(view.toScreen({ x: 0, y: 0 })).toEqual(before);
  });
});

describe('converting between screen and tank', () => {
  it('there and back gives the starting position, at any pan and zoom', () => {
    const view = new View(TANK, { width: 400, height: 800 }, 0.01);
    view.zoomAt(1.7, { x: 90, y: 610 });
    view.pan(-140, 33);
    for (const point of [{ x: 0, y: 0 }, { x: 399, y: 12 }, { x: 123.5, y: 777 }]) {
      const back = view.toScreen(view.toTank(point));
      expect(back.x).toBeCloseTo(point.x, 9);
      expect(back.y).toBeCloseTo(point.y, 9);
    }
  });

  it('a length in pixels is the same size on screen at any zoom', () => {
    const view = new View(TANK, { width: 400, height: 800 }, 0.01);
    for (const factor of [1, 2, 3.5]) {
      view.zoomAt(factor, { x: 200, y: 400 });
      expect(view.pixels(view.tankLength(180))).toBeCloseTo(180);
    }
  });
});

describe('what is in view', () => {
  it('includes what is on screen and what straddles its edge, and leaves out the rest', () => {
    const view = new View(TANK, { width: 400, height: 800 }, 0.01);
    const left = view.toTank({ x: 0, y: 400 });
    expect(view.sees({ x: 1, y: 0.5 }, 0.01)).toBe(true);
    expect(view.sees({ x: left.x - 0.005, y: 0.5 }, 0.01)).toBe(true);
    expect(view.sees({ x: left.x - 0.02, y: 0.5 }, 0.01)).toBe(false);
    expect(view.sees({ x: 1, y: 0.5 }, 0)).toBe(true);
  });
});
