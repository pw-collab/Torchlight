import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Force the text rendering of a symbol.
 *
 * Several of the glyphs the card decks use (⚔ ⚡ ⚙ ☠ ⚰) default to the colour
 * emoji face on most platforms, which drops a cartoon into an otherwise
 * monochrome deck. The VS15 variation selector asks for the typographic form;
 * it is ignored by characters that only have one.
 */
export function textGlyph(glyph: string): string {
  return `${glyph}︎`
}
