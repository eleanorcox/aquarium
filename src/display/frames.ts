// Messages between the operator window, which runs the tank, and the display window on the projector,
// which only draws it. Both are on the same machine, talking over a BroadcastChannel.
import type { Influence } from '../core/steering';
import type { Fish } from '../core/tank';
import type { DrawnFish, DrawnTank } from '../render/drawn';
import { SWIMMING_STYLES } from '../species/catalogue';

export const CHANNEL = 'equatium-display';
/** Numbers per fish in a frame: id, x, y, heading, speed, size, hue, and swimming style as its place in the list, or -1. */
const PER_FISH = 8;

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
  /** The phone page's address for the QR code in the corner, when visitors are being taken. */
  invite?: string;
}

/** What a visitor fish looks like beyond what each frame carries. Sent when visitor fish come or go. */
export type VisitorLook = { id: number } & Pick<DrawnFish, 'outline' | 'secondHue' | 'pattern' | 'picture' | 'swimStyle'>;

export interface LooksMessage {
  type: 'looks';
  looks: VisitorLook[];
}

/** A visitor's coloured-in picture, sent once, since it is far too big to send every frame. */
export interface PictureMessage {
  type: 'picture';
  id: string;
  dataUrl: string;
}

/** From the display window: it has opened, which part of the tank it shows, or where someone is touching it. */
export type DisplayMessage =
  | { type: 'hello' }
  | { type: 'shown'; area: { x: number; y: number; width: number; height: number } }
  | { type: 'pointer'; influence: Influence | null };

export function packFrame(tank: DrawnTank, details: Pick<FrameMessage, 'visual' | 'fill' | 'selected' | 'trails' | 'invite'>): FrameMessage {
  const fish = new Float64Array(tank.fish.length * PER_FISH);
  tank.fish.forEach((f, i) => fish.set([f.id, f.x, f.y, f.heading, f.speed, f.size, f.hue, SWIMMING_STYLES.indexOf(f.swimStyle as never)], i * PER_FISH));
  return { type: 'frame', width: tank.width, t: tank.t, fish, influences: tank.influences, ...details };
}

export function packLooks(tank: { fish: Fish[] }): LooksMessage {
  const looks = tank.fish
    .filter((f) => f.outline !== undefined)
    .map((f) => {
      const look: VisitorLook = { id: f.id };
      for (const key of ['outline', 'secondHue', 'pattern', 'picture', 'swimStyle'] as const) if (f[key] !== undefined) Object.assign(look, { [key]: f[key] });
      return look;
    });
  return { type: 'looks', looks };
}

/** Looks by fish id, for unpacking frames. */
export function lookMap(message: LooksMessage): Map<number, VisitorLook> {
  return new Map(message.looks.map((look) => [look.id, look]));
}

/** The tank in a frame, as the display window draws it. Trails are not sent, so there are none. */
export function unpackFrame(frame: FrameMessage, looks: Map<number, VisitorLook> = new Map()): DrawnTank {
  const fish: DrawnFish[] = [];
  for (let i = 0; i < frame.fish.length; i += PER_FISH) {
    const [id, x, y, heading, speed, size, hue, style] = frame.fish.subarray(i, i + PER_FISH);
    const swimStyle = SWIMMING_STYLES[style!];
    const { id: _, ...look } = looks.get(id!) ?? { id: id! };
    fish.push({ id: id!, x: x!, y: y!, heading: heading!, speed: speed!, size: size!, hue: hue!, trail: [], ...(swimStyle ? { swimStyle } : {}), ...look });
  }
  return { width: frame.width, height: 1, t: frame.t, fish, influences: frame.influences };
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isFrameMessage(data: unknown): data is FrameMessage {
  return isObject(data) && data.type === 'frame' && data.fish instanceof Float64Array && Array.isArray(data.influences);
}

export function isLooksMessage(data: unknown): data is LooksMessage {
  return isObject(data) && data.type === 'looks' && Array.isArray(data.looks) && data.looks.every((look) => isObject(look) && typeof look.id === 'number');
}

export function isPictureMessage(data: unknown): data is PictureMessage {
  return isObject(data) && data.type === 'picture' && typeof data.id === 'string' && typeof data.dataUrl === 'string' && data.dataUrl.startsWith('data:image/png;base64,');
}

export function isDisplayMessage(data: unknown): data is DisplayMessage {
  if (!isObject(data)) return false;
  if (data.type === 'hello') return true;
  if (data.type === 'shown') return isObject(data.area);
  if (data.type === 'pointer') return 'influence' in data;
  return false;
}
