// Fixed scenes: named tanks that are the same every time, for judging by eye how a change looks and feels.
// Open one with ?scene=name in the address.
import { MODELS, type BuiltinId } from '../core/motion';
import type { Tank } from '../core/tank';

export interface Scene {
  name: string;
  /** What to watch for when judging this scene by eye. */
  lookFor: string;
  /** Whether trails start switched on. Off for tanks with many fish, where they are slow and cluttered. */
  trails?: boolean;
  build(tank: Tank): void;
}

export const DEFAULT_SCENE = 'mixed';

export const SCENES: Record<string, Scene> = {
  mixed: {
    name: 'Mixed tank',
    lookFor: 'The starting tank: a mix of temperaments and one small school. Does it feel alive without being busy?',
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
    build(tank) {
      for (let i = 0; i < 30; i++) {
        const fish = tank.addFish('lissajous', { speed: 0.3 });
        tank.setBehaviour(fish.id, { schools: true, curiosity: -0.8, drift: 0.5, pathStrength: 0.6 });
      }
    },
  },
};

/** Fills the tank with the named scene, or the default one if the name is not known. Returns the name used. */
export function buildScene(tank: Tank, id: string | null): string {
  const known = id !== null && Object.hasOwn(SCENES, id) ? id : DEFAULT_SCENE;
  SCENES[known]!.build(tank);
  return known;
}
