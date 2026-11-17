import { describe, expect, it } from 'vitest';
import { seededRandom } from '../src/core/random';
import { MAX_BODY_LENGTH, SendLimit, admitFish, isRoomCode, newRoomCode } from './room';

const fish = { version: 1, name: 'Bubbles', outline: 'round', hues: [20, 200], pattern: 'spots', temperament: 0 };
const coloured = { ...fish, pattern: 'coloured', picture: 'data:image/png;base64,AAAA' };
const send = (body: unknown, options: { tank?: boolean; limit?: SendLimit; sender?: string; now?: number } = {}) =>
  admitFish(typeof body === 'string' ? body : JSON.stringify(body), options.tank ?? true, options.limit ?? new SendLimit(), options.sender ?? 'phone-1', options.now ?? 0);

describe('room codes', () => {
  it('are six letters and digits that cannot be mistaken for each other', () => {
    const random = seededRandom(1);
    for (let i = 0; i < 50; i++) {
      const code = newRoomCode(random);
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
      expect(isRoomCode(code)).toBe(true);
    }
  });

  it('are refused if they are anything else', () => {
    for (const code of ['ABC', 'ABCDEFG', 'abcdef', 'ABCDE0', 'ABCDE/', '../../x']) expect(isRoomCode(code)).toBe(false);
  });
});

describe('a fish sent to a room', () => {
  it('is passed to the tank, and the phone told it is swimming in', () => {
    expect(send(fish)).toEqual({ status: 200, body: { status: 'swimming' }, deliver: { type: 'fish', fish } });
  });

  it('is passed to the tank to wait for approval when it is coloured in, and the phone told so', () => {
    const admitted = send(coloured);
    expect(admitted.body).toEqual({ status: 'waiting' });
    expect(admitted.deliver).toEqual({ type: 'fish', fish: coloured });
  });

  it('is turned away when no tank is listening, so it is not lost', () => {
    const admitted = send(fish, { tank: false });
    expect(admitted.status).toBe(404);
    expect(admitted.deliver).toBeUndefined();
  });

  it('is turned away with the reason when it is not a proper fish', () => {
    expect(send({ ...fish, outline: 'shark' })).toMatchObject({ status: 400, body: { error: 'That kind of fish does not exist.' } });
    expect(send('{not json')).toMatchObject({ status: 400 });
  });

  it('is turned away when far too big to be a fish', () => {
    expect(send('x'.repeat(MAX_BODY_LENGTH + 1))).toMatchObject({ status: 413 });
  });

  it('is turned away when one phone sends too many too quickly, and accepted again a minute later', () => {
    const limit = new SendLimit(3);
    for (let i = 0; i < 3; i++) expect(send(fish, { limit, now: i * 1000 }).status).toBe(200);
    expect(send(fish, { limit, now: 5000 }).status).toBe(429);
    expect(send(fish, { limit, sender: 'phone-2', now: 5000 }).status).toBe(200);
    expect(send(fish, { limit, now: 61_000 }).status).toBe(200);
  });

  it('counts tries that were turned away for being broken, so spamming rubbish is limited too', () => {
    const limit = new SendLimit(2);
    send('rubbish', { limit });
    send('rubbish', { limit });
    expect(send(fish, { limit }).status).toBe(429);
  });
});

describe('the sending limit', () => {
  it('forgets phones that have gone quiet, so it does not grow for ever', () => {
    const limit = new SendLimit(3);
    for (let i = 0; i < 100; i++) limit.allow(`phone-${i}`, 0);
    limit.allow('late', 120_000);
    expect(limit.size).toBe(1);
  });
});
