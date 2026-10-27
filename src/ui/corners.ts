// Corner correction on the page: four draggable handles, the canvas stretched to match, and pointer
// positions turned back into positions on the unstretched picture. Used by any window that may be projected.
import type { Vec2 } from '../core/motion';
import { CornerPin, type Corners } from '../render/cornerPin';
import type { Size } from '../render/view';

/** Kept per browser and per screen size: only this machine's projector needs them. */
const CORNERS_KEY = 'equatium.corners';

export interface CornerControls {
  /** A pointer position on the page, as a position on the picture before stretching. */
  toPicture(e: { clientX: number; clientY: number }): Vec2;
  /** For the panel: whether the handles are showing, and buttons to show them and to undo the correction. */
  state: { adjusting: boolean; adjust: (on: boolean) => void; reset: () => void };
  /** Call when the screen changes size. */
  resized(screen: Size): void;
}

export function setUpCorners(canvas: HTMLCanvasElement, screen: Size): CornerControls {
  let pin = new CornerPin(screen);
  const handles = [0, 1, 2, 3].map(() => {
    const handle = document.createElement('div');
    handle.className = 'corner-handle';
    handle.hidden = true;
    document.body.append(handle);
    return handle;
  });

  const show = () => {
    canvas.style.transform = pin.adjusted ? pin.cssTransform() : '';
    pin.current.forEach((corner, i) => {
      handles[i]!.style.left = `${corner.x}px`;
      handles[i]!.style.top = `${corner.y}px`;
    });
  };
  const save = () => {
    // Private windows may refuse storage. Corner correction still works, it is just not remembered.
    try {
      if (pin.adjusted) localStorage.setItem(CORNERS_KEY, JSON.stringify({ screen, corners: pin.current }));
      else localStorage.removeItem(CORNERS_KEY);
    } catch {
      /* Not remembered. */
    }
  };
  try {
    const saved = JSON.parse(localStorage.getItem(CORNERS_KEY) ?? 'null') as { screen: Size; corners: Corners } | null;
    if (saved && saved.screen.width === screen.width && saved.screen.height === screen.height) pin.setCorners(saved.corners);
  } catch {
    /* Nothing remembered, or unreadable: start square. */
  }

  handles.forEach((handle, i) => {
    handle.addEventListener('pointerdown', (e) => handle.setPointerCapture(e.pointerId));
    handle.addEventListener('pointermove', (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      const corners = pin.current;
      corners[i] = { x: e.clientX, y: e.clientY };
      if (pin.setCorners(corners)) show();
    });
    handle.addEventListener('pointerup', save);
  });
  show();

  const state = {
    adjusting: false,
    adjust: (on: boolean) => {
      state.adjusting = on;
      for (const handle of handles) handle.hidden = !on;
    },
    reset: () => {
      pin.reset();
      show();
      save();
    },
  };
  return {
    toPicture: (e) => pin.toPicture({ x: e.clientX, y: e.clientY }),
    state,
    resized(next) {
      screen = next;
      // An uncorrected picture follows the screen's new size. Corrected corners stay where they were put.
      if (!pin.adjusted) {
        pin = new CornerPin(screen);
        show();
      }
    },
  };
}
