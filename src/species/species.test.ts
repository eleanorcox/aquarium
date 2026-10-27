import { describe, expect, it } from 'vitest';
import { loadTank, saveTank } from '../core/save';
import { makeTank, run } from '../core/testing';
import { BIOMES, SPECIES, parseSpecies } from './catalogue';
import { addMadeUpFish, addSpecies, groupCount, sizeFor } from './stock';

const sardine = SPECIES['pacific-sardine']!;
const pike = SPECIES['northern-pike']!;
const tuna = SPECIES['yellowfin-tuna']!;

describe('the species catalogue', () => {
  it('loads every species file in the project, each passing its checks', () => {
    expect(Object.keys(SPECIES).sort()).toEqual(
      ['european-eel', 'european-perch', 'moorish-idol', 'northern-pike', 'pacific-sardine', 'yellowfin-tuna'],
    );
    for (const species of Object.values(SPECIES)) {
      expect(species.lengthCm.typical, species.id).toBeGreaterThan(0);
      expect(species.sources.length, species.id).toBeGreaterThan(0);
    }
  });

  it('knows the biomes the species come from', () => {
    expect(BIOMES).toEqual(['British freshwater', 'Pacific saltwater']);
  });

  it('refuses a species file with missing or impossible facts, saying why', () => {
    expect(typeof parseSpecies('x', { commonName: 'Fish' })).toBe('string');
    expect(typeof parseSpecies('x', { ...JSON.parse(JSON.stringify(sardine)), lengthCm: { typical: -3 } })).toBe('string');
    expect(typeof parseSpecies('x', { ...JSON.parse(JSON.stringify(sardine)), swimmingStyle: 'hopping' })).toBe('string');
  });
});

describe('fish from species', () => {
  it('a fish takes its size, swimming style and temperament from its species', () => {
    const tank = makeTank();
    const [id] = addSpecies(tank, pike) as number[];
    const fish = tank.get(id!);
    expect(fish.species).toBe('northern-pike');
    expect(fish.swimStyle).toBe('subcarangiform');
    expect(fish.size).toBe(sizeFor(pike));
    expect(fish.curiosity).toBe(pike.temperament);
  });

  it('a fish can still be given other settings after it is added', () => {
    const tank = makeTank();
    const [id] = addSpecies(tank, pike) as number[];
    tank.setBehaviour(id!, { curiosity: 1 });
    expect(tank.get(id!).curiosity).toBe(1);
  });

  it('keeps the order of real sizes but squeezes the range, so a sardine is not a speck beside a tuna', () => {
    expect(sizeFor(tuna)).toBeGreaterThan(sizeFor(pike));
    expect(sizeFor(pike)).toBeGreaterThan(sizeFor(sardine));
    const real = tuna.lengthCm.typical / sardine.lengthCm.typical;
    expect(sizeFor(tuna) / sizeFor(sardine)).toBeLessThan(real / 2);
  });

  it('a schooling species arrives as a school within its usual numbers; a loner arrives alone', () => {
    const tank = makeTank();
    const school = addSpecies(tank, sardine) as number[];
    expect(school.length).toBe(groupCount(sardine));
    expect(school.length).toBeGreaterThan(10);
    expect(school.every((id) => tank.get(id).schools)).toBe(true);
    expect(addSpecies(tank, pike)).toHaveLength(1);
    expect(tank.get((addSpecies(tank, pike) as number[])[0]!).schools).toBe(false);
  });

  it('large fish arrive in smaller groups, so a tank of tuna is not a wall of tuna', () => {
    expect(groupCount(tuna)).toBeLessThanOrEqual(6);
    expect(groupCount(tuna)).toBeGreaterThan(1);
  });

  it('a species colours its fish as its file says', () => {
    const tank = makeTank();
    const [id] = addSpecies(tank, pike) as number[];
    expect(tank.get(id!).hue).toBe(pike.hue);
    expect(new Set(Object.values(SPECIES).map((s) => s.hue)).size).toBe(Object.keys(SPECIES).length);
  });

  it('each species schools with its own kind only', () => {
    const tank = makeTank();
    const sardines = addSpecies(tank, sardine) as number[];
    const tunas = addSpecies(tank, tuna) as number[];
    const school = (id: number) => tank.get(id).school;
    expect(new Set(sardines.map(school)).size).toBe(1);
    expect(school(sardines[0]!)).not.toBe(school(tunas[0]!));
  });

  it('a school swims together and stays in the tank', () => {
    const tank = makeTank();
    addSpecies(tank, sardine);
    run(tank, 10);
    for (const fish of tank.fish) {
      expect(fish.y).toBeGreaterThanOrEqual(0);
      expect(fish.y).toBeLessThanOrEqual(1);
    }
  });
});

describe('tank rules', () => {
  it('with a biome chosen, a species from elsewhere is refused with a reason; with no biome, it is accepted', () => {
    const tank = makeTank();
    tank.setRules({ kind: 'real', biome: 'British freshwater' });
    const refused = addSpecies(tank, sardine);
    expect(typeof refused).toBe('string');
    expect(refused).toMatch(/British freshwater/);
    expect(Array.isArray(addSpecies(tank, pike))).toBe(true);
    tank.setRules({ kind: 'real', biome: null });
    expect(Array.isArray(addSpecies(tank, sardine))).toBe(true);
  });

  it('a real tank refuses a made-up fish; a made-up tank accepts anything', () => {
    const tank = makeTank();
    tank.setRules({ kind: 'real', biome: null });
    expect(typeof addMadeUpFish(tank, 'heart')).toBe('string');
    tank.setRules({ kind: 'made-up', biome: 'British freshwater' });
    expect(typeof addMadeUpFish(tank, 'heart')).toBe('number');
    expect(Array.isArray(addSpecies(tank, sardine))).toBe(true);
  });

  it('species, swimming styles and rules survive saving and loading', () => {
    const tank = makeTank();
    tank.setRules({ kind: 'real', biome: 'Pacific saltwater' });
    addSpecies(tank, tuna);
    const loaded = loadTank(JSON.parse(JSON.stringify(saveTank(tank))));
    if (typeof loaded === 'string') throw new Error(loaded);
    expect(loaded.rules).toEqual(tank.rules);
    expect(loaded.fish.map((f) => [f.species, f.swimStyle])).toEqual(tank.fish.map((f) => [f.species, f.swimStyle]));
  });
});
