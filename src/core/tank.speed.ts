import { it } from 'vitest';
import { seededRandom } from './random';
import { Tank } from './tank';

// Written straight to the terminal, because the test runner hides console.log. Declared here to avoid
// pulling in Node's type definitions for one line.
declare const process: { stdout: { write(text: string): void } };

const DT = 1 / 60;
/** One step must fit well inside a frame, which is 16.7 ms at 60 frames a second. */
const FRAME_MS = 1000 / 60;

/** A wide tank of small schooling, drifting fish with a pointer among them: the heaviest case there is. */
function busyTank(count: number): Tank {
  const tank = new Tank(3, seededRandom(1));
  for (let i = 0; i < count; i++) {
    const fish = tank.addFish(i % 2 ? 'lissajous' : 'figure8', i % 2 ? { A: 0.8, speed: 0.25 } : { A: 0.7, w: 0.3 });
    tank.setFishSize(fish.id, 0.012);
    tank.setBehaviour(fish.id, { schools: true, curiosity: -0.8, drift: 0.5, pathStrength: 0.15 });
  }
  tank.setInfluences([{ x: 1.5, y: 0.5, vx: 0, vy: 0, radius: 0.2 }]);
  return tank;
}

it('time to step a tank of schooling fish', () => {
  const lines = ['fish   ms per step   share of a frame'];
  for (const count of [100, 500, 2000]) {
    const tank = busyTank(count);
    // Let the schools spread out first, so the timing is of a settled tank, not of fish piled on one point.
    for (let i = 0; i < 300; i++) tank.step(DT);
    const steps = 200;
    const start = performance.now();
    for (let i = 0; i < steps; i++) tank.step(DT);
    const ms = (performance.now() - start) / steps;
    lines.push(`${String(count).padEnd(6)} ${ms.toFixed(2).padEnd(13)} ${((ms / FRAME_MS) * 100).toFixed(0)}%`);
  }
  process.stdout.write(`\n${lines.join('\n')}\n\n`);
}, 120_000);
