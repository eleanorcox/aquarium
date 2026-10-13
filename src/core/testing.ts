// Helpers for tests: build a repeatable tank and advance it, each in one line.
import { seededRandom } from './random';
import { Tank } from './tank';

export const DT = 1 / 60;

export function makeTank(options: { width?: number; seed?: number } = {}): Tank {
  return new Tank(options.width ?? 1.6, seededRandom(options.seed ?? 1));
}

/** Advances the tank in the same fixed steps the app uses. */
export function run(tank: Tank, seconds: number): void {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) tank.step(DT);
}
