// Settings kept in this browser between page loads, such as when choosing a scene reloads the page.
type Kept = Pick<Storage, 'getItem' | 'setItem'>;

const CAMERAS_KEY = 'equatium.cameras';

export interface CameraSwitches {
  hands: boolean;
  motion: boolean;
}

/** Whether hands and movement were switched on when the page was last left. Off if unknown. */
export function rememberedCameras(kept: Kept): CameraSwitches {
  // Private windows may refuse storage, and what was kept may be damaged; either way the cameras start off.
  try {
    const value: unknown = JSON.parse(kept.getItem(CAMERAS_KEY) ?? '{}');
    const read = (key: keyof CameraSwitches) => typeof value === 'object' && value !== null && (value as Record<string, unknown>)[key] === true;
    return { hands: read('hands'), motion: read('motion') };
  } catch {
    return { hands: false, motion: false };
  }
}

export function rememberCameras(kept: Kept, switches: CameraSwitches): void {
  try {
    kept.setItem(CAMERAS_KEY, JSON.stringify(switches));
  } catch {
    // Not remembered; the cameras just start off next time.
  }
}

/** The address that opens another scene, keeping everything else in it, such as the look, but not a saved tank. */
export function sceneAddress(search: string, scene: string): string {
  const address = new URLSearchParams(search);
  address.delete('tank');
  address.delete('scene');
  return `?${new URLSearchParams([['scene', scene], ...address])}`;
}
