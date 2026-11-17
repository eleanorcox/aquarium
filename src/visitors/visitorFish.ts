// A fish made by a visitor on their phone, as it travels to the tank. Anyone can send anything, so every
// field is checked before it goes near the tank. Shared by the phone page, the service and the operator.

/** The fish outlines a visitor can choose from. Each is drawn to be coloured in, like a colouring sheet. */
export const OUTLINES = ['slim', 'round', 'tall'] as const;
/** 'coloured' means the visitor coloured the outline in with a finger, and the fish carries that picture. */
export const PATTERNS = ['plain', 'stripes', 'spots', 'coloured'] as const;

export type Outline = (typeof OUTLINES)[number];
export type Pattern = (typeof PATTERNS)[number];

export interface VisitorFish {
  version: 1;
  name: string;
  outline: Outline;
  /** Main colour and second colour, as hues from 0 to 359. */
  hues: [number, number];
  pattern: Pattern;
  /** From -1 shy to 1 curious. */
  temperament: number;
  /** The coloured-in outline as a PNG data address, only when the pattern is 'coloured'. */
  picture?: string;
}

export const MAX_NAME_LENGTH = 24;
/** About 75 KB of picture, plenty for a coloured-in outline at phone size. */
export const MAX_PICTURE_LENGTH = 100_000;
const PNG_PREFIX = 'data:image/png;base64,';

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const hue = (value: number) => ((Math.round(value) % 360) + 360) % 360;

/** The fish, checked and tidied, or why it was refused. Values a little out of range are brought into range. */
export function parseVisitorFish(input: unknown): VisitorFish | string {
  if (!isRecord(input) || input.version !== 1) return 'That is not a fish this version knows.';
  const { name, outline, hues, pattern, temperament, picture } = input;

  if (typeof name !== 'string') return 'The fish needs a name.';
  // Control characters could upset whatever shows the name, so they go; so do spaces at the ends.
  const tidy = name.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  if (tidy.length === 0) return 'The fish needs a name.';
  if (tidy.length > MAX_NAME_LENGTH) return `The name is too long: at most ${MAX_NAME_LENGTH} letters.`;

  if (!OUTLINES.includes(outline as Outline)) return 'That kind of fish does not exist.';
  if (!PATTERNS.includes(pattern as Pattern)) return 'That pattern does not exist.';
  if (!Array.isArray(hues) || hues.length !== 2 || !hues.every(isNumber)) return 'The fish needs two colours.';
  if (!isNumber(temperament)) return 'The fish needs to be somewhere between shy and curious.';

  const fish: VisitorFish = {
    version: 1,
    name: tidy,
    outline: outline as Outline,
    hues: [hue(hues[0]!), hue(hues[1]!)],
    pattern: pattern as Pattern,
    temperament: Math.min(1, Math.max(-1, temperament)),
  };
  if (pattern !== 'coloured') return fish;

  if (typeof picture !== 'string' || !picture.startsWith(PNG_PREFIX)) return 'A coloured-in fish needs its picture.';
  if (picture.length > MAX_PICTURE_LENGTH) return 'The picture is too big.';
  if (!/^[A-Za-z0-9+/]+=*$/.test(picture.slice(PNG_PREFIX.length))) return 'The picture is damaged.';
  return { ...fish, picture };
}
