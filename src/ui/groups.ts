// Groups of fish the panel can change all at once: every fish, the ones just added, each school, each
// formation, and the free swimmers. Worked out afresh whenever the Fish list is refreshed.
import type { Fish, Tank } from '../core/tank';

export interface FishGroup {
  /** What the Fish list shows, with how many fish are in it. */
  name: string;
  ids: number[];
}

/** Where each named colour starts, going round the colour wheel. */
const COLOURS: [number, string][] = [
  [0, 'Red'],
  [18, 'Orange'],
  [45, 'Yellow'],
  [70, 'Green'],
  [160, 'Teal'],
  [190, 'Blue'],
  [245, 'Purple'],
  [290, 'Pink'],
  [345, 'Red'],
];

/** A hue as a colour word, for naming schools. */
export function colourName(hue: number): string {
  const h = ((hue % 360) + 360) % 360;
  let name = 'Red';
  for (const [start, word] of COLOURS) if (h >= start) name = word;
  return name;
}

/** Collects fish into groups by a key, keeping the order fish were added. Fish with no key are left out. */
function collect(fish: Fish[], key: (f: Fish) => number | undefined): Fish[][] {
  const groups = new Map<number, Fish[]>();
  for (const f of fish) {
    const k = key(f);
    if (k !== undefined) groups.set(k, [...(groups.get(k) ?? []), f]);
  }
  return [...groups.values()];
}

/**
 * The groups to offer, every fish first. `justAdded` is the ids of the fish last added; `speciesNames` turns
 * a species id into its common name. A group of one fish, or one that is just every fish again, is left out.
 */
export function fishGroups(tank: Tank, justAdded: number[], speciesNames: Record<string, string> = {}): FishGroup[] {
  const all = tank.fish;
  const groups: FishGroup[] = [{ name: `All fish (${all.length})`, ids: all.map((f) => f.id) }];
  const offer = (name: string, members: Fish[]) => {
    if (members.length < 2 && name !== 'Just added') return;
    if (members.length === 0 || members.length === all.length) return;
    groups.push({ name: `${name} (${members.length})`, ids: members.map((f) => f.id) });
  };
  const present = new Set(justAdded);
  offer('Just added', all.filter((f) => present.has(f.id)));

  const used = new Map<string, number>();
  for (const school of collect(all.filter((f) => f.schools || f.school !== undefined), (f) => f.school)) {
    const first = school[0]!;
    const base = first.species ? `${speciesNames[first.species] ?? first.species} school` : `${colourName(first.hue)} school`;
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    offer(count === 1 ? base : `${base} ${count}`, school);
  }
  for (const formation of collect(all, (f) => f.formation)) offer(`Formation of ${tank.get(formation[0]!.formation!).name}`, formation);
  offer('Free-swimming fish', all.filter((f) => f.model === 'free'));
  return groups;
}
