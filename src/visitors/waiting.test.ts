import { describe, expect, it } from 'vitest';
import { WaitingFish } from './waiting';
import type { VisitorFish } from './visitorFish';

const coloured = (name: string): VisitorFish => ({ version: 1, name, outline: 'tall', hues: [0, 200], pattern: 'coloured', temperament: 0, picture: 'data:image/png;base64,AAAA' });

describe('coloured-in fish waiting to be let in', () => {
  it('wait in the order they arrived', () => {
    const waiting = new WaitingFish();
    waiting.add(coloured('A'));
    waiting.add(coloured('B'));
    expect(waiting.list().map((w) => w.fish.name)).toEqual(['A', 'B']);
  });

  it('leave the queue when let in, handing over the fish', () => {
    const waiting = new WaitingFish();
    const id = waiting.add(coloured('A'));
    expect(waiting.letIn(id)?.name).toBe('A');
    expect(waiting.list()).toEqual([]);
    expect(waiting.letIn(id)).toBeUndefined();
  });

  it('leave the queue when turned away, and are not let in', () => {
    const waiting = new WaitingFish();
    const id = waiting.add(coloured('A'));
    waiting.turnAway(id);
    expect(waiting.list()).toEqual([]);
  });

  it('are kept to a limit, the oldest turned away first, so a flood cannot fill memory', () => {
    const waiting = new WaitingFish(3);
    for (const name of ['A', 'B', 'C', 'D']) waiting.add(coloured(name));
    expect(waiting.list().map((w) => w.fish.name)).toEqual(['B', 'C', 'D']);
  });
});
