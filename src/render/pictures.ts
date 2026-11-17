// Pictures of visitor fish, kept outside the tank because the simulation never needs them. A coloured-in
// fish's picture arrives with it; a fish made from choices has its picture painted here when first drawn.
import { PICTURE, paintChoices } from '../visitors/outlines';
import { OUTLINES, PATTERNS, type Outline, type Pattern } from '../visitors/visitorFish';
import type { DrawnFish } from './drawn';

export class PictureStore {
  private images = new Map<string, HTMLImageElement>();
  private painted = new Map<string, HTMLCanvasElement>();

  /** Keeps a coloured-in picture, given as a PNG data address, under its id. */
  add(id: string, dataUrl: string): void {
    if (typeof Image === 'undefined' || this.images.has(id)) return;
    const image = new Image();
    image.src = dataUrl;
    this.images.set(id, image);
  }

  /** The coloured-in picture kept under this id, as the data address it arrived as, to pass on to a display window. */
  dataUrl(id: string): string | undefined {
    return this.images.get(id)?.src;
  }

  remove(id: string): void {
    this.images.delete(id);
  }

  /** The picture to draw a visitor fish with, or nothing if it is not a visitor fish or its picture is not ready. */
  forFish(fish: DrawnFish): CanvasImageSource | undefined {
    if (fish.picture !== undefined) {
      const image = this.images.get(fish.picture);
      return image?.complete && image.naturalWidth > 0 ? image : undefined;
    }
    if (!OUTLINES.includes(fish.outline as Outline) || !PATTERNS.includes(fish.pattern as Pattern) || fish.pattern === 'coloured') return undefined;
    if (typeof document === 'undefined') return undefined;
    const key = `${fish.outline} ${fish.pattern} ${fish.hue} ${fish.secondHue}`;
    let canvas = this.painted.get(key);
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = PICTURE.width;
      canvas.height = PICTURE.height;
      paintChoices(canvas.getContext('2d')!, {
        outline: fish.outline as Outline,
        hues: [fish.hue, fish.secondHue ?? fish.hue],
        pattern: fish.pattern as Exclude<Pattern, 'coloured'>,
      });
      this.painted.set(key, canvas);
    }
    return canvas;
  }
}

/** Every window keeps one store, which its visual modes draw from. */
export const PICTURES = new PictureStore();
