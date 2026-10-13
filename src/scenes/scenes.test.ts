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

  it('every scene is the same tank every time', () => {
    for (const id of Object.keys(SCENES)) {
      const after = () => {
        const tank = built(id);
        run(tank, 3);
        return tank.fish.map((fish) => [fish.x, fish.y, fish.size]);
      };
      expect(after(), id).toEqual(after());
    }
  });

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
    // Twenty seconds of every scene, including the one with 500 fish, takes a few seconds to run.
  }, 30_000);

  it('starts schools already spread out, not bursting from one point', () => {
    for (const id of ['mixed', 'school', 'shoal']) {
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
