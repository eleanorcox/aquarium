// Finding nearby fish without comparing every fish with every other. Fish are sorted into the squares
// of a grid, so a search only looks in the squares within reach.

/** Squares are numbered from this far below zero, so positions a little outside the tank still work. */
const OFFSET = 32768;

export class Grid {
  private squares = new Map<number, number[]>();

  /** `cell` is the side of one square. A good size is the furthest distance that will be searched. */
  constructor(private cell: number) {}

  insert(index: number, x: number, y: number): void {
    const key = this.key(Math.floor(x / this.cell), Math.floor(y / this.cell));
    const square = this.squares.get(key);
    if (square) square.push(index);
    else this.squares.set(key, [index]);
  }

  /**
   * Everything in the squares within `radius` of a point. This includes all points within the radius
   * and some a little beyond it, so the caller still checks each distance.
   */
  near(x: number, y: number, radius: number): number[] {
    const found: number[] = [];
    const [left, right] = [Math.floor((x - radius) / this.cell), Math.floor((x + radius) / this.cell)];
    const [top, bottom] = [Math.floor((y - radius) / this.cell), Math.floor((y + radius) / this.cell)];
    for (let cx = left; cx <= right; cx++) {
      for (let cy = top; cy <= bottom; cy++) {
        const square = this.squares.get(this.key(cx, cy));
        if (square) for (const index of square) found.push(index);
      }
    }
    return found;
  }

  private key(cx: number, cy: number): number {
    return (cx + OFFSET) * 2 * OFFSET + (cy + OFFSET);
  }
}
