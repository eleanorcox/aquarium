// Fixed scenes: named tanks that are the same every time, for judging by eye how a change looks and feels.
// Open one with ?scene=name in the address, and add &visuals=name to see it in a particular look.
import { MODELS, type BuiltinId } from '../core/motion';
import type { Tank } from '../core/tank';

export interface Scene {
  name: string;
  /** What to watch for when judging this scene by eye. */
  lookFor: string;
  /** Whether trails start switched on. Off for tanks with many fish, where they are slow and cluttered. */
  trails?: boolean;
  /** Seconds to run before the scene is shown, so schools that start on one point have spread out. */
  settle?: number;
  /** Whether the tank fills the screen, with no margin, so you are in the water instead of looking in. */
  fill?: boolean;
  build(tank: Tank): void;
}

export const DEFAULT_SCENE = 'mixed';

export const SCENES: Record<string, Scene> = {
  mixed: {
    name: 'Mixed tank',
    lookFor: 'The starting tank: a mix of temperaments and one small school. Does it feel alive without being busy?',
    settle: 3,
    build(tank) {
      const mixed = { drift: 0.3, pathStrength: 0.5 };
      tank.setBehaviour(tank.addFish('sine', { A: 0.12, w: 2.2, v: 0.14, y0: 0.22 }).id, { ...mixed, curiosity: 0.8 });
      tank.setBehaviour(tank.addFish('rose', { R: 0.3 }).id, { ...mixed, curiosity: -1 });
      tank.setBehaviour(tank.addFish('circle', { cx: 0.82, cy: 0.6, R: 0.14, w: 0.8 }).id, { ...mixed, curiosity: 0.5 });
      tank.setBehaviour(tank.addFish('zigzag', { A: 0.05, w: 3, v: -0.1, y0: 0.62 }).id, { ...mixed, curiosity: -0.6 });
      tank.setBehaviour(tank.addFish('bounce', { A: 0.12, y0: 0.92 }).id, { ...mixed, curiosity: -0.3 });
      for (let i = 0; i < 7; i++) {
        tank.setBehaviour(tank.addFish('figure8', { A: 0.55, w: 0.35 }).id, { schools: true, curiosity: -0.7, drift: 0.5, pathStrength: 0.6 });
      }
    },
  },
  paths: {
    name: 'Every path',
    lookFor: 'One fish on each built-in path, taking no notice of the pointer. Are the paths exact and the turns smooth?',
    build(tank) {
      for (const id of Object.keys(MODELS) as BuiltinId[]) tank.addFish(id);
    },
  },
  temperaments: {
    name: 'Shy to curious',
    lookFor: 'Nine fish holding still, shy on the left to curious on the right. Sweep the pointer along the row, slowly and then fast.',
    build(tank) {
      for (let i = 0; i < 9; i++) {
        const fish = tank.addFish('sine', { A: 0, v: 0, y0: 0.5, x0: 0.1 + i * 0.1 });
        tank.setBehaviour(fish.id, { curiosity: i / 4 - 1, pathStrength: 0.5 });
      }
    },
  },
  drift: {
    name: 'Drift',
    lookFor: 'Five fish on matching circles, with no drift on the left rising to full drift on the right. Does drift read as swimming, not jitter?',
    build(tank) {
      for (let i = 0; i < 5; i++) {
        const fish = tank.addFish('circle', { cx: 0.14 + i * 0.18, cy: 0.5, R: 0.1, w: 0.8 });
        tank.setBehaviour(fish.id, { drift: i / 4 });
      }
    },
  },
  school: {
    name: 'One school',
    lookFor: 'Thirty fish sharing one route. Do they hold together as a school, keep apart, and part around the pointer?',
    settle: 3,
    build(tank) {
      for (let i = 0; i < 30; i++) {
        const fish = tank.addFish('lissajous', { speed: 0.3 });
        tank.setBehaviour(fish.id, { schools: true, curiosity: -0.8, drift: 0.5, pathStrength: 0.6 });
      }
    },
  },
  shoal: {
    name: 'Five hundred fish',
    lookFor: 'A wide tank of 500 small fish in five schools. Does it stay smooth, and can you drag and zoom around it?',
    trails: false,
    settle: 3,
    build(tank) {
      tank.setWidth(3);
      const routes: [BuiltinId, Record<string, number>, number][] = [
        ['lissajous', { A: 0.8, B: 0.3, speed: 0.25 }, -0.8],
        ['figure8', { A: 0.7, w: 0.3 }, 0.6],
        ['circle', { cx: 0.2, cy: 0.5, R: 0.25, w: 0.4 }, -0.4],
        ['circle', { cx: 0.8, cy: 0.5, R: 0.25, w: -0.4 }, 0.9],
        ['rose', { R: 0.4, k: 2, w: 0.25 }, -1],
      ];
      for (const [model, params, curiosity] of routes) {
        for (let i = 0; i < 100; i++) {
          const fish = tank.addFish(model, params);
          tank.setFishSize(fish.id, 0.012);
          tank.setBehaviour(fish.id, { schools: true, curiosity, drift: 0.5, pathStrength: 0.15 });
        }
      }
    },
  },
  whirlpool: {
    name: 'Whirlpool',
    lookFor: 'One formation of 48 fish sharing a single equation: each fish uses its place i of n to find its own ring and speed. Open the equation to see how.',
    settle: 1,
    build(tank) {
      const leader = tank.addFish('custom', { a: 0.8, b: 0.9, c: 0.4 });
      tank.setEquations(leader.id, {
        x: 'cx + (0.04 + 0.4 * i / n) * cos(a * t * (1.4 - i / n) + 2 * pi * i * 0.618)',
        y: 'cy + b * (0.04 + 0.4 * i / n) * sin(a * t * (1.4 - i / n) + 2 * pi * i * 0.618)',
      });
      tank.makeFormation(leader.id, 48);
      for (const fish of tank.fish) tank.setBehaviour(fish.id, { drift: 0.3, curiosity: -0.6, pathStrength: 0.5 });
    },
  },
  field: {
    name: 'A field of fish',
    lookFor: 'You are in the middle of one enormous school streaming past, filling the screen. Drag to look around; put the pointer or a hand in it and watch it part.',
    trails: false,
    settle: 3,
    fill: true,
    build(tank) {
      tank.setWidth(4);
      for (let i = 0; i < 700; i++) {
        // Spread evenly but irregularly through the whole tank, all streaming the same way at slightly different paces.
        const fish = tank.addFish('sine', {
          A: 0.02 + 0.04 * spread(i, 1),
          w: 0.5 + 0.6 * spread(i, 2),
          phi: 6.28 * spread(i, 3),
          v: 0.06 + 0.02 * spread(i, 4),
          y0: 0.07 + 0.86 * spread(i, 5),
          x0: spread(i, 6),
        });
        tank.setFishSize(fish.id, 0.011 + 0.004 * spread(i, 7));
        tank.setBehaviour(fish.id, { schools: true, curiosity: -0.7, drift: 0.6, pathStrength: 0.25 });
      }
    },
  },
};

/** A repeatable number from 0 up to 1 for each fish, for spreading fish about without randomness. */
function spread(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Fills the tank with the named scene, or the default one if the name is not known. Returns the name used. */
export function buildScene(tank: Tank, id: string | null): string {
  const known = id !== null && Object.hasOwn(SCENES, id) ? id : DEFAULT_SCENE;
  const scene = SCENES[known]!;
  scene.build(tank);
  for (let step = 0; step < (scene.settle ?? 0) * 60; step++) tank.step(1 / 60);
  // Settling leaves long trails behind fish that have only just appeared.
  tank.clearTrails();
  return known;
}
