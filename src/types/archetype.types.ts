/**
 * Archetypes — the kind of person the character is, before their abilities
 * enter play.
 *
 * The class answers *how* a character acts (fights, casts, survives); the
 * archetype answers *why* and *in which way*. Two characters of the same class
 * read as completely different people once their archetypes differ.
 *
 * Mirrors the "Arquétipos" database in the campaign wiki: a concept line, the
 * talent built from it, the questions that turn it into a person, and the
 * number of allies or rivals it drags along.
 */

export type ArchetypeKitType = 'weapon' | 'armor' | 'shield' | 'gear'

/**
 * One entry of an archetype's starting kit.
 *
 * `itemId` points at the inventory catalog whenever the item already exists
 * there. Items the catalog does not carry (a silvered dagger, a reliquary)
 * describe themselves inline instead.
 */
export interface ArchetypeKitItem {
  /** Catalog id — resolved through `getInventoryItem`. */
  itemId?: string
  /** Display name. Required for items outside the catalog. */
  name: string
  /** Gear slots consumed. Defaults to 1 for off-catalog items. */
  slots?: number
  description?: string
  type?: ArchetypeKitType
  /** Damage die for off-catalog weapons, e.g. `1d4`. */
  damageDie?: string
}

export interface Archetype {
  id: string
  name: string
  /**
   * Classes this archetype is offered to. `['*']` means every class —
   * an archetype anyone could plausibly have lived.
   */
  classIds: string[]
  /** Symbol drawn in the card's hex window. */
  glyph: string
  /** Concept line — the card caption and the lede of the detail panel. */
  summary: string
  /** The advantage the archetype grants. Absent while the entry is unwritten. */
  talent?: string
  /** Pick one to answer — they define *how* the character acts. */
  questions?: string[]
  /** Pick one to answer — they define the character's ties to the world. */
  connections?: string[]
  /** How many allies or rivals the archetype brings to the table. */
  alliesRivals?: number
  /** Gear the archetype adds to the starting kit. */
  kit?: ArchetypeKitItem[]
  /** The thread left dangling — a debt, a pursuer, a promise. */
  hook?: string
}
