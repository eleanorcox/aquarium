// Pointer input: turns a mouse, pen or finger over the tank into an influence the fish react to.
// It knows nothing about the page. The caller passes positions in tank units and times in seconds.
import type { Influence } from '../core/steering';

/** Whether each fish reacts by its own temperament, or the pointer overrides them all. */
export type PointerMode = 'fish-decide' | 'attract' | 'scatter' | 'off';

/** A pointer that has not moved for this long counts as still. */
const STILL_AFTER = 0.1;

export class PointerInput {
  mode: PointerMode = 'fish-decide';
  /** How far the pointer's effect reaches, in tank units. */
  radius = 0.25;
  private at: { x: number; y: number; time: number } | null = null;
  private velocity = { x: 0, y: 0 };

  move(x: number, y: number, time: number): void {
    const elapsed = this.at ? time - this.at.time : 0;
    // The first position after arriving has nothing to measure a speed against.
    this.velocity = this.at && elapsed > 0 ? { x: (x - this.at.x) / elapsed, y: (y - this.at.y) / elapsed } : { x: 0, y: 0 };
    this.at = { x, y, time };
  }

  leave(): void {
    this.at = null;
  }

  influences(time: number): Influence[] {
    if (!this.at || this.mode === 'off') return [];
    const moving = time - this.at.time < STILL_AFTER;
    return [
      {
        x: this.at.x,
        y: this.at.y,
        vx: moving ? this.velocity.x : 0,
        vy: moving ? this.velocity.y : 0,
        radius: this.radius,
        kind: 'pointer',
        ...(this.mode === 'fish-decide' ? {} : { effect: this.mode }),
      },
    ];
  }
}
