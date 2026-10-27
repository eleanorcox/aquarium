// The species catalogue: every species file in assets/fish, checked and ready to use. Adding a species
// means adding a file there (and later a picture), with no code changes.

export const SWIMMING_STYLES = ['anguilliform', 'subcarangiform', 'carangiform', 'thunniform', 'ostraciiform', 'labriform', 'rajiform'] as const;
export type SwimmingStyle = (typeof SWIMMING_STYLES)[number];
const DEPTHS = ['surface', 'midwater', 'bottom'] as const;

export interface Species {
  /** The file name without .json, used to refer to the species. */
  id: string;
  commonName: string;
  scientificName: string;
  lengthCm: { typical: number; max?: number };
  regions: string[];
  depth: (typeof DEPTHS)[number];
  swimmingStyle: SwimmingStyle;
  /** How many usually swim together. Absent means no source said, and the species is treated as a loner. */
  groupSize?: { min: number; max: number };
  /** From -1 shy to 1 curious: a judgement for the game, explained in the file. */
  temperament: number;
  /** The colour fish of this species are drawn, as a hue from 0 to 360. Chosen by eye, not sourced. */
  hue: number;
  sources: string[];
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** A species from the data in its file, or the reason it cannot be used. */
export function parseSpecies(id: string, data: unknown): Species | string {
  if (!isObject(data)) return `${id}: not a species file.`;
  const { commonName, scientificName, lengthCm, regions, depth, swimmingStyle, groupSize, temperament, hue, sources } = data;
  if (typeof commonName !== 'string' || typeof scientificName !== 'string') return `${id}: names are missing.`;
  if (!isObject(lengthCm) || !isNumber(lengthCm.typical) || lengthCm.typical <= 0) return `${id}: no sensible typical length.`;
  if (!Array.isArray(regions) || !regions.every((r) => typeof r === 'string')) return `${id}: regions are missing.`;
  if (!DEPTHS.includes(depth as never)) return `${id}: depth must be one of ${DEPTHS.join(', ')}.`;
  if (!SWIMMING_STYLES.includes(swimmingStyle as never)) return `${id}: swimming style must be one of ${SWIMMING_STYLES.join(', ')}.`;
  if (!Array.isArray(sources) || sources.length === 0) return `${id}: every species needs at least one source.`;
  const group = isObject(groupSize) && isNumber(groupSize.min) && isNumber(groupSize.max) ? { min: groupSize.min, max: groupSize.max } : undefined;
  return {
    id,
    commonName,
    scientificName,
    lengthCm: { typical: lengthCm.typical, ...(isNumber(lengthCm.max) ? { max: lengthCm.max } : {}) },
    regions: regions as string[],
    depth: depth as Species['depth'],
    swimmingStyle: swimmingStyle as SwimmingStyle,
    ...(group ? { groupSize: group } : {}),
    temperament: isNumber(temperament) ? Math.max(-1, Math.min(1, temperament)) : 0,
    // Without a colour of its own, a species gets one from its name, the same every time.
    hue: isNumber(hue) ? ((hue % 360) + 360) % 360 : [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7),
    sources: sources as string[],
  };
}

const files = import.meta.glob<unknown>('../../assets/fish/*.json', { eager: true, import: 'default' });

export const SPECIES: Record<string, Species> = {};
for (const [path, data] of Object.entries(files)) {
  const id = path.split('/').pop()!.replace(/\.json$/, '');
  const species = parseSpecies(id, data);
  if (typeof species === 'string') console.warn(`Species file skipped. ${species}`);
  else SPECIES[id] = species;
}

/** Every place the species come from, for choosing a tank's biome. */
export const BIOMES = [...new Set(Object.values(SPECIES).flatMap((s) => s.regions))].sort();
