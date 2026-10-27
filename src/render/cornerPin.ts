// Corner correction for a projector set up at an angle. The picture's four corners can be moved anywhere
// on screen and the whole picture is stretched to fit between them, keeping straight lines straight
// (a projective transform, or homography). No DOM here, only the arithmetic.
import type { Vec2 } from '../core/motion';
import type { Size } from './view';

/** Top left, top right, bottom right, bottom left. */
export type Corners = [Vec2, Vec2, Vec2, Vec2];
/** A 3 by 3 matrix, row by row. */
type Matrix = [number, number, number, number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export class CornerPin {
  private forward: Matrix = IDENTITY;
  private backward: Matrix = IDENTITY;
  private corners: Corners;

  constructor(private screen: Size) {
    this.corners = this.square();
  }

  get adjusted(): boolean {
    return this.forward !== IDENTITY;
  }

  /** Where each corner of the picture now sits. */
  get current(): Corners {
    return this.corners.map((c) => ({ ...c })) as Corners;
  }

  /** Moves the picture's corners. Refuses, and returns false, for a shape that would twist the picture. */
  setCorners(corners: Corners): boolean {
    if (!sameTurn(corners, this.square())) return false;
    this.corners = corners.map((c) => ({ ...c })) as Corners;
    this.forward = solve(this.square(), corners);
    this.backward = invert(this.forward);
    return true;
  }

  reset(): void {
    this.corners = this.square();
    this.forward = this.backward = IDENTITY;
  }

  /** Where a point of the picture appears on screen. */
  toScreen(point: Vec2): Vec2 {
    return apply(this.forward, point);
  }

  /** Which point of the picture is shown at a point on screen. Pointer positions go through this. */
  toPicture(point: Vec2): Vec2 {
    return apply(this.backward, point);
  }

  /** The same stretch as a CSS transform, for an element whose transform origin is its top left corner. */
  cssTransform(): string {
    const [a, b, c, d, e, f, g, h, i] = this.forward;
    return `matrix3d(${[a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, c, f, 0, i].join(', ')})`;
  }

  private square(): Corners {
    const { width: w, height: h } = this.screen;
    return [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  }
}

function apply(m: Matrix, { x, y }: Vec2): Vec2 {
  const w = m[6] * x + m[7] * y + m[8];
  return { x: (m[0] * x + m[1] * y + m[2]) / w, y: (m[3] * x + m[4] * y + m[5]) / w };
}

/** True when the shape goes round the same way as `reference` at every corner, so it is not twisted or folded. */
function sameTurn(shape: Corners, reference: Corners): boolean {
  const turn = (q: Corners, i: number) => {
    const [a, b, c] = [q[i]!, q[(i + 1) % 4]!, q[(i + 2) % 4]!];
    return (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
  };
  const way = Math.sign(turn(reference, 0));
  return [0, 1, 2, 3].every((i) => Math.sign(turn(shape, i)) === way);
}

/** The projective transform taking each `from` corner to the matching `to` corner. */
function solve(from: Corners, to: Corners): Matrix {
  // Eight unknowns, two equations per corner: u(gx + hy + 1) = ax + by + c, and the same for v.
  const rows: number[][] = [];
  from.forEach(({ x, y }, i) => {
    const { x: u, y: v } = to[i]!;
    rows.push([x, y, 1, 0, 0, 0, -x * u, -y * u, u]);
    rows.push([0, 0, 0, x, y, 1, -x * v, -y * v, v]);
  });
  // Gaussian elimination, choosing the largest remaining value at each step for accuracy.
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let r = col + 1; r < 8; r++) if (Math.abs(rows[r]![col]!) > Math.abs(rows[pivot]![col]!)) pivot = r;
    [rows[col], rows[pivot]] = [rows[pivot]!, rows[col]!];
    for (let r = 0; r < 8; r++) {
      if (r === col) continue;
      const factor = rows[r]![col]! / rows[col]![col]!;
      for (let k = col; k < 9; k++) rows[r]![k]! -= factor * rows[col]![k]!;
    }
  }
  const h = rows.map((row, i) => row[8]! / row[i]!);
  return [h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!, 1];
}

function invert(m: Matrix): Matrix {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
    B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
    C / det, -(a * h - b * g) / det, (a * e - b * d) / det,
  ];
}
