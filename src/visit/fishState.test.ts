import { describe, expect, it } from 'vitest';
import { parseVisitorFish } from '../visitors/visitorFish';
import type { Stroke } from './colouring';
import { canSend, newChoices, toFish } from './fishState';

const stroke = (hue: number): Stroke => ({ hue, size: 10, points: [{ x: 0, y: 0 }, { x: 50, y: 0 }] });
const picture = `data:image/png;base64,${'iVBORw0KGgo'.padEnd(400, 'A')}`;

describe('the fish a visitor is making', () => {
  it('starts with a look already chosen, so a fish is always showing, but no name', () => {
    const c = newChoices();
    expect(c.name).toBe('');
    expect(canSend(c)).toBe(false);
  });

  it('can be sent from choices once it has a name', () => {
    const c = { ...newChoices(), name: 'Bubbles', outline: 'tall' as const, hues: [30, 210] as [number, number], pattern: 'spots' as const, temperament: -0.5 };
    expect(canSend(c)).toBe(true);
    const fish = toFish(c);
    expect(fish).toEqual({ version: 1, name: 'Bubbles', outline: 'tall', hues: [30, 210], pattern: 'spots', temperament: -0.5 });
    expect(typeof parseVisitorFish(fish)).toBe('object');
  });

  it('cannot be sent with a name of only spaces', () => {
    expect(canSend({ ...newChoices(), name: '   ' })).toBe(false);
  });

  it('cannot be sent coloured in until something has been coloured', () => {
    const c = { ...newChoices(), name: 'Bubbles', mode: 'colour' as const };
    expect(canSend(c)).toBe(false);
    expect(canSend({ ...c, strokes: [stroke(10)] })).toBe(true);
  });

  it('uses its picture and most used colours when coloured in, not the chosen colours and pattern', () => {
    const c = { ...newChoices(), name: 'Bubbles', mode: 'colour' as const, pattern: 'stripes' as const, strokes: [stroke(10), stroke(200), stroke(200)] };
    expect(toFish(c, picture)).toEqual({ version: 1, name: 'Bubbles', outline: c.outline, hues: [200, 10], pattern: 'coloured', temperament: c.temperament, picture });
  });

  it('trims the name', () => {
    expect(toFish({ ...newChoices(), name: '  Pip ' }).name).toBe('Pip');
  });
});
