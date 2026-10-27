// What a visual mode is: everything about how the tank looks, swappable without touching the simulation.
import type { Influence } from '../../core/steering';
import type { Fish } from '../../core/tank';

/** One frame's drawing surface. Positions are in pixels from the tank's top left corner. */
export interface Frame {
  ctx: CanvasRenderingContext2D;
  /** Pixels per tank unit. */
  scale: number;
  /** The whole tank's size in pixels, most of which may be off screen. */
  width: number;
  height: number;
  /** Simulation time, in seconds. */
  t: number;
  /** Real seconds since the last frame, for animation that is only for show. */
  dt: number;
}

export interface Visual {
  readonly id: string;
  /** The colour around the tank, where the screen is a different shape from it. */
  readonly margin: string;
  /** How far a drawn fish extends from its position, in fish sizes, so fish just off screen are still drawn. */
  readonly reach: number;
  /** Called once a frame with every fish, before anything is drawn. */
  begin?(frame: Frame, fish: Fish[]): void;
  water(frame: Frame): void;
  trail(frame: Frame, fish: Fish, selected: boolean): void;
  fish(frame: Frame, fish: Fish, selected: boolean): void;
  influence(frame: Frame, influence: Influence): void;
}
