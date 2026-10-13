import { describe, expect, it } from 'vitest';
import { View } from '../render/view';
import { ViewGestures } from './viewGestures';

/** A tank too big for the screen, so there is somewhere to move to. */
const setUp = () => {
  const view = new View({ width: 2, height: 1 }, { width: 400, height: 800 }, 0.01);
  return { view, gestures: new ViewGestures(view) };
};
const MIDDLE = { x: 1, y: 0.5 };

describe('ViewGestures', () => {
  it('dragging with the mouse moves the tank with it', () => {
    const { view, gestures } = setUp();
    const before = view.toScreen(MIDDLE);
    gestures.down(1, 200, 400, 'mouse');
    gestures.move(1, 150, 400);
    expect(view.toScreen(MIDDLE).x).toBeCloseTo(before.x - 50);
  });

  it('moving the mouse without pressing does not move the tank', () => {
    const { view, gestures } = setUp();
    const before = view.toScreen(MIDDLE);
    gestures.move(1, 150, 400);
    gestures.down(1, 200, 400, 'mouse');
    gestures.up(1);
    gestures.move(1, 100, 400);
    expect(view.toScreen(MIDDLE)).toEqual(before);
  });

  it('tells a drag from a click, so a drag does not also select a fish', () => {
    const { gestures } = setUp();
    gestures.down(1, 200, 400, 'mouse');
    gestures.move(1, 201, 400);
    gestures.up(1);
    expect(gestures.dragged).toBe(false);
    gestures.down(1, 200, 400, 'mouse');
    gestures.move(1, 150, 400);
    gestures.up(1);
    expect(gestures.dragged).toBe(true);
  });

  it('one finger does not move the tank, because one finger is for the fish', () => {
    const { view, gestures } = setUp();
    const before = view.toScreen(MIDDLE);
    gestures.down(1, 200, 400, 'touch');
    gestures.move(1, 150, 400);
    expect(view.toScreen(MIDDLE)).toEqual(before);
  });

  it('two fingers moving together move the tank', () => {
    const { view, gestures } = setUp();
    const before = view.toScreen(MIDDLE);
    gestures.down(1, 150, 400, 'touch');
    gestures.down(2, 250, 400, 'touch');
    gestures.move(1, 110, 400);
    gestures.move(2, 210, 400);
    expect(view.toScreen(MIDDLE).x).toBeCloseTo(before.x - 40);
  });

  it('two fingers moving apart zoom in about the point between them', () => {
    const { view, gestures } = setUp();
    const between = view.toTank({ x: 200, y: 400 });
    const zoom = view.zoom;
    gestures.down(1, 150, 400, 'touch');
    gestures.down(2, 250, 400, 'touch');
    gestures.move(1, 100, 400);
    gestures.move(2, 300, 400);
    expect(view.zoom).toBeCloseTo(zoom * 2);
    expect(view.toTank({ x: 200, y: 400 }).x).toBeCloseTo(between.x);
  });

  it('the wheel zooms about the cursor, in when rolled away and out when rolled back', () => {
    const { view, gestures } = setUp();
    const cursor = { x: 300, y: 500 };
    const under = view.toTank(cursor);
    const zoom = view.zoom;
    gestures.wheel(cursor.x, cursor.y, -100);
    expect(view.zoom).toBeGreaterThan(zoom);
    expect(view.toTank(cursor).x).toBeCloseTo(under.x);
    gestures.wheel(cursor.x, cursor.y, 100);
    expect(view.zoom).toBeCloseTo(zoom);
  });
});
