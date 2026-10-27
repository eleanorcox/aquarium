import { describe, expect, it } from 'vitest';
import { MODELS, type BuiltinId } from './motion';
import { DRIFT_FORCE, MAX_OFFSET_SPEED, REFERENCE_SIZE, ROUTE_STIFFNESS, STARTLE_SPEED, type Influence } from './steering';
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

  it('an influence with a shorter reach pushes less far, in proportion', () => {
    // So that zooming in, which shortens the pointer's reach in the tank, does not fling fish across it.
    const pushed = (radius: number) => {
      const tank = makeTank();
      const fish = stillFish(tank, { curiosity: -1 });
      tank.setInfluences([influence(0.8 + radius / 2, 0.5, { radius })]);
      run(tank, 3);
      return strayed(fish);
    };
    expect(pushed(0.1) / 0.1).toBeCloseTo(pushed(0.3) / 0.3, 2);
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

describe('drift', () => {
  /**
   * The furthest drift can carry a fish at full path strength: the largest drift push, which is
   * DRIFT_FORCE along both axes at once, divided by the pull back per unit of offset.
   */
  const FURTHEST = (DRIFT_FORCE * Math.SQRT2) / ROUTE_STIFFNESS;

  /** A drifting fish of the size the drift strength is set for. */
  function drifter(tank: Tank, drift = 1): Fish {
    const fish = tank.addFish('circle');
    tank.setBehaviour(fish.id, { drift });
    tank.setFishSize(fish.id, REFERENCE_SIZE);
    return fish;
  }

  it('a drifting fish strays from its route, but never beyond the furthest drift can carry it', () => {
    const tank = makeTank();
    const fish = drifter(tank);
    let furthest = 0;
    for (let i = 0; i < 60 * 60; i++) {
      tank.step(DT);
      furthest = Math.max(furthest, strayed(fish));
    }
    expect(furthest).toBeGreaterThan(ON_ROUTE);
    expect(furthest).toBeLessThanOrEqual(FURTHEST);
  });

  it('less drift means straying less', () => {
    const furthest = (drift: number) => {
      const tank = makeTank();
      const fish = drifter(tank, drift);
      let max = 0;
      for (let i = 0; i < 20 * 60; i++) {
        tank.step(DT);
        max = Math.max(max, strayed(fish));
      }
      return max;
    };
    expect(furthest(0.2)).toBeLessThan(furthest(1) / 2);
  });

  it('a smaller fish drifts less far, in proportion to its size', () => {
    const furthest = (size: number) => {
      const tank = makeTank();
      const fish = drifter(tank);
      tank.setFishSize(fish.id, size);
      let max = 0;
      for (let i = 0; i < 20 * 60; i++) {
        tank.step(DT);
        max = Math.max(max, strayed(fish));
      }
      return max;
    };
    expect(furthest(0.01) / 0.01).toBeCloseTo(furthest(0.04) / 0.04, 5);
  });

  it('two fish on the same route do not stray identically', () => {
    const tank = makeTank();
    const a = drifter(tank);
    const b = drifter(tank);
    run(tank, 5);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(ON_ROUTE);
  });

  it('the same tank replayed strays identically', () => {
    const finish = () => {
      const tank = makeTank({ seed: 9 });
      const fish = drifter(tank);
      run(tank, 10);
      return [fish.x, fish.y];
    };
    expect(finish()).toEqual(finish());
  });
});

describe('schooling', () => {
  const ONLY = {
    separation: { separation: 1, alignment: 0, cohesion: 0 },
    alignment: { separation: 0, alignment: 1, cohesion: 0 },
    cohesion: { separation: 0, alignment: 0, cohesion: 1 },
  };

  /** A fish on a one-point route at the given spot, set to school or not. */
  function at(tank: Tank, x: number, y: number, schools = true): Fish {
    const fish = tank.addFish('sine', { A: 0, v: 0, y0: y, x0: x / WIDTH });
    tank.setBehaviour(fish.id, { schools, pathStrength: 0.2 });
    tank.setFishSize(fish.id, REFERENCE_SIZE);
    return fish;
  }

  /** A schooling fish swimming steadily to the right. */
  function swimmer(tank: Tank, x: number, y: number): Fish {
    const fish = tank.addFish('sine', { A: 0, v: 0.2, y0: y, x0: x / WIDTH });
    tank.setBehaviour(fish.id, { schools: true });
    tank.setFishSize(fish.id, REFERENCE_SIZE);
    return fish;
  }

  it('two schooling fish that are too close move apart', () => {
    const tank = makeTank();
    tank.setFlock(ONLY.separation);
    const a = at(tank, 0.8, 0.5);
    const b = at(tank, 0.82, 0.5);
    run(tank, 1);
    expect(b.x - a.x).toBeGreaterThan(0.02 + ON_ROUTE);
  });

  it('a schooling fish among neighbours heading one way turns that way', () => {
    const tank = makeTank();
    tank.setFlock(ONLY.alignment);
    const fish = at(tank, 0.8, 0.5);
    swimmer(tank, 0.75, 0.38);
    swimmer(tank, 0.75, 0.62);
    run(tank, 0.5);
    expect(fish.x).toBeGreaterThan(0.8);
    expect(Math.cos(fish.heading)).toBeGreaterThan(0.9);
  });

  it('a schooling fish follows its nearest few neighbours, not everyone in sight', () => {
    // Real fish react to their one to three nearest neighbours. Three close by swim right; five further off, still in sight, swim left.
    const tank = makeTank();
    tank.setFlock(ONLY.alignment);
    const fish = at(tank, 0.8, 0.5);
    for (const y of [0.42, 0.58]) swimmer(tank, 0.78, y);
    swimmer(tank, 0.88, 0.5);
    for (const [dx, dy] of [[-0.2, 0], [0.2, 0.05], [0, 0.2], [0.05, -0.2], [-0.14, -0.14]] as const) {
      const away = tank.addFish('sine', { A: 0, v: -0.2, y0: 0.5 + dy, x0: (0.8 + dx) / WIDTH });
      tank.setBehaviour(away.id, { schools: true });
      tank.setFishSize(away.id, REFERENCE_SIZE);
    }
    run(tank, 0.3);
    expect(Math.cos(fish.heading)).toBeGreaterThan(0.5);
  });

  it('a schooling fish apart from its group moves towards it', () => {
    const tank = makeTank();
    tank.setFlock(ONLY.cohesion);
    const fish = at(tank, 0.8, 0.5);
    for (const y of [0.45, 0.5, 0.55]) at(tank, 1, y);
    run(tank, 1);
    expect(fish.x).toBeGreaterThan(0.8 + ON_ROUTE);
  });

  it('a fish that does not school ignores the school and is ignored by it', () => {
    const tank = makeTank();
    const loner = at(tank, 0.8, 0.5, false);
    const schooler = at(tank, 0.82, 0.5);
    run(tank, 1);
    expect(strayed(loner)).toBe(0);
    expect(strayed(schooler)).toBe(0);
  });

  it('fish beyond each other’s sight do not school together', () => {
    const tank = makeTank();
    const a = at(tank, 0.3, 0.5);
    const b = at(tank, 1.3, 0.5);
    run(tank, 1);
    expect(strayed(a) + strayed(b)).toBe(0);
  });

  it('small fish keep a smaller distance and see a shorter way, in proportion to their size', () => {
    // 0.06 apart is inside the personal space of full-size fish and well outside the sight of fish a tenth the size.
    const apart = (size: number) => {
      const tank = makeTank();
      const a = at(tank, 0.8, 0.5);
      const b = at(tank, 0.86, 0.5);
      for (const fish of [a, b]) tank.setFishSize(fish.id, size);
      run(tank, 1);
      return strayed(a) + strayed(b);
    };
    expect(apart(REFERENCE_SIZE)).toBeGreaterThan(ON_ROUTE);
    expect(apart(REFERENCE_SIZE / 10)).toBe(0);
  });

  it('fish on a wrapping route school across the edge of the tank', () => {
    const tank = makeTank();
    tank.setFlock(ONLY.cohesion);
    const nearLeft = at(tank, 0.02, 0.5);
    const nearRight = at(tank, WIDTH - 0.02, 0.5);
    run(tank, 1);
    // Each is drawn towards the other the short way, across the edge, not the long way across the tank.
    expect(nearLeft.x).toBeLessThan(0.02);
    expect(nearRight.x).toBeGreaterThan(WIDTH - 0.02);
  });

  it('a rule turned down to nothing has no effect', () => {
    const tank = makeTank();
    tank.setFlock({ separation: 0, alignment: 0, cohesion: 0 });
    const a = at(tank, 0.8, 0.5);
    at(tank, 0.82, 0.5);
    run(tank, 1);
    expect(strayed(a)).toBe(0);
  });

  it('a school sharing one route spreads out around it instead of piling up', () => {
    const tank = makeTank();
    const school = Array.from({ length: 8 }, () => {
      const fish = tank.addFish('circle');
      tank.setBehaviour(fish.id, { schools: true });
      return fish;
    });
    run(tank, 5);
    const route = MODELS.circle.position(school[0]!.params, tank.t, WIDTH);
    for (const [i, a] of school.entries()) {
      // Together: every fish within a few lengths of the shared route.
      expect(Math.hypot(a.x - route.x, a.y - route.y)).toBeLessThan(0.15);
      // Apart: no two fish closer than half a fish length.
      for (const b of school.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(0.02);
    }
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
      tank.setBehaviour(fish.id, { curiosity: (i % 5) / 2 - 1, pathStrength: 0.1 + (i % 4) * 0.3, drift: (i % 3) / 2, schools: i % 2 === 0 });
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
