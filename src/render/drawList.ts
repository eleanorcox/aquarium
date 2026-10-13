// Works out which fish need drawing, so a renderer can skip the ones off screen.
import type { Fish } from '../core/tank';
import type { View } from './view';

/** How far a drawn fish reaches from its position, as a multiple of its size: the tail and the selection ring. */
const DRAWN_REACH = 2.2;

/** The fish at least partly on screen, in their original order. */
export function fishInView(fish: Fish[], view: View): Fish[] {
  return fish.filter((f) => view.sees(f, f.size * DRAWN_REACH));
}
