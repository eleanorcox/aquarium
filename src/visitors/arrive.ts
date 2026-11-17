// Visitor fish in the tank: how one arrives, and clearing them all away.
import type { Tank } from '../core/tank';
import type { VisitorFish } from './visitorFish';

/** How each outline swims: slim fish ripple more of their body, deep ones mostly their tails. */
const SWIM_STYLES = { slim: 'subcarangiform', round: 'carangiform', tall: 'carangiform' } as const;
/** A visitor's fish is drawn at least this big, so they can find it. */
const SMALLEST = 0.035;
/** How far in from the side a visitor's fish starts, as a fraction of the tank's width. */
const ENTRY = 0.04;

/**
 * Adds a visitor's fish, swimming in from one side at a height and side that vary from fish to fish.
 * `pictureId` names its coloured-in picture, which is kept outside the tank. Returns its id.
 */
export function addVisitorFish(tank: Tank, visitor: VisitorFish, pictureId?: string): number {
  const arrivals = tank.fish.filter((f) => f.visitor).length;
  const fromLeft = arrivals % 2 === 0;
  // Spread arrivals up and down the tank without randomness, so a saved run plays back the same.
  const height = 0.2 + 0.6 * ((arrivals * 0.618034) % 1);
  const fish = tank.addFish('free', { v: 0.1, y0: height, A: 0.4, x0: fromLeft ? ENTRY : 1 - ENTRY });
  tank.aim(fish.id, fromLeft ? 0 : Math.PI);
  tank.setLook(fish.id, {
    name: visitor.name,
    hue: visitor.hues[0],
    secondHue: visitor.hues[1],
    outline: visitor.outline,
    pattern: visitor.pattern,
    visitor: true,
    swimStyle: SWIM_STYLES[visitor.outline],
    ...(pictureId !== undefined ? { picture: pictureId } : {}),
  });
  tank.setFishSize(fish.id, Math.max(SMALLEST, tank.typicalFishSize()));
  tank.setBehaviour(fish.id, { curiosity: visitor.temperament, drift: 0.5 });
  return fish.id;
}

/** Removes every visitor fish, but leaves one if they are all the tank has, since a tank always keeps a fish. Returns how many went. */
export function clearVisitorFish(tank: Tank): number {
  const visitors = tank.fish.filter((f) => f.visitor);
  const going = visitors.length === tank.fish.length ? visitors.slice(1) : visitors;
  for (const fish of going) tank.removeFish(fish.id);
  return going.length;
}
