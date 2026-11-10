import type { Stat } from './class.types'

export type TalentOrigin = 'ancestry' | 'class' | 'general'

/**
 * A number a talent adds to one of the sheet's stored values. The talent keeps
 * the list of what it added, so removing it (or changing its choice) takes
 * exactly that back off — see `lib/talents`.
 *
 * - `stat`         — one of the six attributes
 * - `melee`        — `meleeBonus`, the flat bonus on melee attacks
 * - `ranged`       — `rangedBonus`, the flat bonus on ranged attacks
 * - `spellcasting` — `spellcastingBonus`, the flat bonus on casting checks
 * - `ac`           — the armor class
 */
export type TalentEffect =
  | { kind: 'stat'; stat: Stat; amount: number }
  | { kind: 'melee'; amount: number }
  | { kind: 'ranged'; amount: number }
  | { kind: 'spellcasting'; amount: number }
  | { kind: 'ac'; amount: number }

/** The targets a talent effect can move, for pickers and labels. */
export type TalentEffectTarget = Stat | Exclude<TalentEffect['kind'], 'stat'>

/**
 * One way a talent table row can be taken. A row with several of these asks
 * the player to pick; a row with one fixed option applies on its own.
 *
 * The parts combine: an option can add fixed effects, ask for points to split,
 * ask for a written detail (the weapon type, the armor, the spell), or send the
 * player to pick another row of the same table ("escolha um talento").
 */
export interface TalentOption {
  /** Stable within its row — what the talent remembers as its choice. */
  id: string
  /** What the picker shows: "+2 Força", "Distribuir +2 pontos". */
  label: string
  /** Added as written. */
  effects?: TalentEffect[]
  /**
   * The player splits `points` among `stats` (all six when left out), with
   * at most `maxPerStat` on any one of them when set ("+1 to two different
   * attributes" is 2 points, 1 per stat).
   */
  distribute?: { points: number; stats?: Stat[]; maxPerStat?: number }
  /** The player writes a detail the rule leaves open. */
  note?: { prompt: string; placeholder?: string }
  /** The player takes another row of this table instead. */
  fromTable?: boolean
}

/**
 * What the player picked for a talent that offers a choice. Kept so the choice
 * can be shown, and reopened with the same answer selected.
 */
export interface TalentChoice {
  /** `TalentOption.id` of the option taken. */
  optionId: string
  /** For a `fromTable` option: the `roll` label of the row taken instead ("7-9"). */
  row?: string
  /** For a `fromTable` option: the option taken inside that row. */
  rowOptionId?: string
  /** For a `distribute` option: points per attribute. */
  points?: Partial<Record<Stat, number>>
  /** For a `note` option: what the player wrote. */
  note?: string
}

export interface Talent {
  id: string
  name: string
  origin: TalentOrigin
  description: string
  /**
   * The level the talent was gained at — the number the talent list leads
   * with. Talents rolled on the progression track before this field existed
   * leave it out and are matched back to their level by `talentId` instead
   * (see `talentLevel`).
   */
  level?: number
  /**
   * What this talent added to the sheet. Applied when the talent arrives and
   * taken back when it leaves, so the sheet's numbers always carry it. Left
   * out on talents from before this field: those added nothing on their own.
   */
  effects?: TalentEffect[]
  /** For a rolled talent: the class whose table it came from. */
  classId?: string
  /** For a rolled talent: the 2d6 total, which finds its row again. */
  tableRoll?: number
  /** The answer to the row's choice, once made. */
  choice?: TalentChoice
  /** One line saying what the choice came to: "+2 Força", "Espadas longas". */
  choiceLabel?: string
  /** True while the row asks for a choice that has not been made yet. */
  pending?: boolean
}
