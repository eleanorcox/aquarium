// View gestures: turns dragging, pinching and the mouse wheel into moves of the view.
// It knows nothing about the page. The caller passes pointer positions in pixels.
import type { View } from '../render/view';

/** A press that moves less than this many pixels is a click, not a drag. */
const DRAG_THRESHOLD = 4;
/** How much one notch of the wheel zooms. */
const WHEEL_RATE = 0.0015;

export class ViewGestures {
  /** Whether the latest press turned into a drag. A click handler checks this before selecting a fish. */
  dragged = false;
  private pressed = new Map<number, { x: number; y: number; kind: string }>();
  private travelled = 0;

  constructor(private view: View) {}

  down(id: number, x: number, y: number, kind: string): void {
    if (this.pressed.size === 0) {
      this.dragged = false;
      this.travelled = 0;
    }
    this.pressed.set(id, { x, y, kind });
  }

  move(id: number, x: number, y: number): void {
    const pointer = this.pressed.get(id);
    if (!pointer) return;
    const before = this.midpointAndSpread();
    this.travelled += Math.hypot(x - pointer.x, y - pointer.y);
    pointer.x = x;
    pointer.y = y;
    if (this.travelled > DRAG_THRESHOLD) this.dragged = true;
    // One finger is for the fish. A mouse drag, or two fingers, moves the tank.
    if (this.pressed.size === 1 && pointer.kind === 'touch') return;
    const after = this.midpointAndSpread();
    if (before.spread > 0 && after.spread > 0) this.view.zoomAt(after.spread / before.spread, before);
    this.view.pan(after.x - before.x, after.y - before.y);
  }

  up(id: number): void {
    this.pressed.delete(id);
  }

  wheel(x: number, y: number, deltaY: number): void {
    this.view.zoomAt(Math.exp(-deltaY * WHEEL_RATE), { x, y });
  }

  /** The point midway between the pressed pointers, and how far apart they are. */
  private midpointAndSpread(): { x: number; y: number; spread: number } {
    const points = [...this.pressed.values()];
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    const [a, b] = points;
    return { x, y, spread: a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0 };
  }
}
