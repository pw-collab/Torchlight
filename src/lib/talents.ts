import type { Class, Stat, TalentTableEntry } from '@/types/class.types'
import type { CharacterRow } from '@/types/character.types'
import type {
  Talent,
  TalentChoice,
  TalentEffect,
  TalentEffectTarget,
  TalentOption,
} from '@/types/talent.types'
import { STAT_FULL, STAT_KEYS, STAT_LABELS, isStat } from '@/data/stats'

/**
 * Talents that change numbers on the sheet.
 *
 * A talent carries the list of effects it added (`Talent.effects`). The sheet
 * keeps storing plain totals — the six attributes, the attack and casting
 * bonuses, the AC — so everything that reads them (the GM table, attacks,
 * spells) sees the talent without knowing about it. What makes it reversible
 * is that every change to the talent list goes through `applyTalentChange`,
 * which takes off what leaving talents had added and adds what arriving ones
 * bring. Delete "+2 Força" and Força drops by two.
 */

// ─── The numbers a talent can move ────────────────────────────────────────────

export interface TalentTargets {
  stats: Record<Stat, number>
  meleeBonus: number
  rangedBonus: number
  spellcastingBonus: number
  ac: number
}

/** The talent-movable numbers of a character as the sheet holds it. */
export function targetsOf(c: TalentTargets): TalentTargets {
  return {
    stats: { ...c.stats },
    meleeBonus: c.meleeBonus ?? 0,
    rangedBonus: c.rangedBonus ?? 0,
    spellcastingBonus: c.spellcastingBonus ?? 0,
    ac: c.ac ?? 0,
  }
}

/**
 * The patch that swaps the talent list for `next`, with every number the
 * change moves. Every save of a talent list on a live character goes here.
 */
export function talentListPatch(current: TalentTargets & { talents: Talent[] }, next: Talent[]): Partial<CharacterRow> {
  const before = targetsOf(current)
  const after = applyTalentChange(before, current.talents, next)
  return { talents: next, ...targetsPatch(before, after) }
}

/** Every effect target, in picker order. */
export const EFFECT_TARGETS: TalentEffectTarget[] = [...STAT_KEYS, 'melee', 'ranged', 'spellcasting', 'ac']

const TARGET_LABEL: Record<Exclude<TalentEffectTarget, Stat>, string> = {
  melee: 'ataque corpo a corpo',
  ranged: 'ataque à distância',
  spellcasting: 'conjuração',
  ac: 'CA',
}

/** Long label for a picker: "Força", "Ataque corpo a corpo". */
export function targetLabel(target: TalentEffectTarget): string {
  if (isStat(target)) return STAT_FULL[target]
  const label = TARGET_LABEL[target]
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function effectTarget(effect: TalentEffect): TalentEffectTarget {
  return effect.kind === 'stat' ? effect.stat : effect.kind
}

export function makeEffect(target: TalentEffectTarget, amount: number): TalentEffect {
  return isStat(target) ? { kind: 'stat', stat: target, amount } : { kind: target, amount }
}

/** Short label for a chip: "+2 FOR", "+1 corpo a corpo", "−1 CA". */
export function effectLabel(effect: TalentEffect): string {
  const sign = effect.amount < 0 ? '−' : '+'
  const amount = `${sign}${Math.abs(effect.amount)}`
  if (effect.kind === 'stat') return `${amount} ${STAT_LABELS[effect.stat]}`
  return `${amount} ${TARGET_LABEL[effect.kind]}`
}

/** Adds (`sign` 1) or takes off (`sign` −1) a list of effects. Never mutates. */
export function applyEffects(targets: TalentTargets, effects: TalentEffect[], sign: 1 | -1 = 1): TalentTargets {
  const next: TalentTargets = { ...targets, stats: { ...targets.stats } }
  for (const effect of effects) {
    const amount = effect.amount * sign
    switch (effect.kind) {
      case 'stat': next.stats[effect.stat] = (next.stats[effect.stat] ?? 0) + amount; break
      case 'melee': next.meleeBonus += amount; break
      case 'ranged': next.rangedBonus += amount; break
      case 'spellcasting': next.spellcastingBonus += amount; break
      case 'ac': next.ac += amount; break
    }
  }
  return next
}

function sameEffects(a: TalentEffect[] | undefined, b: TalentEffect[] | undefined): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? [])
}

/**
 * Moves the sheet's numbers from what the `prev` talents added to what the
 * `next` ones add. Talents are matched by id: a talent that left takes its
 * effects with it, a new one brings its own, and one whose effects changed
 * (a new choice) swaps the old for the new.
 */
export function applyTalentChange(targets: TalentTargets, prev: Talent[], next: Talent[]): TalentTargets {
  const before = new Map(prev.map(t => [t.id, t]))
  const after = new Map(next.map(t => [t.id, t]))
  let out = targets
  for (const old of prev) {
    const now = after.get(old.id)
    if (!now || !sameEffects(old.effects, now.effects)) out = applyEffects(out, old.effects ?? [], -1)
  }
  for (const now of next) {
    const old = before.get(now.id)
    if (!old || !sameEffects(old.effects, now.effects)) out = applyEffects(out, now.effects ?? [], 1)
  }
  return out
}

/** Everything the talents in a list add, summed — for a fresh character. */
export function talentTotals(talents: Talent[]): TalentEffect[] {
  return talents.flatMap(t => t.effects ?? [])
}

