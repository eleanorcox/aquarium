import { describe, expect, it } from 'vitest';
import { Tank } from '../../core/tank';
import { run } from '../../core/testing';
import { SCENES, buildScene } from '../../scenes/scenes';
import { paintTank } from '../paint';
import { View } from '../view';
import { DEFAULT_VISUAL, VISUALS, createVisual } from './index';

/**
 * A stand-in for a canvas's drawing context. It accepts any drawing call and records an error for any
 * number passed that is not a real number, which is how a bent fish with broken geometry shows up.
 */
function fakeContext(problems: string[]) {
  const gradient = { addColorStop: () => {} };
  const settings: Record<string, unknown> = {};
  return new Proxy(settings, {
    get(target, name: string) {
      if (name in target) return target[name];
      return (...args: unknown[]) => {
        for (const arg of args) if (typeof arg === 'number' && !Number.isFinite(arg)) problems.push(`${name}(${args.join(', ')})`);
        return name.startsWith('create') ? gradient : undefined;
      };
    },
    set(target, name: string, value) {
      if (typeof value === 'number' && !Number.isFinite(value)) problems.push(`${name} = ${value}`);
      target[name] = value;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe('visual modes', () => {
  it('every visual mode has a name and says what it is for', () => {
    for (const [id, visual] of Object.entries(VISUALS)) {
      expect(visual.name, id).not.toBe('');
      expect(visual.description, id).not.toBe('');
    }
  });

  it('Classic is the default, and a name that is not known gives the default', () => {
    expect(DEFAULT_VISUAL).toBe('classic');
    expect(createVisual('no-such-look').id).toBe('classic');
    expect(createVisual(null).id).toBe('classic');
    expect(createVisual('natural').id).toBe('natural');
  });

  it('every visual mode draws every scene, with trails and a pointer, without a broken number', () => {
    for (const visualId of Object.keys(VISUALS)) {
      for (const sceneId of Object.keys(SCENES)) {
        const tank = new Tank();
        buildScene(tank, sceneId);
        tank.setInfluences([{ x: 0.8, y: 0.5, vx: 0, vy: 0, radius: 0.2 }]);
        const view = new View(tank, { width: 800, height: 450 }, tank.typicalFishSize());
        const visual = createVisual(visualId);
        const problems: string[] = [];
        const ctx = fakeContext(problems);
        for (let frame = 0; frame < 3; frame++) {
          run(tank, 0.1);
          paintTank(ctx, { width: 800, height: 450 }, tank, view, { selected: tank.fish[0]!.id, trails: true }, visual, 1 / 60);
        }
        expect(problems.slice(0, 3), `${visualId} in ${sceneId}`).toEqual([]);
      }
    }
  }, 30_000);
});
