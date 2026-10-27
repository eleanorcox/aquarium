// Natural swimming: how a fish's body bends as it swims, using the travelling body wave from studies of
// real fish. This is drawing only: it changes how a fish looks, never where it is.
// The values are first guesses from memory, to be checked against docs/research/fish-motion.md.

/** How a style of swimmer bends. Lengths are in body lengths; `s` runs from 0 at the head to 1 at the tail. */
export interface SwimStyle {
  name: string;
  /** Sideways swing at the very tip of the tail. */
  tailAmplitude: number;
  /** Fraction of the tail's swing already present at the head. */
  head: number;
  /** How sharply the swing grows towards the tail: 1 is steady growth, higher keeps the front still. */
  power: number;
  /** Length of one full wave along the body. */
  wavelength: number;
  /** Half the body's greatest depth, for drawing. */
  depth: number;
}

/** Named after the swimming styles biologists use, from the whole body bending to only the tail. */
export const STYLES = {
  anguilliform: { name: 'Eel-like', tailAmplitude: 0.1, head: 0.35, power: 1, wavelength: 0.65, depth: 0.045 },
  subcarangiform: { name: 'Trout-like', tailAmplitude: 0.1, head: 0.12, power: 1.5, wavelength: 0.9, depth: 0.11 },
  carangiform: { name: 'Mackerel-like', tailAmplitude: 0.1, head: 0.05, power: 2.2, wavelength: 1, depth: 0.1 },
  thunniform: { name: 'Tuna-like', tailAmplitude: 0.1, head: 0, power: 4, wavelength: 1.3, depth: 0.13 },
} satisfies Record<string, SwimStyle>;

export type SwimStyleId = keyof typeof STYLES;

/** A comfortable cruising speed, in body lengths a second. */
export const CRUISE_SPEED = 1;
/** Tail beats a second for a fish holding still: fish keep a gentle movement going even when not travelling. */
const IDLE_FREQUENCY = 0.8;
/** Efficient swimmers keep tail-beat frequency × tail sweep ÷ speed (the Strouhal number) near this. */
const STROUHAL = 0.3;

/** How far the body swings sideways at `s` along it, at the widest point of the wave. */
export function envelope(style: SwimStyle, s: number): number {
  return style.tailAmplitude * (style.head + (1 - style.head) * s ** style.power);
}

/** The sideways offset of the body at `s` along it. `phase` advances with time, carrying the wave towards the tail. */
export function bodyWave(style: SwimStyle, s: number, phase: number): number {
  return envelope(style, s) * Math.sin((2 * Math.PI * s) / style.wavelength - phase);
}

/** Tail beats a second for a fish moving at `speed` body lengths a second. */
export function tailBeatFrequency(speed: number): number {
  // The tail sweeps twice its amplitude from side to side.
  return IDLE_FREQUENCY + (STROUHAL * speed) / (2 * STYLES.carangiform.tailAmplitude);
}

/** How much of its full swing a fish uses at `speed`: a little when still, all of it from cruising speed up. */
export function amplitudeScale(speed: number): number {
  return 0.25 + 0.75 * Math.min(1, speed / CRUISE_SPEED);
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Where each fish is in its tail beat. The phase is added to a little each frame instead of being worked
 * out from the time, so a fish that speeds up beats faster from where it was, without a jump.
 */
export class SwimPhases {
  private phases = new Map<number, number>();

  /** Moves a fish's phase on by `dt` seconds at `frequency` beats a second, and returns it. */
  advance(id: number, frequency: number, dt: number): number {
    // Each fish starts at a different point in its beat, so a school does not beat in step.
    const phase = (this.phases.get(id) ?? id * GOLDEN_ANGLE) + 2 * Math.PI * frequency * dt;
    this.phases.set(id, phase);
    return phase;
  }

  /** Forgets fish that are no longer in the tank. */
  keepOnly(ids: Set<number>): void {
    for (const id of this.phases.keys()) if (!ids.has(id)) this.phases.delete(id);
  }

  get size(): number {
    return this.phases.size;
  }
}
