// Saving a tank as plain data, and loading it again. A saved tank can arrive from anyone in a shared link,
// so loading checks everything and refuses what it cannot trust, saying why.
import { MODEL_NAMES, type EquationSource, type ModelId, type Params } from './motion';
import type { FlockRules } from './steering';
import { Tank, type TankRules } from './tank';

export const SAVE_VERSION = 1;
/** More fish than this in a saved tank is refused: it would be too slow to be anything but a mistake or an attack. */
export const MAX_SAVED_FISH = 2000;
const WIDTH_RANGE = [0.5, 20] as const;
const MAX_NAME = 40;

export interface SavedFish {
  name: string;
  hue: number;
  size: number;
  model: ModelId;
  params: Params;
  equations?: EquationSource;
  pathStrength: number;
  curiosity: number;
  drift: number;
  schools: boolean;
  /** Where in the list of fish its formation's first member is, if it is in one. */
  formation?: number;
  species?: string;
  swimStyle?: string;
}

/** A tank's setup: its size, its fish and their settings, and the time, so routes carry on from where they were. */
export interface SavedTank {
  version: number;
  width: number;
  t: number;
  flock: FlockRules;
  rules?: TankRules;
  fish: SavedFish[];
}

export function saveTank(tank: Tank): SavedTank {
  return {
    version: SAVE_VERSION,
    width: tank.width,
    t: tank.t,
    flock: { ...tank.flock },
    rules: { ...tank.rules },
    fish: tank.fish.map((f) => ({
      name: f.name,
      hue: f.hue,
      size: f.size,
      model: f.model,
      params: { ...f.params },
      ...(f.equations ? { equations: { ...f.equations } } : {}),
      pathStrength: f.pathStrength,
      curiosity: f.curiosity,
      drift: f.drift,
      schools: f.schools,
      ...(f.species && f.swimStyle ? { species: f.species, swimStyle: f.swimStyle } : {}),
      ...(f.formation !== undefined ? { formation: tank.fish.findIndex((g) => g.formation === f.formation) } : {}),
    })),
  };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Builds a tank from saved data, or returns the reason it cannot. */
export function loadTank(data: unknown): Tank | string {
  if (!isObject(data)) return 'This is not a saved tank.';
  if (data.version !== SAVE_VERSION) return `This tank was saved in a format this version does not know (${String(data.version)}).`;
  const { width, t, flock, fish } = data;
  if (!isNumber(width) || width < WIDTH_RANGE[0] || width > WIDTH_RANGE[1]) return 'The tank is an impossible size.';
  if (!isNumber(t) || t < 0) return 'The tank has an impossible time.';
  if (!Array.isArray(fish)) return 'The tank has no list of fish.';
  if (fish.length === 0) return 'The tank has no fish.';
  if (fish.length > MAX_SAVED_FISH) return `The tank has more than ${MAX_SAVED_FISH} fish.`;

  const tank = new Tank(width);
  tank.t = t;
  if (isObject(flock)) {
    for (const rule of ['separation', 'alignment', 'cohesion'] as const) {
      const value = flock[rule];
      if (isNumber(value)) tank.setFlock({ [rule]: Math.min(2, Math.max(0, value)) });
    }
  }
  const { rules } = data;
  if (isObject(rules) && (rules.kind === 'real' || rules.kind === 'made-up')) {
    const biome = typeof rules.biome === 'string' && rules.biome.length <= MAX_NAME ? rules.biome : null;
    tank.setRules({ kind: rules.kind, biome });
  }
  for (const [i, saved] of fish.entries()) {
    const problem = addSavedFish(tank, saved);
    if (problem) return `Fish ${i + 1}: ${problem}`;
  }
  // Formations are saved as the place of their first member in the list, since ids change on loading.
  fish.forEach((saved, i) => {
    const first = isObject(saved) ? saved.formation : undefined;
    if (isNumber(first) && Number.isInteger(first) && first >= 0 && first < fish.length) tank.joinFormation(tank.fish[i]!.id, tank.fish[first]!.id);
  });
  return tank;
}

function addSavedFish(tank: Tank, saved: unknown): string | null {
  if (!isObject(saved)) return 'not a fish.';
  const { model, params, equations, name, hue, size } = saved;
  if (typeof model !== 'string' || !Object.hasOwn(MODEL_NAMES, model)) return 'its path is not one this version knows.';
  if (!isObject(params) || !Object.values(params).every(isNumber)) return 'its path settings are not all numbers.';
  if (typeof name !== 'string' || name.length > MAX_NAME) return 'its name is missing or too long.';
  if (!isNumber(hue) || !isNumber(size) || size <= 0 || size > 0.5) return 'its colour or size is not a sensible number.';

  const fish = tank.addFish(model as ModelId, params as Params);
  if (model === 'custom') {
    if (!isObject(equations) || typeof equations.x !== 'string' || typeof equations.y !== 'string') return 'its equations are missing.';
    const error = tank.setEquations(fish.id, { x: equations.x, y: equations.y });
    if (error) return `its equations do not work: ${error}`;
  }
  tank.setLook(fish.id, { name, hue });
  const { species, swimStyle } = saved;
  if (typeof species === 'string' && typeof swimStyle === 'string' && species.length <= MAX_NAME && swimStyle.length <= MAX_NAME) {
    tank.setSpecies(fish.id, species, swimStyle);
  }
  tank.setFishSize(fish.id, size);
  // Settings out of range are brought back into range by the tank, so an extreme value is not a reason to refuse.
  const behaviour: Record<string, number | boolean> = {};
  for (const key of ['pathStrength', 'curiosity', 'drift'] as const) if (isNumber(saved[key])) behaviour[key] = saved[key];
  if (typeof saved.schools === 'boolean') behaviour.schools = saved.schools;
  tank.setBehaviour(fish.id, behaviour);
  return null;
}

/** A saved tank as a short piece of text for a web address: compressed, then written with letters, digits, - and _. */
export async function encodeTank(saved: SavedTank): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(saved));
  const packed = new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  let binary = '';
  for (const byte of packed) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** The saved tank in a piece of address text, or null if the text is damaged. The result still needs loadTank. */
export async function decodeTank(text: string): Promise<unknown> {
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const packed = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const json = await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}
