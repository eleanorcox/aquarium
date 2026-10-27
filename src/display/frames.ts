// Messages between the operator window, which runs the tank, and the display window on the projector,
// which only draws it. Both are on the same machine, talking over a BroadcastChannel.
import type { Influence } from '../core/steering';
import type { DrawnFish, DrawnTank } from '../render/drawn';

export const CHANNEL = 'equatium-display';
/** Numbers per fish in a frame: id, x, y, heading, speed, size, hue. */
const PER_FISH = 7;

/** One frame of the tank, from the operator window to the display window. */
export interface FrameMessage {
  type: 'frame';
  width: number;
  t: number;
  fish: Float64Array;
  influences: Influence[];
  visual: string;
  fill: boolean;
  selected: number;
  trails: boolean;
}

/** From the display window: it has opened, which part of the tank it shows, or where someone is touching it. */
export type DisplayMessage =
  | { type: 'hello' }
  | { type: 'shown'; area: { x: number; y: number; width: number; height: number } }
  | { type: 'pointer'; influence: Influence | null };

export function packFrame(tank: DrawnTank, details: Pick<FrameMessage, 'visual' | 'fill' | 'selected' | 'trails'>): FrameMessage {
  const fish = new Float64Array(tank.fish.length * PER_FISH);
  tank.fish.forEach((f, i) => fish.set([f.id, f.x, f.y, f.heading, f.speed, f.size, f.hue], i * PER_FISH));
  return { type: 'frame', width: tank.width, t: tank.t, fish, influences: tank.influences, ...details };
}

/** The tank in a frame, as the display window draws it. Trails are not sent, so there are none. */
export function unpackFrame(frame: FrameMessage): DrawnTank {
  const fish: DrawnFish[] = [];
  for (let i = 0; i < frame.fish.length; i += PER_FISH) {
    const [id, x, y, heading, speed, size, hue] = frame.fish.subarray(i, i + PER_FISH);
    fish.push({ id: id!, x: x!, y: y!, heading: heading!, speed: speed!, size: size!, hue: hue!, trail: [] });
  }
  return { width: frame.width, height: 1, t: frame.t, fish, influences: frame.influences };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isFrameMessage(data: unknown): data is FrameMessage {
  return isObject(data) && data.type === 'frame' && data.fish instanceof Float64Array && Array.isArray(data.influences);
}

export function isDisplayMessage(data: unknown): data is DisplayMessage {
  if (!isObject(data)) return false;
  if (data.type === 'hello') return true;
  if (data.type === 'shown') return isObject(data.area);
  if (data.type === 'pointer') return 'influence' in data;
  return false;
}
