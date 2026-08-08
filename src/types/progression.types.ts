/**
 * Level-by-level advancement record — the data behind the "Progresso" track.
 *
 * House rule (Torchlight): a character climbs from level 1 to 20, and each
 * level grants exactly one thing:
 *   - even levels → roll the class hit die and add the result (+CON) to HP
 *   - odd  levels → roll 2d6 on the class talent table and gain that talent
 *
 * One `LevelEntry` is stored per *resolved* level. Levels the character has
 * not reached (or has reached but not yet rolled) have no entry at all, so an
 * empty array is a perfectly valid "nothing resolved yet" state.
 */

/** What a given level grants. Derived from the level number, never stored. */
export type LevelRewardKind = 'hp' | 'talent'

export interface LevelEntry {
  /** 1–20. Unique within the array — one entry per level. */
  level: number
  /** Mirrors `rewardKindFor(level)`; persisted so old rows stay readable if the rule changes. */
  kind: LevelRewardKind

  // ─── kind === 'hp' ────────────────────────────────────────────────────────
  /** Raw hit-die result, before the CON modifier. */
  hpRoll?: number
  /** Sides of the hit die that was rolled (d6 / d8 / …), for the receipt line. */
  hpDie?: number
  /** CON modifier applied at the moment of the roll. */
  conMod?: number
  /** HP actually added to the maximum — `max(1, hpRoll + conMod)`. */
  hpGain?: number

  // ─── kind === 'talent' ────────────────────────────────────────────────────
  /** Id of the Talent pushed onto `character.talents`, so undo can pull it back out. */
  talentId?: string
  /** 2d6 total and the individual dice, for the receipt line. */
  talentRoll?: number
  talentDie1?: number
  talentDie2?: number
  /** Talent table effect text, duplicated here so the card reads without a lookup. */
  talentEffect?: string

  /** ISO timestamp of when the level was sealed. */
  sealedAt?: string
}
