// What drawing needs to know about a tank and its fish: nothing more, so a window that only draws can be
// handed these without a simulation of its own.
import type { Influence } from '../core/steering';
import type { Fish } from '../core/tank';

export type DrawnFish = Pick<Fish, 'id' | 'x' | 'y' | 'heading' | 'speed' | 'size' | 'hue' | 'trail' | 'swimStyle'>;

export interface DrawnTank {
  width: number;
  height: number;
  t: number;
  fish: DrawnFish[];
  influences: Influence[];
}
