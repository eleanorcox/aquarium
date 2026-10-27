// Natural swimming: how a fish's body bends as it swims, using the travelling body wave from studies of
// real fish. This is drawing only: it changes how a fish looks, never where it is.
// Values and sources are in docs/research/fish-motion.md; values marked unsourced there are marked here too.

/** How a style of swimmer bends. Lengths are in body lengths; `s` runs from 0 at the nose to 1 at the tail. */
export interface SwimStyle {
  name: string;
  /**
   * The sideways swing either way at `s` along the body is a0 + a1·s + a2·s² + a4·s⁴. Measured fish swing
   * about 0.1 at the tail and a little at the head, with the least movement about a quarter of the way back.
   */
  envelope: [a0: number, a1: number, a2: number, a4: number];
  /** Length of one full wave along the body. */
  wavelength: number;
  /** Half the body's greatest depth, for drawing. */
  depth: number;
}

/** Named after the swimming styles biologists use, from the whole body bending to only the tail. */
export const STYLES = {
  // Tytell and Lauder's eel envelope; Di Santo et al.'s median eel-like wavelength.
  anguilliform: { name: 'Eel-like', envelope: [0.037, 0.032, 0.031, 0], wavelength: 0.75, depth: 0.045 },
  // Unsourced envelope, halfway between eel and mackerel; Di Santo et al.'s median wavelength.
  subcarangiform: { name: 'Trout-like', envelope: [0.028, -0.024, 0.096, 0], wavelength: 0.93, depth: 0.11 },
  // The mackerel envelope Seo et al. take from Videler and Hess, and its wavelength.
  carangiform: { name: 'Mackerel-like', envelope: [0.02, -0.08, 0.16, 0], wavelength: 1, depth: 0.1 },
  // Unsourced envelope, nearly still until the tail; Di Santo et al.'s median wavelength.
  thunniform: { name: 'Tuna-like', envelope: [0.01, 0, 0, 0.09], wavelength: 1.14, depth: 0.13 },
} satisfies Record<string, SwimStyle>;

export type SwimStyleId = keyof typeof STYLES;

/** The tail's swing either way, in body lengths, used to relate tail beat to speed. */
const TAIL_SWING = 0.1;

/** A comfortable cruising speed, in body lengths a second. */
export const CRUISE_SPEED = 1;
/** Tail beats a second for a fish holding still: fish keep a gentle movement going even when not travelling. */
const IDLE_FREQUENCY = 0.8;
/** Tail-beat frequency × tail sweep ÷ speed. The median across 44 species is 0.29 (Di Santo et al. 2021). */
const STROUHAL = 0.3;

/** How far the body swings sideways at `s` along it, at the widest point of the wave. */
export function envelope(style: SwimStyle, s: number): number {
  const [a0, a1, a2, a4] = style.envelope;
  return a0 + a1 * s + a2 * s * s + a4 * s ** 4;
}

/** The sideways offset of the body at `s` along it. `phase` advances with time, carrying the wave towards the tail. */
export function bodyWave(style: SwimStyle, s: number, phase: number): number {
  return envelope(style, s) * Math.sin((2 * Math.PI * s) / style.wavelength - phase);
}

/**
 * Tail beats a second for a fish moving at `speed` body lengths a second. Holds the Strouhal number near
 * its measured median, the tail sweeping twice its swing; at 3 body lengths a second this matches
 * Bainbridge's measured line. Below about 2.75 that line is not valid, and the gentle beat of a fish
 * holding still is a choice, not a measurement.
 */
export function tailBeatFrequency(speed: number): number {
  return IDLE_FREQUENCY + (STROUHAL * speed) / (2 * TAIL_SWING);
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
