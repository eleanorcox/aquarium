// What a visitor has chosen so far, and the fish that makes. No page in here, so it can be tested.
import { MAX_NAME_LENGTH, type Outline, type Pattern, type VisitorFish } from '../visitors/visitorFish';
import { dominantHues, type Stroke } from './colouring';

export interface Choices {
  outline: Outline;
  /** 'choose' is two colours and a pattern; 'colour' is colouring the outline in. */
  mode: 'choose' | 'colour';
  hues: [number, number];
  pattern: Exclude<Pattern, 'coloured'>;
  temperament: number;
  name: string;
  strokes: readonly Stroke[];
}

export const newChoices = (): Choices => ({ outline: 'slim', mode: 'choose', hues: [20, 200], pattern: 'plain', temperament: 0, name: '', strokes: [] });

const tidyName = (name: string) => name.trim().slice(0, MAX_NAME_LENGTH);

/** Whether Send should be allowed: a name, and in colouring in, some colour. */
export function canSend(choices: Choices): boolean {
  return tidyName(choices.name) !== '' && (choices.mode === 'choose' || choices.strokes.length > 0);
}

/** The fish for the choices. A coloured-in fish needs its picture, drawn by the page. */
export function toFish(choices: Choices, picture?: string): VisitorFish {
  const base = { version: 1 as const, name: tidyName(choices.name), outline: choices.outline, temperament: choices.temperament };
  if (choices.mode === 'colour') return { ...base, hues: dominantHues(choices.strokes), pattern: 'coloured', ...(picture === undefined ? {} : { picture }) };
  return { ...base, hues: choices.hues, pattern: choices.pattern };
}
