import { describe, expect, it } from 'vitest';
import { rememberCameras, rememberedCameras, sceneAddress } from './remembered';

/** A stand-in for the browser's storage. */
function storage(): Pick<Storage, 'getItem' | 'setItem'> {
  const kept = new Map<string, string>();
  return { getItem: (key) => kept.get(key) ?? null, setItem: (key, value) => void kept.set(key, value) };
}

describe('remembered camera switches', () => {
  it('are both off when nothing has been remembered', () => {
    expect(rememberedCameras(storage())).toEqual({ hands: false, motion: false });
  });

  it('come back as they were left, so changing scene keeps the webcam on', () => {
    const kept = storage();
    rememberCameras(kept, { hands: true, motion: false });
    expect(rememberedCameras(kept)).toEqual({ hands: true, motion: false });
  });

  it('are off if what was kept is damaged, or storage is refused', () => {
    const kept = storage();
    kept.setItem('equatium.cameras', '{not json');
    expect(rememberedCameras(kept)).toEqual({ hands: false, motion: false });
    const refusing = { getItem: () => { throw new Error('refused'); }, setItem: () => { throw new Error('refused'); } };
    expect(rememberedCameras(refusing)).toEqual({ hands: false, motion: false });
    expect(() => rememberCameras(refusing, { hands: true, motion: true })).not.toThrow();
  });
});

describe('the address for another scene', () => {
  it('keeps the look and other settings, and drops a saved tank', () => {
    expect(sceneAddress('?scene=mixed&visuals=natural&watch&tank=abc', 'free')).toBe('?scene=free&visuals=natural&watch=');
  });
});
