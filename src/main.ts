import './style.css';
import { MODELS, type BuiltinId } from './core/motion';
import { Tank } from './core/tank';
import { PointerInput } from './input/pointer';
import { ViewGestures } from './input/viewGestures';
import { Canvas2DRenderer } from './render/canvas2d';
import { fishInView } from './render/drawList';
import { View } from './render/view';
import { SCENES, buildScene } from './scenes/scenes';
import { createPanel } from './ui/panel';

const canvas = document.querySelector<HTMLCanvasElement>('#tank')!;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

const tank = new Tank();
const scene = buildScene(tank, new URLSearchParams(location.search).get('scene'));

// The tank has its own size. The view is this screen's window onto it.
const renderer = new Canvas2DRenderer(canvas);
const view = new View(tank, renderer.resize(), tank.typicalFishSize());
new ResizeObserver(() => view.setScreen(renderer.resize())).observe(canvas);

const panelElements = {
  equation: $('#equation'),
  editor: $<HTMLFormElement>('#editor'),
  xInput: $<HTMLInputElement>('#eq-x'),
  yInput: $<HTMLInputElement>('#eq-y'),
  error: $('#eq-error'),
};

const pointer = new PointerInput();
const reach = { pixels: 180 };
const gestures = new ViewGestures(view);
const seconds = () => performance.now() / 1000;

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const at = renderer.toCanvas(e.clientX, e.clientY);
  gestures.down(e.pointerId, at.x, at.y, e.pointerType);
});
canvas.addEventListener('pointermove', (e) => {
  const at = renderer.toCanvas(e.clientX, e.clientY);
  gestures.move(e.pointerId, at.x, at.y);
  const inTank = view.toTank(at);
  pointer.move(inTank.x, inTank.y, seconds());
});
for (const type of ['pointerup', 'pointercancel'] as const) {
  canvas.addEventListener(type, (e) => {
    gestures.up(e.pointerId);
    // A lifted finger is gone; a mouse is still there after its button is released.
    if (e.pointerType !== 'mouse') pointer.leave();
  });
}
canvas.addEventListener('pointerleave', () => pointer.leave());
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const at = renderer.toCanvas(e.clientX, e.clientY);
    gestures.wheel(at.x, at.y, e.deltaY);
  },
  { passive: false },
);

const stats = { fish: 0, drawn: 0, stepMs: 0, drawMs: 0 };

const controls = createPanel(tank, panelElements, {
  pointer,
  stats,
  reach,
  scene,
  trails: SCENES[scene]?.trails ?? true,
  onAddFish: () => {
    const ids = Object.keys(MODELS) as BuiltinId[];
    const model = ids[Math.floor(Math.random() * ids.length)] ?? 'sine';
    const fish = tank.addFish(model, { y0: 0.2 + Math.random() * 0.6, phi: Math.random() * 6.28 });
    tank.setBehaviour(fish.id, { curiosity: Math.random() * 2 - 1, drift: 0.3, pathStrength: 0.5 });
    return fish.id;
  },
});

canvas.addEventListener('click', (e) => {
  if (gestures.dragged) return;
  const at = view.toTank(renderer.toCanvas(e.clientX, e.clientY));
  // Within about 60 pixels, however far the view is zoomed.
  const id = renderer.pick(at, tank, view.tankLength(60));
  if (id !== undefined) controls.select(id);
});

/** Averages the timings over about half a second, so the numbers can be read. */
function showSpeed(stepMs: number, drawMs: number): void {
  const smooth = (old: number, now: number) => Math.round((old * 0.97 + now * 0.03) * 100) / 100;
  stats.stepMs = smooth(stats.stepMs, stepMs);
  stats.drawMs = smooth(stats.drawMs, drawMs);
  stats.fish = tank.fish.length;
  stats.drawn = fishInView(tank.fish, view).length;
}

// Fixed timestep: the simulation advances in equal 1/60 s steps whatever the screen's refresh rate,
// so a fish follows exactly the same path on a laptop, a 144 Hz monitor or a projector.
const DT = 1 / 60;
let accumulator = 0;
let previous = performance.now();

function frame(now: number): void {
  accumulator += Math.min(0.25, (now - previous) / 1000);
  previous = now;
  if (controls.paused) accumulator = 0;
  // The pointer reaches the same distance on screen however far the view is zoomed.
  pointer.radius = view.tankLength(reach.pixels);
  tank.setInfluences(pointer.influences(seconds()));
  const stepStart = performance.now();
  while (accumulator >= DT) {
    tank.step(DT);
    accumulator -= DT;
  }
  const drawStart = performance.now();
  if (controls.follow) view.follow(tank.get(controls.display.selected));
  renderer.render(tank, view, controls.display);
  showSpeed(drawStart - stepStart, performance.now() - drawStart);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
