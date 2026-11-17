// The display window: for a projector. It runs no simulation. It draws the frames the operator window
// sends, fills its screen, and sends back where people touch it and which part of the tank it shows,
// so hands seen by the camera land on the projected picture.
import { PointerInput } from '../input/pointer';
import { Canvas2DRenderer } from '../render/canvas2d';
import type { DrawnTank } from '../render/drawn';
import { View } from '../render/view';
import { createVisual } from '../render/visuals';
import { setUpCorners } from '../ui/corners';
import { CHANNEL, isFrameMessage, isLooksMessage, isPictureMessage, lookMap, unpackFrame, type DisplayMessage, type FrameMessage, type VisitorLook } from './frames';
import { PICTURES } from '../render/pictures';

/** How far a touch on the display reaches, in pixels. */
const REACH = 180;

export function runDisplay(canvas: HTMLCanvasElement): void {
  document.body.classList.add('bare');
  const renderer = new Canvas2DRenderer(canvas, createVisual('classic'));
  let screen = renderer.resize();
  const corners = setUpCorners(canvas, screen);
  const channel = new BroadcastChannel(CHANNEL);
  const send = (message: DisplayMessage) => channel.postMessage(message);

  let frame: FrameMessage | null = null;
  let tank: DrawnTank | null = null;
  let view: View | null = null;
  let shape = '';

  new ResizeObserver(() => {
    screen = renderer.resize();
    corners.resized(screen);
    view?.setScreen(screen);
  }).observe(canvas);

  // Visitor fish's looks and pictures arrive separately from frames, only when they change.
  let looks = new Map<number, VisitorLook>();
  channel.addEventListener('message', (e: MessageEvent<unknown>) => {
    if (isLooksMessage(e.data)) looks = lookMap(e.data);
    if (isPictureMessage(e.data)) PICTURES.add(e.data.id, e.data.dataUrl);
    if (!isFrameMessage(e.data)) return;
    frame = e.data;
    tank = unpackFrame(frame, looks);
    if (renderer.visual.id !== frame.visual) renderer.visual = createVisual(frame.visual);
    // A new view only when the tank or how it should be shown changes, so dragging the view is kept.
    const next = `${frame.width} ${frame.fill} ${tank.fish.length > 0}`;
    if (next !== shape || !view) {
      shape = next;
      const sizes = tank.fish.map((f) => f.size).sort((a, b) => a - b);
      view = new View(tank, screen, sizes[Math.floor(sizes.length / 2)] ?? 0.04, { fill: frame.fill });
    }
  });

  // Touching or pointing at the projection works like the pointer in the operator window.
  const pointer = new PointerInput();
  const seconds = () => performance.now() / 1000;
  canvas.addEventListener('pointermove', (e) => {
    if (!view) return;
    const at = view.toTank(corners.toPicture(e));
    pointer.move(at.x, at.y, seconds());
  });
  canvas.addEventListener('pointerleave', () => pointer.leave());
  canvas.addEventListener('pointerup', (e) => e.pointerType !== 'mouse' && pointer.leave());

  // Click for full screen; C shows the corner handles; R resets them.
  canvas.addEventListener('click', () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen().catch(() => {});
  });
  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'c') corners.state.adjust(!corners.state.adjusting);
    if (e.key.toLowerCase() === 'r') corners.state.reset();
  });

  // Say hello, and keep saying which part of the tank is shown, so the operator knows this window is open.
  const announce = () => {
    if (!view) return send({ type: 'hello' });
    const topLeft = view.toTank({ x: 0, y: 0 });
    const bottomRight = view.toTank({ x: screen.width, y: screen.height });
    send({ type: 'shown', area: { x: topLeft.x, y: topLeft.y, width: bottomRight.x - topLeft.x, height: bottomRight.y - topLeft.y } });
  };
  announce();
  setInterval(announce, 1000);

  let touching = false;
  const frameLoop = () => {
    if (view) pointer.radius = view.tankLength(REACH);
    const [touch] = pointer.influences(seconds());
    if (touch || touching) send({ type: 'pointer', influence: touch ?? null });
    touching = Boolean(touch);

    const ctx = canvas.getContext('2d')!;
    if (tank && view && frame) {
      renderer.render(tank, view, { selected: frame.selected, trails: false });
    } else {
      ctx.fillStyle = '#02080d';
      ctx.fillRect(0, 0, screen.width, screen.height);
      ctx.fillStyle = '#8aa4b1';
      ctx.font = '16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for the operator window. Click for full screen; C adjusts the corners.', screen.width / 2, screen.height / 2);
    }
    requestAnimationFrame(frameLoop);
  };
  requestAnimationFrame(frameLoop);
}
