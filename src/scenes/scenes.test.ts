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
  it('every scene has a name, says what to look for, and puts fish in the tank', () => {
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

  it('the colour schools scene has six groups, each one colour on its own route, apart until stirred', () => {
    const tank = built('colours');
    const groups = new Map<number, typeof tank.fish>();
    for (const fish of tank.fish) groups.set(fish.hue, [...(groups.get(fish.hue) ?? []), fish]);
    expect(groups.size).toBe(6);
    const routeOf = (fish: (typeof tank.fish)[number]) => JSON.stringify({ ...fish.params, x0: 0, model: fish.model });
    for (const members of groups.values()) expect(new Set(members.map(routeOf)).size).toBe(1);
    // One school across the colours, so groups pushed into each other mingle.
    expect(new Set(tank.fish.map((f) => f.school)).size).toBe(1);
    // Left alone, no fish comes within sight of another colour's fish: any mixing is the visitor's doing.
    run(tank, 20);
    const sight = 6 * 0.026;
    for (const [hue, members] of groups) {
      for (const fish of members) {
        for (const other of tank.fish) if (other.hue !== hue) expect(Math.hypot(fish.x - other.x, fish.y - other.y)).toBeGreaterThan(sight);
      }
    }
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
