import { describe, expect, it } from 'vitest';
import { MAX_PICTURE_LENGTH, parseVisitorFish, type VisitorFish } from './visitorFish';

const good: VisitorFish = { version: 1, name: 'Bubbles', outline: 'round', hues: [20, 200], pattern: 'stripes', temperament: 0.5 };
const picture = `data:image/png;base64,${'iVBORw0KGgo'.padEnd(400, 'A')}`;

describe('a fish sent from a phone', () => {
  it('is accepted when it is well made', () => {
    expect(parseVisitorFish(good)).toEqual(good);
  });

  it('is accepted coloured in, with its picture', () => {
    const coloured = { ...good, pattern: 'coloured', picture };
    expect(parseVisitorFish(coloured)).toEqual(coloured);
  });

  it('is refused with a reason when it is not a fish at all', () => {
    for (const nonsense of [null, 'fish', 42, [], { version: 2 }]) expect(typeof parseVisitorFish(nonsense)).toBe('string');
  });

  it('is refused for an outline, pattern or colour that does not exist', () => {
    expect(typeof parseVisitorFish({ ...good, outline: 'shark' })).toBe('string');
    expect(typeof parseVisitorFish({ ...good, pattern: 'tartan' })).toBe('string');
    expect(typeof parseVisitorFish({ ...good, hues: [20] })).toBe('string');
    expect(typeof parseVisitorFish({ ...good, hues: [20, 'red'] })).toBe('string');
    expect(typeof parseVisitorFish({ ...good, temperament: Number.NaN })).toBe('string');
  });

  it('brings colours and temperament into range instead of refusing', () => {
    expect(parseVisitorFish({ ...good, hues: [400.4, -30], temperament: 3 })).toMatchObject({ hues: [40, 330], temperament: 1 });
  });

  it('tidies the name, and refuses one that is empty or too long', () => {
    expect(parseVisitorFish({ ...good, name: '  Fin\u0000ley\n ' })).toMatchObject({ name: 'Finley' });
    expect(typeof parseVisitorFish({ ...good, name: '   ' })).toBe('string');
    expect(typeof parseVisitorFish({ ...good, name: 'x'.repeat(25) })).toBe('string');
    expect(typeof parseVisitorFish({ ...good, name: 7 })).toBe('string');
  });

  it('needs a picture when coloured in, and only then', () => {
    expect(typeof parseVisitorFish({ ...good, pattern: 'coloured' })).toBe('string');
    expect(parseVisitorFish({ ...good, picture })).toEqual(good);
  });

  it('refuses a picture that is not a small PNG', () => {
    const coloured = { ...good, pattern: 'coloured' };
    expect(typeof parseVisitorFish({ ...coloured, picture: 'data:image/svg+xml;base64,PHN2Zz4=' })).toBe('string');
    expect(typeof parseVisitorFish({ ...coloured, picture: 'data:image/png;base64,<script>' })).toBe('string');
    expect(typeof parseVisitorFish({ ...coloured, picture: `data:image/png;base64,${'A'.repeat(MAX_PICTURE_LENGTH)}` })).toBe('string');
  });

  it('drops anything extra it was sent', () => {
    expect(parseVisitorFish({ ...good, admin: true })).toEqual(good);
  });
});
