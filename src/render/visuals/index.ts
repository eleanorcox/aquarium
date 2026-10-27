// Every visual mode, by the name used in the address (?visuals=name) and the panel.
import { Classic } from './classic';
import { Natural } from './natural';
import { Paper } from './paper';
import type { Visual } from './types';

export const VISUALS: Record<string, { name: string; description: string; create: () => Visual }> = {
  classic: { name: 'Classic', description: 'Glowing fish shapes with trails on dark water. The original look.', create: () => new Classic() },
  natural: {
    name: 'Natural',
    description: 'Fish that bend as they swim, eel-like to tuna-like, in sunlit water with drifting specks.',
    create: () => new Natural(),
  },
  paper: {
    name: 'Paper',
    description: 'Ink fish on squared paper, like a page of working. For screens: light colours wash out on a projector.',
    create: () => new Paper(),
  },
};

export const DEFAULT_VISUAL = 'classic';

/** A new visual mode by name, or Classic if the name is not known. */
export function createVisual(id: string | null): Visual {
  const known = id !== null && Object.hasOwn(VISUALS, id) ? id : DEFAULT_VISUAL;
  return VISUALS[known]!.create();
}
