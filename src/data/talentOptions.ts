import type { Stat } from '@/types/class.types'
import type { TalentEffect, TalentOption } from '@/types/talent.types'
import { STAT_FULL } from '@/data/stats'

/**
 * Small builders for the `options` of the class talent tables, so each row in
 * `data/classes/*` reads close to the rule it encodes:
 *
 *   { roll: '7-9', ..., options: statBoost(2, 'str', 'dex', 'con') }
 *
 * Every builder returns a list, so a row that offers "this or that" is just
 * the two lists spread together.
 */

/** "+N to X, Y or Z": one option per attribute. */
export function statBoost(amount: number, ...stats: Stat[]): TalentOption[] {
  return stats.map(stat => ({
    id: `stat-${stat}`,
    label: `+${amount} ${STAT_FULL[stat]}`,
    effects: [{ kind: 'stat', stat, amount }],
  }))
}

/** "+N to melee and ranged attacks": both bonuses at once. */
export function attacks(amount: number): TalentOption[] {
  return [{
    id: 'attacks',
    label: `+${amount} em ataques corpo a corpo e à distância`,
    effects: [{ kind: 'melee', amount }, { kind: 'ranged', amount }],
  }]
}

/** "+N to melee attacks". */
export function melee(amount: number): TalentOption[] {
  return [{ id: 'melee', label: `+${amount} em ataques corpo a corpo`, effects: [{ kind: 'melee', amount }] }]
}

/** "+N to ranged attacks". */
export function ranged(amount: number): TalentOption[] {
  return [{ id: 'ranged', label: `+${amount} em ataques à distância`, effects: [{ kind: 'ranged', amount }] }]
}

/** "+N to spellcasting checks". */
export function spellcasting(amount: number): TalentOption[] {
  return [{
    id: 'spellcasting',
    label: `+${amount} em testes de conjuração`,
    effects: [{ kind: 'spellcasting', amount }],
  }]
}

/** "+1 to N different attributes": N points, never two on the same one. */
export function spreadStats(count: number): TalentOption[] {
  return [{
    id: 'spread',
    label: `+1 em ${count} atributos diferentes`,
    distribute: { points: count, maxPerStat: 1 },
  }]
}

/** "+N points to distribute to stats". */
export function distribute(points: number, stats?: Stat[]): TalentOption[] {
  return [{ id: 'distribute', label: `Distribuir +${points} pontos nos atributos`, distribute: { points, stats } }]
}

/** "Choose a talent": take another row of the same table. */
export function fromTable(): TalentOption[] {
  return [{ id: 'table', label: 'Escolher um talento da tabela', fromTable: true }]
}

/**
 * A choice the rule leaves to the player with no number attached — the weapon
 * type, the armor, the herb. The answer is kept and shown on the talent.
 */
export function note(label: string, prompt: string, placeholder?: string, id = 'note'): TalentOption[] {
  return [{ id, label, note: { prompt, placeholder } }]
}

/** A named pick that changes no number ("varinha de mago"), kept as the talent's choice. */
export function pick(id: string, label: string, effects?: TalentEffect[]): TalentOption[] {
  return [{ id, label, ...(effects && { effects }) }]
}
