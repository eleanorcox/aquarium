// Works out which fish need drawing, so a renderer can skip the ones off screen.
import type { DrawnFish } from './drawn';
import type { View } from './view';

/** How far a Classic fish reaches from its position, as a multiple of its size: the tail and the selection ring. */
const DRAWN_REACH = 2.2;

/** The fish at least partly on screen, in their original order. `reach` is how far a drawn fish extends, in fish sizes. */
export function fishInView(fish: DrawnFish[], view: View, reach = DRAWN_REACH): DrawnFish[] {
  return fish.filter((f) => view.sees(f, f.size * reach));
}
