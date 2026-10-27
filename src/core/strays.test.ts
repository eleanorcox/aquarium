import { describe, expect, it } from 'vitest';
import type { Fish, Tank } from './tank';
import { DT, makeTank, run } from './testing';

/** Two small schools circling apart: one on the left, one on the right. */
function twoSchools(tank: Tank): { left: Fish[]; right: Fish[] } {
  const school = (cx: number, hue: number) =>
    Array.from({ length: 5 }, () => {
      const fish = tank.addFish('circle', { cx, cy: 0.5, R: 0.05, w: 0.5 });
      tank.setLook(fish.id, { hue });
      tank.setFishSize(fish.id, 0.02);
      tank.setBehaviour(fish.id, { schools: true, pathStrength: 0.25, curiosity: 1 });
      return fish;
    });
  return { left: school(0.38, 0), right: school(0.62, 200) };
}

const routeOf = (fish: Fish) => JSON.stringify({ ...fish.params, x0: 0 });

/** Drags one fish towards a point with an attracting pointer, then lets go. */
function drag(tank: Tank, fish: Fish, to: { x: number; y: number }, seconds: number): void {
  for (let i = 0; i < seconds * 60; i++) {
    const t = i / (seconds * 60);
    tank.setInfluences([{ x: fish.x + (to.x - fish.x) * t + 0.01, y: fish.y + (to.y - fish.y) * t, vx: 0, vy: 0, radius: 0.3, effect: 'attract' }]);
    tank.step(DT);
  }
  tank.setInfluences([]);
}

describe('pushed fish', () => {
  it('go home to their own school by default', () => {
    const tank = makeTank();
    const { left, right } = twoSchools(tank);
    drag(tank, left[0]!, { x: right[0]!.x, y: right[0]!.y }, 4);
    run(tank, 6);
    expect(routeOf(left[0]!)).toBe(routeOf(left[1]!));
  });

  it('join the nearest school when the tank is set that way, and swim with it from then on', () => {
    const tank = makeTank();
    tank.setStrays('join');
    const { left, right } = twoSchools(tank);
    const stray = left[0]!;
    drag(tank, stray, { x: right[0]!.x, y: right[0]!.y }, 4);
    run(tank, 6);
    expect(routeOf(stray)).toBe(routeOf(right[0]!));
    expect(stray.school).toBe(right[0]!.school);
    // It keeps its own colour, which is how the schools turn into rainbows.
    expect(stray.hue).toBe(0);
    expect(Math.hypot(stray.x - right[0]!.x, stray.y - right[0]!.y)).toBeLessThan(0.15);
  });

  it('stay with their own school when only nudged a little', () => {
    const tank = makeTank();
    tank.setStrays('join');
    const { left } = twoSchools(tank);
    drag(tank, left[0]!, { x: left[0]!.x + 0.02, y: left[0]!.y }, 0.5);
    run(tank, 4);
    expect(routeOf(left[0]!)).toBe(routeOf(left[1]!));
  });

  it('settle into their new school instead of hopping on again straight away', () => {
    const tank = makeTank();
    tank.setStrays('join');
    const { left, right } = twoSchools(tank);
    const stray = left[0]!;
    drag(tank, stray, { x: right[0]!.x, y: right[0]!.y }, 4);
    const joined = routeOf(stray);
    run(tank, 6);
    expect(routeOf(stray)).toBe(joined);
  });

  it('change school without jumping: no step moves a fish further than it could swim', () => {
    const tank = makeTank();
    tank.setStrays('join');
    const { left, right } = twoSchools(tank);
    const stray = left[0]!;
    let previous = { x: stray.x, y: stray.y };
    let biggest = 0;
    const watch = () => {
      biggest = Math.max(biggest, Math.hypot(stray.x - previous.x, stray.y - previous.y));
      previous = { x: stray.x, y: stray.y };
    };
    for (let i = 0; i < 240; i++) {
      tank.setInfluences([{ x: right[0]!.x, y: right[0]!.y, vx: 0, vy: 0, radius: 0.6, effect: 'attract' }]);
      tank.step(DT);
      watch();
    }
    tank.setInfluences([]);
    for (let i = 0; i < 300; i++) {
      tank.step(DT);
      watch();
    }
    // Two tank units a second at most, which is a fast dart; a jump across the tank would be far more.
    expect(biggest).toBeLessThan(2 * DT);
  });

  it('the choice survives saving and loading', async () => {
    const { loadTank, saveTank } = await import('./save');
    const tank = makeTank();
    tank.setStrays('join');
    tank.addFish('sine');
    const loaded = loadTank(JSON.parse(JSON.stringify(saveTank(tank))));
    if (typeof loaded === 'string') throw new Error(loaded);
    expect(loaded.strays).toBe('join');
  });

  it('a tank where strays join is the same every time', () => {
    const finish = () => {
      const tank = makeTank();
      tank.setStrays('join');
      const { left, right } = twoSchools(tank);
      drag(tank, left[0]!, { x: right[0]!.x, y: right[0]!.y }, 3);
      run(tank, 3);
      return tank.fish.map((f) => [f.x, f.y, routeOf(f)]);
    };
    expect(finish()).toEqual(finish());
  });
});
