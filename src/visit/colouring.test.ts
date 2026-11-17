import { describe, expect, it } from 'vitest';
import { StrokeBook, dominantHues, type Stroke } from './colouring';

const stroke = (hue: number, length: number, size = 10): Stroke => ({
  hue,
  size,
  points: [
    { x: 0, y: 0 },
    { x: length, y: 0 },
  ],
});

describe('the colours of a coloured-in fish', () => {
  it('are the most used and the second most used, by how much was painted', () => {
    expect(dominantHues([stroke(10, 20), stroke(200, 100), stroke(90, 50)])).toEqual([200, 90]);
  });

  it('count a thick brush for more than a thin one', () => {
    expect(dominantHues([stroke(10, 50, 4), stroke(200, 50, 20)])).toEqual([200, 10]);
  });

  it('count a single touch, which has one point', () => {
    expect(dominantHues([{ hue: 40, size: 12, points: [{ x: 5, y: 5 }] }])).toEqual([40, 40]);
  });

  it('are the same colour twice when only one was used, and from nothing painted', () => {
    expect(dominantHues([stroke(120, 30), stroke(120, 30)])).toEqual([120, 120]);
    expect(dominantHues([])).toEqual([0, 0]);
  });

  it('add strokes of one colour together, wherever they were', () => {
    expect(dominantHues([stroke(10, 30), stroke(200, 50), stroke(10, 30)])).toEqual([10, 200]);
  });
});

describe('the strokes of a coloured-in fish', () => {
  it('can be undone at least ten times, newest first', () => {
    const book = new StrokeBook();
    for (let i = 0; i < 12; i++) book.add(stroke(i, 10));
    for (let i = 0; i < 10; i++) book.undo();
    expect(book.strokes.map((s) => s.hue)).toEqual([0, 1]);
  });

  it('does nothing when undone with nothing painted', () => {
    const book = new StrokeBook();
    book.undo();
    expect(book.strokes).toEqual([]);
  });

  it('can be cleared', () => {
    const book = new StrokeBook();
    book.add(stroke(1, 10));
    book.clear();
    expect(book.strokes).toEqual([]);
  });

  it('is not changed from outside by the list it hands out', () => {
    const book = new StrokeBook();
    book.add(stroke(1, 10));
    (book.strokes as Stroke[]).pop();
    expect(book.strokes).toHaveLength(1);
  });
});
