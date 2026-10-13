import { describe, expect, it } from 'vitest';
import { MODELS, type BuiltinId } from './motion';
import { MAX_OFFSET_SPEED, STARTLE_SPEED, type Influence } from './steering';
import type { Fish, Tank } from './tank';
import { DT, makeTank, run } from './testing';

const BUILTINS = Object.keys(MODELS) as BuiltinId[];
const WIDTH = 1.6;
/** An eighth of a typical fish length: closer than this reads as "on the route". */
const ON_ROUTE = 0.005;

const strayed = (fish: Fish) => Math.hypot(fish.offset.x, fish.offset.y);
const influence = (x: number, y: number, extra: Partial<Influence> = {}): Influence => ({ x, y, vx: 0, vy: 0, radius: 0.3, ...extra });

/** A fish whose route is a single point, so any movement is down to steering. */
function stillFish(tank: Tank, behaviour: Parameters<Tank['setBehaviour']>[1] = {}, y0 = 0.5): Fish {
  const fish = tank.addFish('sine', { A: 0, v: 0, y0, x0: 0.5 });
  tank.setBehaviour(fish.id, behaviour);
  return fish;
}

describe('a fish and its route', () => {
  it('keeps an unpushed fish exactly on its route, on every built-in path', () => {
    for (const id of BUILTINS) {
      const tank = makeTank();
      const fish = tank.addFish(id);
      for (let i = 0; i < 600; i++) {
        tank.step(DT);
        const route = MODELS[id].position(fish.params, tank.t, WIDTH);
        expect([fish.x, fish.y], id).toEqual([route.x, route.y]);
      }
    }
  });

  it('keeps a fish exactly on its route when an influence is out of reach', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: -1 });
    tank.setInfluences([influence(0.8 + 0.31, 0.5)]);
    run(tank, 1);
    expect(strayed(fish)).toBe(0);
  });

  it('returns to its route once the influence has gone', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: -1 });
    tank.setInfluences([influence(0.9, 0.5)]);
    run(tank, 1);
    expect(strayed(fish)).toBeGreaterThan(ON_ROUTE * 4);
    tank.setInfluences([]);
    run(tank, 2);
    expect(strayed(fish)).toBeLessThan(ON_ROUTE);
  });

  it('is pushed further by the same influence when it holds its route less strongly', () => {
    const push = (pathStrength: number) => {
      const tank = makeTank();
      const fish = stillFish(tank, { curiosity: -1, pathStrength });
      tank.setInfluences([influence(0.9, 0.5)]);
      run(tank, 1);
      return strayed(fish);
    };
    expect(push(0.3)).toBeGreaterThan(push(1) * 1.5);
  });

  it('follows a moving route while displaced from it', () => {
    const tank = makeTank();
    const fish = tank.addFish('circle');
    tank.setBehaviour(fish.id, { curiosity: -1 });
    tank.setInfluences([influence(fish.x, fish.y + 0.05)]);
    run(tank, 0.5);
    tank.setInfluences([]);
    run(tank, 2);
    const route = MODELS.circle.position(fish.params, tank.t, WIDTH);
    expect(Math.hypot(fish.x - route.x, fish.y - route.y)).toBeLessThan(ON_ROUTE);
  });
});

describe('how a fish responds to an influence', () => {
  it('a shy fish moves away and a curious fish moves closer', () => {
    const tank = makeTank();
    const shy = stillFish(tank, { curiosity: -1 });
    const curious = stillFish(tank, { curiosity: 1 });
    tank.setInfluences([influence(0.9, 0.5)]);
    run(tank, 0.5);
    expect(shy.x).toBeLessThan(0.8 - ON_ROUTE);
    expect(curious.x).toBeGreaterThan(0.8 + ON_ROUTE);
  });

  it('a fish that is neither shy nor curious ignores it', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: 0 });
    tank.setInfluences([influence(0.9, 0.5)]);
    run(tank, 0.5);
    expect(strayed(fish)).toBe(0);
  });

  it('a curious fish stops short of the influence instead of swimming through it', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: 1, pathStrength: 0.1 });
    tank.setInfluences([influence(0.9, 0.5)]);
    for (let i = 0; i < 300; i++) {
      tank.step(DT);
      expect(fish.x).toBeLessThanOrEqual(0.9);
    }
  });

  it('a scatter override sends a curious fish away, and an attract override draws a shy fish in', () => {
    const tank = makeTank();
    const curious = stillFish(tank, { curiosity: 1 });
    tank.setInfluences([influence(0.9, 0.5, { effect: 'scatter' })]);
    run(tank, 0.5);
    expect(curious.x).toBeLessThan(0.8 - ON_ROUTE);

    const other = makeTank();
    const shy = stillFish(other, { curiosity: -1 });
    other.setInfluences([influence(0.9, 0.5, { effect: 'attract' })]);
    run(other, 0.5);
    expect(shy.x).toBeGreaterThan(0.8 + ON_ROUTE);
  });

  it('a fast-moving influence startles even a curious fish', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: 1 });
    tank.setInfluences([influence(0.9, 0.5, { vx: STARTLE_SPEED * 1.1 })]);
    run(tank, 0.5);
    expect(fish.x).toBeLessThan(0.8 - ON_ROUTE);
  });

  it('turns to face the way it is pushed', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: -1 });
    tank.setInfluences([influence(0.9, 0.5)]);
    run(tank, 0.2);
    expect(Math.cos(fish.heading)).toBeLessThan(-0.9);
  });

  it('keeps behaviour settings inside their ranges', () => {
    const tank = makeTank();
    const fish = tank.addFish('sine');
    tank.setBehaviour(fish.id, { curiosity: 5, pathStrength: -2 });
    expect([fish.curiosity, fish.pathStrength]).toEqual([1, 0]);
  });
});

