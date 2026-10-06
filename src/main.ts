import './style.css';
import { MODELS, type ModelId } from './core/motion';
import { Tank } from './core/tank';
import { Canvas2DRenderer } from './render/canvas2d';
import { createPanel } from './ui/panel';

const canvas = document.querySelector<HTMLCanvasElement>('#tank')!;
const equation = document.querySelector<HTMLElement>('#equation')!;

const tank = new Tank();
tank.addFish('sine', { A: 0.14, w: 2.2, v: 0.14, y0: 0.32 });
tank.addFish('lissajous');
tank.addFish('circle', { cx: 0.78, cy: 0.62, R: 0.18, w: 0.8 });
tank.addFish('sine', { A: 0.06, w: 4.5, v: -0.09, y0: 0.78, phi: 1.2 });

const renderer = new Canvas2DRenderer(canvas);
new ResizeObserver(() => tank.resize(renderer.resize())).observe(canvas);

const controls = createPanel(tank, equation, () => {
  const ids = Object.keys(MODELS) as ModelId[];
  const model = ids[Math.floor(Math.random() * ids.length)] ?? 'sine';
  return tank.addFish(model, { y0: 0.2 + Math.random() * 0.6, phi: Math.random() * 6.28 }).id;
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
  while (accumulator >= DT) {
    tank.step(DT);
    accumulator -= DT;
  }
  renderer.render(tank, controls.view);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
