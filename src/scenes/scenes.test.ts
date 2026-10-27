import { describe, expect, it } from 'vitest';
import { MODELS } from '../core/motion';
import { Tank } from '../core/tank';
import { run } from '../core/testing';
import { DEFAULT_SCENE, SCENES, buildScene } from './scenes';

const built = (id: string) => {
  const tank = new Tank();
  buildScene(tank, id);
  return tank;
};

describe('scenes', () => {
  it('every scene has a name, says what to look for, and puts fish in the tank', { timeout: 30_000 }, () => {
    for (const [id, scene] of Object.entries(SCENES)) {
      expect(scene.name, id).not.toBe('');
      expect(scene.lookFor, id).not.toBe('');
      expect(built(id).fish.length, id).toBeGreaterThan(0);
    }
  });

  it('the field of fish surrounds you: hundreds of fish, filling the screen', () => {
    expect(built('field').fish.length).toBeGreaterThanOrEqual(500);
    expect(SCENES.field!.fill).toBe(true);
  });

  it('the colour schools scene has loads of fish in many single-colour schools, apart until stirred', () => {
    const tank = built('colours');
    expect(tank.fish.length).toBeGreaterThanOrEqual(300);
    expect(tank.strays).toBe('join');
    const groups = new Map<number, typeof tank.fish>();
    for (const fish of tank.fish) groups.set(fish.hue, [...(groups.get(fish.hue) ?? []), fish]);
    expect(groups.size).toBeGreaterThanOrEqual(8);
    const routeOf = (fish: (typeof tank.fish)[number]) => JSON.stringify({ ...fish.params, x0: 0, model: fish.model });
    for (const members of groups.values()) expect(new Set(members.map(routeOf)).size).toBe(1);
    // Each colour starts as its own school; a fish pushed across joins the other school's route and schoolmates.
    expect(new Set(tank.fish.map((f) => f.school)).size).toBe(groups.size);
    // Left alone for a while, no fish changes school: any mixing is the visitor's doing.
    const before = tank.fish.map(routeOf);
    run(tank, 30);
    expect(tank.fish.map(routeOf)).toEqual(before);
  }, 60_000);

  it('stirring the colour schools with a hand sends fish to other schools, so colours mix', () => {
    const tank = built('colours');
    const homeOf = new Map(tank.fish.map((f) => [f.id, f.params.cx]));
    // A scattering hand sweeps slowly back and forth along the top row.
    for (let i = 0; i < 6 * 60; i++) {
      const x = tank.width * (0.1 + 0.8 * (0.5 - 0.5 * Math.cos((i / 360) * 2 * Math.PI)));
      tank.setInfluences([{ x, y: 0.27, vx: 0.3, vy: 0, radius: 0.25, kind: 'hand', shape: 'fist', effect: 'scatter' }]);
      tank.step(1 / 60);
    }
    tank.setInfluences([]);
    run(tank, 4);
    const moved = tank.fish.filter((f) => f.params.cx !== homeOf.get(f.id)).length;
    expect(moved).toBeGreaterThan(10);
    // Every school now holds fish of more than one colour, or most of them do.
    const coloursPerSchool = new Map<number, Set<number>>();
    for (const f of tank.fish) coloursPerSchool.set(f.params.cx! * 10 + f.params.cy!, (coloursPerSchool.get(f.params.cx! * 10 + f.params.cy!) ?? new Set()).add(f.hue));
    expect([...coloursPerSchool.values()].filter((c) => c.size > 1).length).toBeGreaterThanOrEqual(2);
  }, 30_000);

  it('every scene is the same tank every time', () => {
    for (const id of Object.keys(SCENES)) {
      const after = () => {
        const tank = built(id);
        run(tank, 3);
        return tank.fish.map((fish) => [fish.x, fish.y, fish.size]);
      };
      expect(after(), id).toEqual(after());
    }
  }, 60_000);

  it('keeps every fish in the tank in every scene', () => {
    for (const id of Object.keys(SCENES)) {
      const tank = built(id);
      for (let second = 0; second < 20; second++) {
        run(tank, 1);
        for (const fish of tank.fish) {
          expect(Number.isFinite(fish.x) && Number.isFinite(fish.y), id).toBe(true);
          expect(fish.x >= 0 && fish.x <= tank.width && fish.y >= 0 && fish.y <= 1, `${id}: ${fish.name}`).toBe(true);
        }
      }
    }
    // Twenty seconds of every scene, including the ones with hundreds of fish, takes a while to run.
  }, 120_000);

  it('starts schools already spread out, not bursting from one point', () => {
    for (const id of ['mixed', 'school', 'shoal', 'field']) {
      const schooling = built(id).fish.filter((fish) => fish.schools);
      for (const [i, a] of schooling.entries()) {
        // No two closer than half a fish size.
        for (const b of schooling.slice(i + 1)) expect(Math.hypot(a.x - b.x, a.y - b.y), id).toBeGreaterThan(a.size / 2);
      }
    }
  });

  it('falls back to the default scene for a name it does not know', () => {
    const tank = new Tank();
    expect(buildScene(tank, 'no-such-scene')).toBe(DEFAULT_SCENE);
    expect(buildScene(new Tank(), null)).toBe(DEFAULT_SCENE);
    expect(tank.fish.length).toBe(built(DEFAULT_SCENE).fish.length);
  });

  it('the paths scene has one undisturbed fish on each built-in path', () => {
    const tank = built('paths');
    expect(tank.fish.map((fish) => fish.model).sort()).toEqual(Object.keys(MODELS).sort());
    run(tank, 5);
    for (const fish of tank.fish) expect(Math.hypot(fish.offset.x, fish.offset.y)).toBe(0);
  });
});
