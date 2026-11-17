// The rules of a room: one tank taking visitors' fish. Plain code with no Cloudflare in it, so it can be
// tested like the simulation; worker.ts connects it to the network.
import { parseVisitorFish, type VisitorFish } from '../src/visitors/visitorFish';

/** Letters and digits for room codes, leaving out ones easily mistaken for others: I and 1, O and 0. */
const CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
/** A fish with its picture is well under this; anything bigger is refused before it is read as a fish. */
export const MAX_BODY_LENGTH = 150_000;
const SEND_WINDOW_MS = 60_000;

/** What the service sends the tank. */
export type TankMessage = { type: 'fish'; fish: VisitorFish };

export interface Admission {
  status: number;
  body: { status: 'swimming' | 'waiting' } | { error: string };
  /** What to pass on to the tank, if anything. */
  deliver?: TankMessage;
}

export function newRoomCode(random: () => number): string {
  return Array.from({ length: CODE_LENGTH }, () => CODE_LETTERS[Math.floor(random() * CODE_LETTERS.length)]).join('');
}

export function isRoomCode(code: string): boolean {
  return code.length === CODE_LENGTH && [...code].every((c) => CODE_LETTERS.includes(c));
}

/** How many fish each phone may send a minute. Phones are told apart by their internet address. */
export class SendLimit {
  private sent = new Map<string, number[]>();

  constructor(private perMinute = 3) {}

  /** Whether this sender may send now, counting this try if so. */
  allow(sender: string, now: number): boolean {
    // Phones not heard from for a minute are forgotten, so a busy day does not fill memory.
    for (const [key, times] of this.sent) if (times.every((t) => now - t >= SEND_WINDOW_MS)) this.sent.delete(key);
    const recent = (this.sent.get(sender) ?? []).filter((t) => now - t < SEND_WINDOW_MS);
    if (recent.length >= this.perMinute) return false;
    this.sent.set(sender, [...recent, now]);
    return true;
  }

  /** How many senders it is keeping track of. */
  get size(): number {
    return this.sent.size;
  }
}

/** What happens to a fish a phone sends: passed to the tank, or turned away with a reason the phone can show. */
export function admitFish(raw: string, tankConnected: boolean, limit: SendLimit, sender: string, now: number): Admission {
  if (!tankConnected) return { status: 404, body: { error: "This tank isn't taking fish at the moment." } };
  if (raw.length > MAX_BODY_LENGTH) return { status: 413, body: { error: 'That fish is too big to send.' } };
  if (!limit.allow(sender, now)) return { status: 429, body: { error: 'Slow down! Try again in a minute.' } };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: 400, body: { error: 'That is not a fish this version knows.' } };
  }
  const fish = parseVisitorFish(data);
  if (typeof fish === 'string') return { status: 400, body: { error: fish } };
  return { status: 200, body: { status: fish.pattern === 'coloured' ? 'waiting' : 'swimming' }, deliver: { type: 'fish', fish } };
}