/** The database columns that differ between two sets of targets. */
export function targetsPatch(before: TalentTargets, after: TalentTargets): Partial<CharacterRow> {
  const patch: Partial<CharacterRow> = {}
  for (const stat of STAT_KEYS) {
    if (after.stats[stat] !== before.stats[stat]) patch[stat] = after.stats[stat]
  }
  if (after.meleeBonus !== before.meleeBonus) patch.melee_bonus = after.meleeBonus
  if (after.rangedBonus !== before.rangedBonus) patch.ranged_bonus = after.rangedBonus
  if (after.spellcastingBonus !== before.spellcastingBonus) patch.spellcasting_bonus = after.spellcastingBonus
  if (after.ac !== before.ac) patch.ac = after.ac
  return patch
}

// ─── The class talent table ───────────────────────────────────────────────────

export function rowForRoll(table: TalentTableEntry[], roll: number): TalentTableEntry | undefined {
  return table.find(e => roll >= e.min && roll <= e.max)
}

/**
 * The table row a talent came from. A talent rolled since effects exist keeps
 * its 2d6 total; older ones were named after the row's text, so the text finds
 * them too.
 */
export function rowForTalent(talent: Talent, classData: Class | undefined): TalentTableEntry | undefined {
  if (!classData) return undefined
  if (talent.tableRoll != null) return rowForRoll(classData.talentTable, talent.tableRoll)
  return classData.talentTable.find(e => e.effect === talent.name)
}

function optionAsks(option: TalentOption): boolean {
  return Boolean(option.distribute || option.note || option.fromTable)
}

/** True when taking the row needs the player to decide something. */
export function rowNeedsChoice(row: TalentTableEntry | undefined): boolean {
  const options = row?.options ?? []
  return options.length > 1 || options.some(optionAsks)
}

/** Rows a "choose a talent" option may send the player to: every row that does not do the same. */
export function pickableRows(table: TalentTableEntry[]): TalentTableEntry[] {
  return table.filter(row => !(row.options ?? []).some(o => o.fromTable))
}

export interface ResolvedChoice {
  effects: TalentEffect[]
  label: string
}

/**
 * What a choice comes to on the sheet, or null while it is incomplete: points
 * not all spent, a detail not written, a row not picked.
 */
export function resolveChoice(
  row: TalentTableEntry,
  table: TalentTableEntry[],
  choice: TalentChoice,
): ResolvedChoice | null {
  const option = row.options?.find(o => o.id === choice.optionId)
  if (!option) return null

  if (option.fromTable) {
    const other = pickableRows(table).find(r => r.roll === choice.row)
    if (!other) return null
    // A row with nothing to pick is taken as it stands.
    const options = other.options ?? []
    if (options.length === 0) return { effects: [], label: other.effect }
    const inner = resolveChoice(other, table, {
      optionId: choice.rowOptionId ?? (options.length === 1 ? options[0].id : ''),
      points: choice.points,
      note: choice.note,
    })
    return inner && { effects: inner.effects, label: `${other.roll}: ${inner.label}` }
  }

  const effects: TalentEffect[] = [...(option.effects ?? [])]
  const parts: string[] = []

  if (option.distribute) {
    const allowed = option.distribute.stats ?? STAT_KEYS
    const spread = Object.entries(choice.points ?? {}).filter(
      (entry): entry is [Stat, number] => isStat(entry[0]) && allowed.includes(entry[0]) && (entry[1] ?? 0) > 0,
    )
    const spent = spread.reduce((sum, [, n]) => sum + n, 0)
    if (spent !== option.distribute.points) return null
    const cap = option.distribute.maxPerStat
    if (cap != null && spread.some(([, n]) => n > cap)) return null
    for (const [stat, amount] of spread) effects.push({ kind: 'stat', stat, amount })
    parts.push(spread.map(([stat, n]) => `+${n} ${STAT_FULL[stat]}`).join(', '))
  }

  if (option.note) {
    const text = choice.note?.trim()
    if (!text) return null
    parts.push(text)
  }

  return { effects, label: parts.length > 0 ? parts.join(' · ') : option.label }
}

/** The answer to a row that asks nothing — its only option — or null when it asks. */
export function automaticChoice(row: TalentTableEntry | undefined): TalentChoice | null {
  const options = row?.options ?? []
  if (options.length !== 1 || optionAsks(options[0])) return null
  return { optionId: options[0].id }
}

/**
 * A talent fresh off a 2d6 roll. A row that asks nothing lands with its
 * effects already in place; one that asks lands pending, adding nothing until
 * the player chooses (see `chooseTalent`).
 */
export function talentFromRoll(args: {
  classData: Class
  roll: number
  row: TalentTableEntry
  description: string
  level?: number
}): Talent {
  const { classData, roll, row, description, level } = args
  const talent: Talent = {
    id: Math.random().toString(36).substring(2, 9),
    name: row.effect,
    origin: 'class',
    description,
    classId: classData.id,
    tableRoll: roll,
    effects: [],
    ...(level != null && { level }),
  }
  const auto = automaticChoice(row)
  if (auto) {
    const resolved = resolveChoice(row, classData.talentTable, auto)
    return { ...talent, effects: resolved?.effects ?? [] }
  }
  return rowNeedsChoice(row) ? { ...talent, pending: true } : talent
}

/** The talent with a choice made (or remade). Its effects become the choice's. */
export function chooseTalent(talent: Talent, row: TalentTableEntry, table: TalentTableEntry[], choice: TalentChoice): Talent | null {
  const resolved = resolveChoice(row, table, choice)
  if (!resolved) return null
  const next: Talent = { ...talent, choice, choiceLabel: resolved.label, effects: resolved.effects }
  delete next.pending
  return next
}
