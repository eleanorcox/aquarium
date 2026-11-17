// Fixed scenes: named tanks that are the same every time, for judging by eye how a change looks and feels.
// Open one with ?scene=name in the address, and add &visuals=name to see it in a particular look.
import { MODELS, type BuiltinId } from '../core/motion';
import type { Tank } from '../core/tank';
import { SPECIES } from '../species/catalogue';
import { addSpecies } from '../species/stock';

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
  /** Anything to set once the scene has settled, such as rules that would misfire while schools spread out. */
  settled?(tank: Tank): void;
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
  colours: {
    name: 'Colour schools',
    lookFor: 'Eight schools of forty fish, each its own colour, circling in their own patches. They never meet on their own. Push fish out of a school and they join whichever school is nearest, keeping their colour, so stirring turns the schools into rainbows.',
    trails: false,
    settle: 3,
    // Schools start on one point and burst apart while settling, which must not count as being knocked out.
    settled: (tank) => tank.setStrays('join'),
    build(tank) {
      // Eight small circles in two rows: far enough apart that no school sees another unless fish are pushed,
      // near enough that a push can carry fish across to a neighbour.
      const hues = [0, 30, 55, 110, 175, 210, 265, 315];
      hues.forEach((hue, g) => {
        let first: number | undefined;
        const params = { cx: 0.14 + 0.24 * (g % 4), cy: g < 4 ? 0.27 : 0.73, R: 0.05, w: (g % 2 ? -1 : 1) * (0.5 + 0.05 * g) };
        for (let i = 0; i < 40; i++) {
          const fish = tank.addFish('circle', params);
          tank.setLook(fish.id, { hue });
          tank.setFishSize(fish.id, 0.012);
          // Each colour schools only with itself, so schools never pull at each other when left alone.
          first ??= fish.id;
          tank.joinSchool(fish.id, first);
          // A loose hold on the route, so a hand can push fish over to the next school.
          tank.setBehaviour(fish.id, { schools: true, pathStrength: 0.2, drift: 0.3, curiosity: -0.8 });
        }
      });
    },
  },
  pacific: {
    name: 'Pacific (real fish)',
    lookFor: 'A real-fish tank of Pacific saltwater species: a sardine school, a group of yellowfin tuna and a pair of Moorish idols, each swimming and schooling in its own way.',
    settle: 3,
    build(tank) {
      tank.setRules({ kind: 'real', biome: 'Pacific saltwater' });
      for (const id of ['pacific-sardine', 'yellowfin-tuna', 'moorish-idol']) {
        const species = SPECIES[id];
        if (species) addSpecies(tank, species);
      }
    },
  },
  river: {
    name: 'British river (real fish)',
    lookFor: 'A real-fish tank of British freshwater species: a pike, a perch and an eel near the bottom. Try adding a sardine: it should be refused.',
    settle: 1,
    build(tank) {
      tank.setRules({ kind: 'real', biome: 'British freshwater' });
      for (const id of ['northern-pike', 'european-perch', 'european-eel', 'european-perch']) {
        const species = SPECIES[id];
        if (species) addSpecies(tank, species);
      }
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
  free: {
    name: 'Free swimming',
    lookFor: 'No fish has a route. Two schools roam the whole tank, turning as one, with a few loners about. Do they look as if they are going somewhere? Do they turn naturally at the edges?',
    trails: false,
    settle: 3,
    build(tank) {
      // Each school starts spread over an area roomy enough for its fish, so it does not burst apart.
      const school = (count: number, hue: number, size: number, at: { x: number; y: number }, heading: number) => {
        const side = Math.sqrt(count) * 2.5 * size;
        let first: number | undefined;
        for (let i = 0; i < count; i++) {
          const fish = tank.addFish('free', {
            v: 0.1 + 0.01 * spread(i + hue, 1),
            y0: at.y + side * (spread(i + hue, 2) - 0.5),
            A: 0.35,
            x0: at.x + ((side * 1.5) / tank.width) * (spread(i + hue, 3) - 0.5),
          });
          first ??= fish.id;
          tank.setLook(fish.id, { hue });
          tank.setFishSize(fish.id, size);
          tank.setBehaviour(fish.id, { schools: true, drift: 0.3, curiosity: -0.6 });
          tank.joinSchool(fish.id, first);
          tank.aim(fish.id, heading);
        }
      };
      school(80, 200, 0.016, { x: 0.25, y: 0.35 }, 0.2);
      school(30, 25, 0.024, { x: 0.7, y: 0.7 }, Math.PI - 0.3);
      const loners: [number, number, number, number][] = [
        // hue, size, temperament, cruising speed
        [120, 0.04, 1, 0.08],
        [300, 0.035, -1, 0.14],
        [55, 0.05, 0.3, 0.05],
      ];
      loners.forEach(([hue, size, curiosity, v], i) => {
        const fish = tank.addFish('free', { v, y0: 0.5, A: 0.4, x0: 0.2 + 0.3 * i });
        tank.setLook(fish.id, { hue });
        tank.setFishSize(fish.id, size);
        tank.setBehaviour(fish.id, { curiosity, drift: 0.6 });
      });
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
  scene.settled?.(tank);
  tank.clearTrails();
  return known;
}
