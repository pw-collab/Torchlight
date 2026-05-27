/**
 * Runtime state for a single class technique, stored per character.
 * Only fields relevant to the technique's kind need to be populated.
 * An absent entry implies all-default state (full uses, no choice, nothing expended).
 */
export interface TechniqueState {
  /** Matches ClassTechnique.id */
  id: string

  // ── choice ──────────────────────────────────────────────────────────────────
  /** The value the player chose (weapon type name, stat key, or free text). */
  choice?: string

  // ── limited_use ──────────────────────────────────────────────────────────────
  /** Remaining uses. Undefined means full (= ClassTechnique.uses.max). */
  usesRemaining?: number

  // ── spell_like ───────────────────────────────────────────────────────────────
  /**
   * IDs of abilities that were attempted and failed this rest period.
   * Absent or empty array means none are expended.
   */
  expendedAbilities?: string[]
}
