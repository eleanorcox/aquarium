import { describe, expect, it } from 'vitest';
import type { Fish, Tank } from './tank';
import { DT, makeTank, run } from './testing';

/** Samples a fish once a tenth of a second for some seconds. */
function watch(tank: Tank, fish: Fish, seconds: number): { x: number; y: number; speed: number }[] {
  const seen = [];
  for (let i = 0; i < seconds * 10; i++) {
    run(tank, 0.1);
    seen.push({ x: fish.x, y: fish.y, speed: fish.speed });
  }
  return seen;
}

describe('a free-swimming fish', () => {
  it('keeps swimming at about its cruising speed when left alone', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { v: 0.1 });
    for (const { speed } of watch(tank, fish, 20).slice(20)) expect(speed).toBeGreaterThan(0.05);
  });

  it('turns away from the edges and never leaves the tank', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { v: 0.2, A: 0.5 });
    for (const { x, y } of watch(tank, fish, 60)) {
      expect(x).toBeGreaterThan(0.01);
      expect(x).toBeLessThan(tank.width - 0.01);
      expect(y).toBeGreaterThan(0.01);
      expect(y).toBeLessThan(0.99);
    }
  });

  it('goes all over the tank instead of round one loop', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { v: 0.2 });
    tank.setBehaviour(fish.id, { drift: 0.5 });
    const xs = watch(tank, fish, 60).map((p) => p.x);
    expect(Math.min(...xs)).toBeLessThan(tank.width * 0.3);
    expect(Math.max(...xs)).toBeGreaterThan(tank.width * 0.7);
  });

  it('swims mostly level, as fish do, not straight up and down', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { v: 0.12 });
    tank.setBehaviour(fish.id, { drift: 0.6 });
    tank.aim(fish.id, Math.PI / 2);
    let climb = 0;
    for (let i = 0; i < 600; i++) {
      run(tank, 0.1);
      climb += Math.abs(Math.sin(fish.heading));
    }
    expect(climb / 600).toBeLessThan(0.4);
  });

  it('keeps near its preferred depth', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { v: 0.15, y0: 0.3, A: 0.1 });
    tank.setBehaviour(fish.id, { drift: 0.5 });
    for (const { y } of watch(tank, fish, 40).slice(50)) expect(Math.abs(y - 0.3)).toBeLessThan(0.2);
  });

  it('is pushed away by a pointer and does not swim back to where it was', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { v: 0, x0: 0.5, y0: 0.5 });
    tank.setBehaviour(fish.id, { curiosity: -1 });
    run(tank, 1);
    const start = { x: fish.x, y: fish.y };
    tank.setInfluences([{ x: start.x - 0.05, y: start.y, vx: 0, vy: 0, radius: 0.2 }]);
    run(tank, 1);
    tank.setInfluences([]);
    run(tank, 3);
    expect(fish.x - start.x).toBeGreaterThan(0.05);
  });

  it('starts in a different direction from the free fish added before it', () => {
    const tank = makeTank();
    const a = tank.addFish('free');
    const b = tank.addFish('free');
    run(tank, 0.1);
    expect(Math.abs(a.heading - b.heading)).toBeGreaterThan(0.3);
  });

  it('swims in a school with other free schooling fish, all heading the same way', () => {
    const tank = makeTank({ width: 2 });
    const school = Array.from({ length: 30 }, (_, i) => {
      const fish = tank.addFish('free', { v: 0.12, x0: 0.4 + 0.02 * (i % 6), y0: 0.4 + 0.035 * Math.floor(i / 6) });
      tank.setFishSize(fish.id, 0.02);
      tank.setBehaviour(fish.id, { schools: true, drift: 0.3 });
      tank.aim(fish.id, 0.3);
      return fish;
    });
    run(tank, 20);
    const heading = school.reduce((sum, f) => ({ x: sum.x + Math.cos(f.heading), y: sum.y + Math.sin(f.heading) }), { x: 0, y: 0 });
    expect(Math.hypot(heading.x, heading.y) / school.length).toBeGreaterThan(0.8);
    const middle = { x: school.reduce((s, f) => s + f.x, 0) / 30, y: school.reduce((s, f) => s + f.y, 0) / 30 };
    for (const fish of school) expect(Math.hypot(fish.x - middle.x, fish.y - middle.y)).toBeLessThan(0.3);
  });

  it('plays back the same way every time', () => {
    const swim = () => {
      const tank = makeTank();
      for (let i = 0; i < 5; i++) tank.setBehaviour(tank.addFish('free').id, { drift: 0.6, schools: true });
      run(tank, 10);
      return tank.fish.map((f) => [f.x, f.y]);
    };
    expect(swim()).toEqual(swim());
  });
});

describe('switching between a route and free swimming', () => {
  it('sets a fish free where it is, carrying on the way it was going', () => {
    const tank = makeTank();
    const fish = tank.addFish('sine');
    run(tank, 2);
    const before = { x: fish.x, y: fish.y, heading: fish.heading };
    tank.setModel(fish.id, 'free');
    tank.step(DT);
    expect(Math.hypot(fish.x - before.x, fish.y - before.y)).toBeLessThan(0.02);
    expect(Math.abs(fish.heading - before.heading)).toBeLessThan(0.3);
  });

  it('puts a free fish on a route without jumping: it swims there', () => {
    const tank = makeTank();
    const fish = tank.addFish('free', { x0: 0.2, y0: 0.2 });
    run(tank, 2);
    const before = { x: fish.x, y: fish.y };
    tank.setModel(fish.id, 'circle');
    tank.step(DT);
    expect(Math.hypot(fish.x - before.x, fish.y - before.y)).toBeLessThan(0.05);
    run(tank, 5);
    expect(Math.hypot(fish.offset.x, fish.offset.y)).toBeLessThan(0.01);
  });

  it('starts a typed equation from a free fish without failing', () => {
    const tank = makeTank();
    const fish = tank.addFish('free');
    tank.setModel(fish.id, 'custom');
    run(tank, 1);
    expect(Number.isFinite(fish.x)).toBe(true);
  });
});
