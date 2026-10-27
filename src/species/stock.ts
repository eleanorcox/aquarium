// Stocking a tank with real species: each species arrives as a lone fish or a school, sized, coloured and
// behaving from its facts, on a route in its usual depth band. Tank rules decide what may be added.
import type { BuiltinId } from '../core/motion';
import type { Tank } from '../core/tank';
import type { Species, SwimmingStyle } from './catalogue';

/** A school never arrives bigger than this, so a tank stays quick to draw. */
const LARGEST_SCHOOL = 40;
/** Sizes are squeezed: a fish four times as long is drawn twice the size. A 20 cm fish is this size. */
const SIZE_OF_20_CM = 0.02;
/** Cruising speeds in tank units a second by swimming style. A game choice: no sourced values by style were found. */
const CRUISE: Record<SwimmingStyle, number> = {
  anguilliform: 0.04,
  subcarangiform: 0.06,
  carangiform: 0.08,
  thunniform: 0.12,
  ostraciiform: 0.02,
  labriform: 0.03,
  rajiform: 0.05,
};
/** Which band of the tank, top to bottom, each depth keeps to. */
const BANDS = { surface: [0.1, 0.3], midwater: [0.3, 0.7], bottom: [0.75, 0.9] } as const;

/** How big a fish of this species is drawn: the order of real lengths is kept, the range squeezed. */
export function sizeFor(species: Species): number {
  return SIZE_OF_20_CM * Math.sqrt(species.lengthCm.typical / 20);
}

/**
 * How many arrive together: about the middle of the species' usual numbers, but never more than fill the
 * space of the largest school of small fish, so big fish come in small groups.
 */
export function groupCount(species: Species): number {
  if (!species.groupSize) return 1;
  const usual = Math.round(Math.sqrt(species.groupSize.min * species.groupSize.max));
  const room = Math.round(LARGEST_SCHOOL / (sizeFor(species) / SIZE_OF_20_CM) ** 2);
  return Math.max(1, Math.min(usual, room));
}

/** Why this species may not be added to this tank, or null if it may. */
export function refusal(tank: Tank, species: Species): string | null {
  // A made-up tank takes anything; only a real-fish tank keeps to its biome.
  const { kind, biome } = tank.rules;
  if (kind === 'real' && biome && !species.regions.includes(biome)) return `The ${species.commonName} does not live in ${biome}. Choose no biome to mix places.`;
  return null;
}

/** A repeatable number from 0 up to 1, so the same tank stocked the same way looks the same. */
const spread = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Adds a species as a lone fish or a school. Returns the new fish's ids, or the reason it was refused. */
export function addSpecies(tank: Tank, species: Species): number[] | string {
  const reason = refusal(tank, species);
  if (reason) return reason;
  const count = groupCount(species);
  const school = count > 1;
  const arrival = tank.fish.length;
  const [top, bottom] = BANDS[species.depth];
  const centre = top + (bottom - top) * spread(arrival, 1);
  const direction = arrival % 2 === 0 ? 1 : -1;
  const start = spread(arrival, 2);
  const ids: number[] = [];
  for (let k = 0; k < count; k++) {
    const fish = tank.addFish('sine', {
      A: 0.02 + 0.02 * spread(arrival + k, 3),
      w: 0.6 + 0.4 * spread(arrival + k, 4),
      phi: 6.28 * spread(arrival + k, 5),
      v: direction * CRUISE[species.swimmingStyle] * (0.9 + 0.2 * spread(arrival + k, 6)),
      // A school starts as a loose cluster around one point, so it does not burst apart.
      y0: Math.min(bottom, Math.max(top, centre + (school ? 0.12 * (spread(arrival + k, 7) - 0.5) : 0))),
      x0: (start + (school ? 0.1 * spread(arrival + k, 8) : 0)) % 1,
    });
    tank.setFishSize(fish.id, sizeFor(species));
    tank.setLook(fish.id, { name: school ? `${species.commonName} ${k + 1}` : species.commonName, hue: species.hue });
    tank.setSpecies(fish.id, species.id, species.swimmingStyle);
    tank.setBehaviour(fish.id, { curiosity: species.temperament, schools: school, drift: 0.4, pathStrength: school ? 0.3 : 0.5 });
    ids.push(fish.id);
  }
  return ids;
}

/** Adds a fish that is not a real species, on a built-in path. A real-fish tank refuses it, saying why. */
export function addMadeUpFish(tank: Tank, model: BuiltinId): number | string {
  if (tank.rules.kind === 'real') return 'This is a real-fish tank, which only takes real species. Switch it to made-up to add any fish.';
  return tank.addFish(model).id;
}
