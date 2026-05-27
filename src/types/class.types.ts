export type ArmorType = 'none' | 'light' | 'medium' | 'heavy' | 'shield'
export type WeaponType = 'simple' | 'martial' | 'ranged'
export type Stat = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// ─── Class Techniques ─────────────────────────────────────────────────────────

/** A named class ability (Hauler, Weapon Mastery, etc.). */
export interface ClassTechnique {
  name: string
  description: string
}

// ─── Talent Table ─────────────────────────────────────────────────────────────

/**
 * One row of a class's 2d6 talent table.
 * min/max define the numeric range; roll is the display string ("3-6", "12", etc.).
 */
export interface TalentTableEntry {
  roll: string
  min: number
  max: number
  effect: string
}

// ─── Spellcasting ─────────────────────────────────────────────────────────────

export interface SpellcastingConfig {
  stat: Stat
  spellsPerDay: number[] // indexed by level (0-indexed = level 1)
}

// ─── Class ────────────────────────────────────────────────────────────────────

export interface Class {
  id: string
  name: string
  hitDie: number

  /** Human-readable weapon proficiency description. */
  weaponProficiency: string
  /** Human-readable armor/shield proficiency description. */
  armorProficiency: string

  /**
   * Up to 4 named class techniques. Null entries represent empty slots.
   * These are abilities granted at class creation (not rolled randomly).
   */
  techniques: (ClassTechnique | null)[]

  /**
   * 2d6 talent table. Consulted when the character levels up at an odd level.
   * Use getTalentForRoll(classId, roll) or rollClassTalent(classId) from the index.
   */
  talentTable: TalentTableEntry[]

  /** Archetype/subclass label (future expansion). */
  archetypeLabel?: string

  /** Optional spellcasting configuration. */
  spellcasting?: SpellcastingConfig

  /** Starting equipment item ids (from inventory catalog). */
  startingGear?: string[]

  // Legacy typed arrays kept for backward-compat with SlotTracker etc.
  armorTraining?: ArmorType[]
  weaponTraining?: WeaponType[]
}
