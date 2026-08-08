/**
 * Level-by-level advancement record — the data behind the "Progresso" track.
 *
 * House rule (Torchlight): a character climbs from level 1 to 20.
 *   - every level-up rolls the class hit die and adds the result to max HP
 *   - odd levels additionally roll 2d6 on the class talent table
 *
 * The CON modifier is *not* re-applied on each level: it counts once, inside
 * the base HP rolled during creation. Level 1 therefore carries no hit-die roll
 * of its own — that roll is the creation roll — only its talent.
 *
 * One `LevelEntry` is stored per level that has *something* resolved, and a
 * level is only finished once every reward it offers has landed. Levels the
 * character has not reached have no entry at all, so an empty array is a
 * perfectly valid "nothing resolved yet" state.
 */
export interface LevelEntry {
  /** 1–20. Unique within the array — one entry per level. */
  level: number

  // ─── Hit-die roll (every level from 2 on) ─────────────────────────────────
  /** Raw hit-die result. */
  hpRoll?: number
  /** Sides of the hit die that was rolled (d6 / d8 / …), for the receipt line. */
  hpDie?: number
  /** HP added to the maximum — equal to `hpRoll`, since CON is counted once. */
  hpGain?: number
  /**
   * Legacy. The first cut of the track added the CON modifier on every level;
   * entries written back then still print it so an old level reads the way it
   * was actually rolled. Nothing writes this any more.
   */
  conMod?: number

  // ─── Talent roll (odd levels) ─────────────────────────────────────────────
  /** Id of the Talent pushed onto `character.talents`, so undo can pull it back out. */
  talentId?: string
  /** 2d6 total and the individual dice, for the receipt line. */
  talentRoll?: number
  talentDie1?: number
  talentDie2?: number
  /** Talent table effect text, duplicated here so the card reads without a lookup. */
  talentEffect?: string

  /** ISO timestamp of the most recent roll on this level. */
  sealedAt?: string
}
