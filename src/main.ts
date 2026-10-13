import './style.css';
import { MODELS, type BuiltinId } from './core/motion';
import { Tank } from './core/tank';
import { PointerInput } from './input/pointer';
import { Canvas2DRenderer } from './render/canvas2d';
import { buildScene } from './scenes/scenes';
import { createPanel } from './ui/panel';

const canvas = document.querySelector<HTMLCanvasElement>('#tank')!;
const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

const tank = new Tank();
const scene = buildScene(tank, new URLSearchParams(location.search).get('scene'));

const renderer = new Canvas2DRenderer(canvas);
new ResizeObserver(() => tank.resize(renderer.resize())).observe(canvas);

const panelElements = {
  equation: $('#equation'),
  editor: $<HTMLFormElement>('#editor'),
  xInput: $<HTMLInputElement>('#eq-x'),
  yInput: $<HTMLInputElement>('#eq-y'),
  error: $('#eq-error'),
};

const pointer = new PointerInput();
const seconds = () => performance.now() / 1000;
canvas.addEventListener('pointermove', (e) => {
  const { x, y } = renderer.toTank(e.clientX, e.clientY);
  pointer.move(x, y, seconds());
});
canvas.addEventListener('pointerleave', () => pointer.leave());

const controls = createPanel(tank, panelElements, pointer, scene, () => {
  const ids = Object.keys(MODELS) as BuiltinId[];
  const model = ids[Math.floor(Math.random() * ids.length)] ?? 'sine';
  const fish = tank.addFish(model, { y0: 0.2 + Math.random() * 0.6, phi: Math.random() * 6.28 });
  tank.setBehaviour(fish.id, { curiosity: Math.random() * 2 - 1, drift: 0.3, pathStrength: 0.5 });
  return fish.id;
});

canvas.addEventListener('click', (e) => {
  const id = renderer.pick(e.clientX, e.clientY, tank);
  if (id !== undefined) controls.select(id);
});

// Fixed timestep: the simulation advances in equal 1/60 s steps whatever the screen's refresh rate,
// so a fish follows exactly the same path on a laptop, a 144 Hz monitor or a projector.
const DT = 1 / 60;
let accumulator = 0;
let previous = performance.now();

function frame(now: number): void {
  accumulator += Math.min(0.25, (now - previous) / 1000);
  previous = now;
  if (controls.paused) accumulator = 0;
  tank.setInfluences(pointer.influences(seconds()));
  while (accumulator >= DT) {
    tank.step(DT);
    accumulator -= DT;
  }
  renderer.render(tank, controls.view);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
