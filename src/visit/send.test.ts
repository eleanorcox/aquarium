import { describe, expect, it, vi } from 'vitest';
import type { VisitorFish } from '../visitors/visitorFish';
import { sendFish } from './send';

const fish: VisitorFish = { version: 1, name: 'Bubbles', outline: 'round', hues: [20, 200], pattern: 'stripes', temperament: 0.5 };
const reply = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? 'not json' : JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('sending a fish', () => {
  it('posts the fish as JSON to the room, with the room code made safe for an address', async () => {
    const fetchFn = reply(200, { status: 'swimming' });
    await sendFish('http://tank.test:8787', 'AB 12/x', fish, fetchFn);
    const [url, init] = (fetchFn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe('http://tank.test:8787/rooms/AB%2012%2Fx/fish');
    expect(init.method).toBe('POST');
    expect(init.headers['content-type']).toBe('application/json');
    expect(JSON.parse(init.body)).toEqual(fish);
  });

  it('says swimming or waiting as the service does', async () => {
    expect(await sendFish('s', 'R', fish, reply(200, { status: 'swimming' }))).toEqual({ status: 'swimming' });
    expect(await sendFish('s', 'R', fish, reply(200, { status: 'waiting' }))).toEqual({ status: 'waiting' });
  });

  it('is refused with the reason the service gives for a 4xx', async () => {
    expect(await sendFish('s', 'R', fish, reply(400, { error: 'Too rude.' }))).toEqual({ status: 'refused', reason: 'Too rude.' });
  });

  it('has a friendly reason for a missing room and for sending too often', async () => {
    expect(await sendFish('s', 'R', fish, reply(404))).toEqual({ status: 'refused', reason: "This tank isn't taking fish at the moment." });
    expect(await sendFish('s', 'R', fish, reply(429, {}))).toEqual({ status: 'refused', reason: 'Slow down! Try again in a minute.' });
  });

  it('fails for a server error, a network error or an answer it cannot read', async () => {
    expect(await sendFish('s', 'R', fish, reply(500, { error: 'oops' }))).toEqual({ status: 'failed' });
    expect(await sendFish('s', 'R', fish, vi.fn(async () => Promise.reject(new TypeError('offline'))) as unknown as typeof fetch)).toEqual({ status: 'failed' });
    expect(await sendFish('s', 'R', fish, reply(200))).toEqual({ status: 'failed' });
    expect(await sendFish('s', 'R', fish, reply(200, { status: 'maybe' }))).toEqual({ status: 'failed' });
  });

  it('refuses a badly made fish itself, without calling the service', async () => {
    const fetchFn = reply(200, { status: 'swimming' });
    const result = await sendFish('s', 'R', { ...fish, name: '  ' }, fetchFn);
    expect(result.status).toBe('refused');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
