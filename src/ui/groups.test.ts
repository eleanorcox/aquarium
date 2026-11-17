import { describe, expect, it } from 'vitest';
import { makeTank } from '../core/testing';
import { colourName, fishGroups } from './groups';

describe('groups of fish to change at once', () => {
  it('always offers every fish', () => {
    const tank = makeTank();
    tank.addFish('sine');
    tank.addFish('circle');
    expect(fishGroups(tank, [])[0]).toEqual({ name: 'All fish (2)', ids: [0, 1] });
  });

  it('offers the fish just added, if they are still there', () => {
    const tank = makeTank();
    for (let i = 0; i < 4; i++) tank.addFish('sine');
    tank.removeFish(3);
    expect(fishGroups(tank, [2, 3]).find((g) => g.name.startsWith('Just added'))).toEqual({ name: 'Just added (1)', ids: [2] });
    expect(fishGroups(tank, [3]).some((g) => g.name.startsWith('Just added'))).toBe(false);
  });

  it('offers each school, named by its species or else its colour, numbered if two share a name', () => {
    const tank = makeTank();
    const school = (hue: number, count: number, species?: string) => {
      const ids = Array.from({ length: count }, () => tank.addFish('sine').id);
      for (const id of ids) {
        tank.setLook(id, { hue });
        tank.joinSchool(id, ids[0]!);
        if (species) tank.setSpecies(id, species, 'carangiform');
      }
      return ids;
    };
    const blue = school(210, 3);
    const blueToo = school(215, 2);
    const sardines = school(20, 4, 'pacific-sardine');
    const names = fishGroups(tank, [], { 'pacific-sardine': 'Pacific sardine' }).map((g) => g.name);
    expect(names).toContain('Blue school (3)');
    expect(names).toContain('Blue school 2 (2)');
    expect(names).toContain('Pacific sardine school (4)');
    expect(fishGroups(tank, []).find((g) => g.name === 'Blue school (3)')!.ids).toEqual(blue);
    expect(blueToo.length + sardines.length).toBe(6);
  });

  it('offers formations and free-swimming fish', () => {
    const tank = makeTank();
    tank.addFish('free');
    tank.addFish('free');
    const leader = tank.addFish('circle');
    tank.makeFormation(leader.id, 5);
    const names = fishGroups(tank, []).map((g) => g.name);
    expect(names).toContain(`Formation of ${leader.name} (5)`);
    expect(names).toContain('Free-swimming fish (2)');
  });

  it('does not offer a group that is the same as every fish', () => {
    const tank = makeTank();
    tank.addFish('free');
    tank.addFish('free');
    expect(fishGroups(tank, [0, 1]).map((g) => g.name)).toEqual(['All fish (2)']);
  });
});

describe('colour names', () => {
  it('names hues in plain words', () => {
    expect(colourName(0)).toBe('Red');
    expect(colourName(30)).toBe('Orange');
    expect(colourName(55)).toBe('Yellow');
    expect(colourName(110)).toBe('Green');
    expect(colourName(175)).toBe('Teal');
    expect(colourName(210)).toBe('Blue');
    expect(colourName(265)).toBe('Purple');
    expect(colourName(315)).toBe('Pink');
    expect(colourName(355)).toBe('Red');
  });
});
