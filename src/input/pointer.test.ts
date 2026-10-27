import { describe, expect, it } from 'vitest';
import { PointerInput } from './pointer';

describe('PointerInput', () => {
  it('a pointer over the tank is one influence at its position', () => {
    const pointer = new PointerInput();
    pointer.move(0.4, 0.7, 0);
    expect(pointer.influences(0)).toMatchObject([{ x: 0.4, y: 0.7, radius: pointer.radius }]);
  });

  it('marks its influence as the pointer, so it can be drawn differently from a hand', () => {
    const pointer = new PointerInput();
    pointer.move(0.4, 0.7, 0);
    expect(pointer.influences(0)[0]!.kind).toBe('pointer');
  });

  it('a pointer that has not arrived, or has left, is no influence', () => {
    const pointer = new PointerInput();
    expect(pointer.influences(0)).toEqual([]);
    pointer.move(0.4, 0.7, 0);
    pointer.leave();
    expect(pointer.influences(0)).toEqual([]);
  });

  it('reports how fast the pointer is moving', () => {
    const pointer = new PointerInput();
    pointer.move(0.2, 0.5, 0);
    pointer.move(0.3, 0.5, 0.05);
    const [influence] = pointer.influences(0.05);
    expect(influence!.vx).toBeCloseTo(2);
    expect(influence!.vy).toBeCloseTo(0);
  });

  it('a pointer that has stopped is no longer moving', () => {
    const pointer = new PointerInput();
    pointer.move(0.2, 0.5, 0);
    pointer.move(0.3, 0.5, 0.05);
    const [influence] = pointer.influences(1);
    expect([influence!.vx, influence!.vy]).toEqual([0, 0]);
  });

  it('does not count arriving in the tank as a fast movement', () => {
    const pointer = new PointerInput();
    pointer.move(0.2, 0.5, 0);
    pointer.leave();
    pointer.move(1.4, 0.5, 0.01);
    expect(pointer.influences(0.01)[0]!.vx).toBe(0);
  });

  it('two moves at the same instant do not give an endless speed', () => {
    const pointer = new PointerInput();
    pointer.move(0.2, 0.5, 1);
    pointer.move(0.3, 0.5, 1);
    expect(Number.isFinite(pointer.influences(1)[0]!.vx)).toBe(true);
  });

  it('lets each fish decide by default, and can instead attract all, scatter all or be switched off', () => {
    const pointer = new PointerInput();
    pointer.move(0.4, 0.7, 0);
    expect(pointer.influences(0)[0]!.effect).toBeUndefined();
    pointer.mode = 'attract';
    expect(pointer.influences(0)[0]!.effect).toBe('attract');
    pointer.mode = 'scatter';
    expect(pointer.influences(0)[0]!.effect).toBe('scatter');
    pointer.mode = 'off';
    expect(pointer.influences(0)).toEqual([]);
  });
});
