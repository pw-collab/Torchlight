export type ArmorType = 'none' | 'light' | 'medium' | 'heavy' | 'shield'
export type WeaponType = 'simple' | 'martial' | 'ranged'
export type Stat = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// ─── Technique Kinds ──────────────────────────────────────────────────────────

/**
 * Determines the UI and mechanical behaviour of a class technique.
 *
 * - `passive`      — always active; may contribute a stat-based modifier
 * - `choice`       — player must pick an option before the effect applies
 * - `limited_use`  — has a fixed number of uses that reset on rest
 * - `spell_like`   — activate by rolling d20 + stat vs DC; failure expends
 *                    the ability until the next rest
 */
export type TechniqueKind = 'passive' | 'choice' | 'limited_use' | 'spell_like'

// ─── Passive Modifier ─────────────────────────────────────────────────────────

/** Describes a numeric bonus derived from a character stat. */
export interface TechniqueModifier {
  /** The stat that provides the modifier value (e.g. 'con' for Hauler). */
  stat: Stat
  /** Logical target for the bonus — consumed by other components (e.g. 'gearSlots', 'ac'). */
  applyTo: string
  /** When true, the bonus only counts if the stat modifier is positive. */
  onlyIfPositive?: boolean
}

// ─── Choice ───────────────────────────────────────────────────────────────────

export interface TechniqueChoiceOption {
  value: string
  label: string
}

export interface TechniqueChoice {
  /** Prompt shown to the player before a choice is made. */
  prompt: string
  /** Shape of the options available. */
  kind: 'stat' | 'weapon_type' | 'armor_type' | 'free_text'
  /**
   * Pre-defined choices (required for 'stat', 'weapon_type', 'armor_type').
   * Leave undefined for 'free_text'.
   */
  options?: TechniqueChoiceOption[]
  /**
   * When true the choice is tracked for reference but has no auto-calculated
   * mechanical output (e.g. Grit — the advantage note is informational).
   */
  informativeOnly?: boolean
}

// ─── Limited Use ─────────────────────────────────────────────────────────────

export interface TechniqueUses {
  /** Maximum uses before a rest is needed. */
  max: number
  /** Which rest type refills the uses. */
  resetOn: 'short_rest' | 'long_rest'
  /** Display label appended to the counter, e.g. "por descanso". */
  perLabel?: string
}

// ─── Spell-Like ───────────────────────────────────────────────────────────────

export interface SpellLikeAbility {
  /** Stable id — used to track expended state per-ability. */
  id: string
  name: string
  description: string
  range?: string
  duration?: string
  castingTime?: string
  /** Per-ability DC override. Falls back to TechniqueSpellLike.dc if absent. */
  dc?: number
}

export interface TechniqueSpellLike {
  /** Stat used for the activation roll (d20 + modifier vs DC). */
  castStat: Stat
  /** Default difficulty class for activation rolls. */
  dc: number
  /** On fail, the ability is marked expended until this rest type. */
  resetOn: 'short_rest' | 'long_rest'
  /** The individual abilities this technique grants. */
  abilities: SpellLikeAbility[]
}

// ─── Class Technique ─────────────────────────────────────────────────────────

/** A named class ability (Hauler, Weapon Mastery, Turn Undead, etc.). */
export interface ClassTechnique {
  /** Stable identifier — used as the key in TechniqueState records. */
  id: string
  name: string
  description: string
  /**
   * Mechanical kind. Defaults to 'passive' when omitted.
   * The matching config field (modifier / choice / uses / spellLike) must be
   * populated for kinds other than 'passive'.
   */
  kind?: TechniqueKind
  /** Only for kind === 'passive'. Describes a numeric stat-driven bonus. */
  modifier?: TechniqueModifier
  /** Only for kind === 'choice'. Describes the player-made selection. */
  choice?: TechniqueChoice
  /** Only for kind === 'limited_use'. Describes use count and reset schedule. */
  uses?: TechniqueUses
  /** Only for kind === 'spell_like'. Lists the grantable abilities and roll rules. */
  spellLike?: TechniqueSpellLike
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
