import { describe, expect, it } from 'vitest';
import { MAX_SAVED_FISH, decodeTank, encodeTank, loadTank, saveTank } from './save';
import { Tank } from './tank';
import { makeTank, run } from './testing';

/** A tank with something of everything: built-in and typed paths, every behaviour setting, a school. */
function variedTank(): Tank {
  const tank = makeTank({ width: 2.2 });
  tank.setBehaviour(tank.addFish('rose', { R: 0.2, k: 5 }).id, { curiosity: -0.4, pathStrength: 0.3 });
  const typed = tank.addFish('custom');
  tank.setEquations(typed.id, { x: 'cx + 0.3 * sin(a * t)', y: 'cy + 0.1 * cos(b * t)' });
  tank.setParam(typed.id, 'a', 1.5);
  for (let i = 0; i < 3; i++) tank.setBehaviour(tank.addFish('circle', { R: 0.2 }).id, { schools: true });
  tank.setFishSize(tank.fish[0]!.id, 0.02);
  tank.setFlock({ cohesion: 0.4 });
  return tank;
}

const where = (tank: Tank) => tank.fish.map((fish) => [fish.x, fish.y]);

describe('saving a tank', () => {
  it('a saved and loaded tank has the same fish, routes, settings and size', () => {
    const tank = variedTank();
    run(tank, 2);
    const loaded = loadTank(JSON.parse(JSON.stringify(saveTank(tank))));
    if (typeof loaded === 'string') throw new Error(loaded);
    expect(loaded.width).toBe(tank.width);
    expect(loaded.flock).toEqual(tank.flock);
    const describe = (t: Tank) =>
      t.fish.map((f) => [f.name, f.hue, f.size, f.model, f.params, f.equations, f.pathStrength, f.curiosity, f.drift, f.schools]);
    expect(describe(loaded)).toEqual(describe(tank));
  });

  it('a loaded tank carries on exactly where the saved one was, for fish nobody is pushing', () => {
    const tank = variedTank();
    run(tank, 2);
    const loaded = loadTank(saveTank(tank));
    if (typeof loaded === 'string') throw new Error(loaded);
    // Schooling fish have been pushing each other, so compare the ones that do not school.
    const loners = (t: Tank) => where(t).filter((_, i) => !t.fish[i]!.schools);
    run(tank, 3);
    run(loaded, 3);
    expect(loners(loaded)).toEqual(loners(tank));
  });

  it('keeps free-swimming fish free, with their cruising speed and depths', () => {
    const tank = makeTank();
    tank.addFish('free', { v: 0.2, y0: 0.3, A: 0.1 });
    const loaded = loadTank(saveTank(tank));
    if (typeof loaded === 'string') throw new Error(loaded);
    expect(loaded.fish[0]!.model).toBe('free');
    expect(loaded.fish[0]!.params).toMatchObject({ v: 0.2, y0: 0.3, A: 0.1 });
    run(loaded, 2);
    expect(loaded.fish[0]!.speed).toBeGreaterThan(0.1);
  });

  it('survives the trip through a web address', async () => {
    const tank = variedTank();
    const text = await encodeTank(saveTank(tank));
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(await decodeTank(text)).toEqual(JSON.parse(JSON.stringify(saveTank(tank))));
  });

  it('keeps a big tank short enough for a link', async () => {
    const tank = makeTank({ width: 3 });
    for (let i = 0; i < 500; i++) tank.setBehaviour(tank.addFish('lissajous').id, { schools: true, drift: 0.5 });
    expect((await encodeTank(saveTank(tank))).length).toBeLessThan(20_000);
  });
});

describe('loading a damaged or hostile tank', () => {
  const good = () => JSON.parse(JSON.stringify(saveTank(variedTank())));

  it('refuses things that are not a saved tank, with a reason', () => {
    for (const bad of [null, 42, 'tank', [], {}, { version: 99, width: 2, fish: [] }, { version: 1, width: 2, t: 0, fish: [] }]) {
      expect(typeof loadTank(bad)).toBe('string');
    }
  });

  it('refuses a fish with a path that does not exist, or broken numbers', () => {
    const unknownPath = good();
    unknownPath.fish[0].model = 'teleport';
    expect(typeof loadTank(unknownPath)).toBe('string');
    const brokenNumber = good();
    brokenNumber.fish[0].params.R = 'lots';
    expect(typeof loadTank(brokenNumber)).toBe('string');
  });

  it('refuses typed equations that do not work, or that try to reach outside the maths', () => {
    const typo = good();
    typo.fish[1].equations.x = 'cx + sin(';
    expect(typeof loadTank(typo)).toBe('string');
    const sneaky = good();
    sneaky.fish[1].equations.x = 'import({}, {})';
    expect(typeof loadTank(sneaky)).toBe('string');
  });

  it('refuses an absurd number of fish or an absurd tank size', () => {
    const crowded = good();
    crowded.fish = Array.from({ length: MAX_SAVED_FISH + 1 }, () => crowded.fish[0]);
    expect(typeof loadTank(crowded)).toBe('string');
    const huge = good();
    huge.width = 1e9;
    expect(typeof loadTank(huge)).toBe('string');
  });

  it('brings settings that are out of range back into range instead of refusing', () => {
    const extreme = good();
    extreme.fish[0].curiosity = 40;
    const loaded = loadTank(extreme);
    if (typeof loaded === 'string') throw new Error(loaded);
    expect(loaded.fish[0]!.curiosity).toBe(1);
  });

  it('a link that has been cut short or mangled is refused, not crashed on', async () => {
    const text = await encodeTank(saveTank(variedTank()));
    await expect(decodeTank(text.slice(0, text.length / 2))).resolves.toBeNull();
    await expect(decodeTank('!!!not a tank!!!')).resolves.toBeNull();
  });
});