describe('tank edges', () => {
  it('a push cannot carry a fish out through the top or bottom', () => {
    const tank = makeTank();
    const fish = stillFish(tank, { curiosity: -1, pathStrength: 0.05 }, 0.9);
    tank.setInfluences([influence(0.8, 0.8)]);
    for (let i = 0; i < 300; i++) {
      tank.step(DT);
      expect(fish.y).toBeLessThanOrEqual(1);
    }
    expect(fish.y).toBeGreaterThan(0.95);
  });

  it('a fish on a wrapping route that is pushed past the side comes back in on the other side', () => {
    const tank = makeTank();
    const fish = tank.addFish('sine', { A: 0, v: 0, y0: 0.5, x0: 0.99 });
    tank.setBehaviour(fish.id, { curiosity: -1, pathStrength: 0.05 });
    tank.setInfluences([influence(1.5, 0.5)]);
    run(tank, 1);
    expect(fish.x).toBeGreaterThanOrEqual(0);
    expect(fish.x).toBeLessThan(0.3);
  });
});

describe('always true', () => {
  /** Every built-in path, mixed temperaments, and two influences sweeping around the tank. */
  function busyTank(seed: number): Tank {
    const tank = makeTank({ seed });
    BUILTINS.forEach((id, i) => {
      const fish = tank.addFish(id);
      tank.setBehaviour(fish.id, { curiosity: (i % 5) / 2 - 1, pathStrength: 0.1 + (i % 4) * 0.3 });
    });
    return tank;
  }

  function sweep(tank: Tank, step: (tank: Tank) => void): void {
    for (let i = 0; i < 900; i++) {
      const a = i / 40;
      tank.setInfluences([
        influence(0.8 + 0.7 * Math.cos(a), 0.5 + 0.45 * Math.sin(a * 1.3), { vx: -0.7 * Math.sin(a) * 1.5, vy: 0.9 * Math.cos(a * 1.3) }),
        influence(0.8 - 0.6 * Math.sin(a * 0.7), 0.5, { effect: i % 200 < 100 ? 'scatter' : 'attract' }),
      ]);
      tank.step(DT);
      step(tank);
    }
  }

  it('no fish leaves the tank, goes missing or outruns its top speed', () => {
    for (const seed of [1, 2, 3]) {
      sweep(busyTank(seed), (tank) => {
        for (const fish of tank.fish) {
          expect(Number.isFinite(fish.x) && Number.isFinite(fish.y) && Number.isFinite(fish.heading), fish.model).toBe(true);
          expect(fish.x, fish.model).toBeGreaterThanOrEqual(0);
          expect(fish.x, fish.model).toBeLessThanOrEqual(WIDTH);
          expect(fish.y, fish.model).toBeGreaterThanOrEqual(0);
          expect(fish.y, fish.model).toBeLessThanOrEqual(1);
          expect(Math.hypot(fish.offsetVelocity.x, fish.offsetVelocity.y), fish.model).toBeLessThanOrEqual(MAX_OFFSET_SPEED + 1e-9);
        }
      });
    }
  });

  it('the same tank and the same steps give exactly the same result', () => {
    const finish = () => {
      const tank = busyTank(4);
      sweep(tank, () => {});
      return tank.fish.map((fish) => [fish.x, fish.y, fish.heading]);
    };
    expect(finish()).toEqual(finish());
  });
});
