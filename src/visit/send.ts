// What the phone page says to the visitor service, and how it understands the answer.
import { parseVisitorFish, type VisitorFish } from '../visitors/visitorFish';

export type SendResult = { status: 'swimming' } | { status: 'waiting' } | { status: 'refused'; reason: string } | { status: 'failed' };

const NO_ROOM = "This tank isn't taking fish at the moment.";
const TOO_OFTEN = 'Slow down! Try again in a minute.';

/** The reason a 4xx gave, or a friendly one of our own where it gave none. */
function reasonFor(status: number, body: unknown): string {
  const error = typeof body === 'object' && body !== null ? (body as { error?: unknown }).error : undefined;
  if (typeof error === 'string' && error !== '') return error;
  if (status === 404) return NO_ROOM;
  if (status === 429) return TOO_OFTEN;
  return 'The tank would not take that fish.';
}

export async function sendFish(service: string, room: string, fish: VisitorFish, fetchFn: typeof fetch = fetch): Promise<SendResult> {
  // Checked here too, so an obviously bad fish never leaves the phone.
  const checked = parseVisitorFish(fish);
  if (typeof checked === 'string') return { status: 'refused', reason: checked };

  let response: Response;
  try {
    response = await fetchFn(`${service}/rooms/${encodeURIComponent(room)}/fish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(checked),
    });
  } catch {
    return { status: 'failed' };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }

  if (response.status >= 400 && response.status < 500) return { status: 'refused', reason: reasonFor(response.status, body) };
  if (response.status !== 200) return { status: 'failed' };
  const status = typeof body === 'object' && body !== null ? (body as { status?: unknown }).status : undefined;
  return status === 'swimming' || status === 'waiting' ? { status } : { status: 'failed' };
}
