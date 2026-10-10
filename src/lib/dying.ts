import type { ActiveCondition } from '@/types/character.types'
import { modifier, rollDie, withDc } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'

/**
 * Morrer em Shadowdark.
 *
 * Chegar a 0 PV não é um número no canto da ficha: o personagem cai
 * inconsciente e começa a morrer. Ele tem 1d4 + CON rodadas (no mínimo uma).
 * Em cada vez dele, rola um d20 — um 20 natural o põe de pé com 1 PV. Um
 * aliado pode estabilizá-lo (INT DC 15), e então ele para de morrer, mas
 * continua apagado até alguém curá-lo. Se o relógio chega a zero, acabou.
 *
 * Até aqui isso era feito de cabeça, e era justamente o momento mais tenso da
 * mesa. O estado mora nas condições da ficha (a coluna de 016), então nenhuma
 * migração é necessária: "Morrendo" carrega as rodadas que restam, "Estável" e
 * "Morto" são marcas simples. As regras ficam todas aqui, porque dois lados
 * escrevem PV — a ficha e o painel do Mestre — e os dois têm de concordar.
 */

export const DYING_ID = 'morrendo'
export const STABLE_ID = 'estavel'
export const DEAD_ID = 'morto'

const MORTAL_IDS = new Set([DYING_ID, STABLE_ID, DEAD_ID])

/** Um 20 natural é a única saída sozinha — o DC que diz isso na rolagem. */
export const DEATH_DC = 20

/** O teste de quem tenta salvar o caído. */
export const STABILIZE_DC = 15

export type MortalState = 'standing' | 'dying' | 'stable' | 'dead'

export function isMortalCondition(condition: ActiveCondition): boolean {
  return MORTAL_IDS.has(condition.id)
}

/** As condições de sempre, sem as de vida e morte — que têm um lugar só delas. */
export function withoutMortal(conditions: ActiveCondition[]): ActiveCondition[] {
  return conditions.filter(c => !isMortalCondition(c))
}

export function mortalState(conditions: ActiveCondition[]): MortalState {
  if (conditions.some(c => c.id === DEAD_ID)) return 'dead'
  if (conditions.some(c => c.id === DYING_ID)) return 'dying'
  if (conditions.some(c => c.id === STABLE_ID)) return 'stable'
  return 'standing'
}

/**
 * Quem não tem vez: o morto e o caído estabilizado, que está inconsciente.
 * Quem está morrendo ainda tem — é nela que rola contra a morte. O banco
 * aplica a mesma regra à trilha (`pc_out_of_fight`, migração 022).
 */
export function outOfFight(conditions: ActiveCondition[]): boolean {
  const state = mortalState(conditions)
  return state === 'dead' || state === 'stable'
}

/** Quantas rodadas restam a quem está morrendo; nulo para quem não está. */
export function dyingRounds(conditions: ActiveCondition[]): number | null {
  const dying = conditions.find(c => c.id === DYING_ID)
  if (!dying) return null
  // Marcada à mão pelo Mestre, a condição vem sem relógio: uma rodada é o
  // mínimo da regra, e é melhor do que travar a mesa.
  return Math.max(0, dying.rounds ?? 1)
}

export function roundsLabel(rounds: number): string {
  return rounds === 1 ? '1 rodada' : `${rounds} rodadas`
}

function stamp(by: string) {
  return { appliedBy: by, appliedAt: new Date().toISOString() }
}

function dyingCondition(rounds: number, by: string): ActiveCondition {
  return { id: DYING_ID, label: 'Morrendo', note: roundsLabel(rounds), rounds, ...stamp(by) }
}

function stableCondition(by: string): ActiveCondition {
  return { id: STABLE_ID, label: 'Estável', note: 'inconsciente, fora de perigo', ...stamp(by) }
}

function deadCondition(by: string): ActiveCondition {
  return { id: DEAD_ID, label: 'Morto', ...stamp(by) }
}

/** O relógio da morte: 1d4 + modificador de CON, nunca menos de uma rodada. */
export function rollDeathTimer(con: number): { roll: RollResult; rounds: number } {
  const roll = rollDie('d4', 'Morrendo', 'Rodadas até a morte', modifier(con))
  return { roll, rounds: Math.max(1, roll.total) }
}

/**
 * O que o evento do log precisa saber de uma virada de estado. `conditionId`
 * é o que o feed usa para contar "caiu e está morrendo" em vez de um genérico
 * "está Morrendo".
 */
export interface MortalEvent {
  action: 'applied' | 'removed'
  label: string
  conditionId: string
  note?: string
}

export interface HpShift {
  conditions: ActiveCondition[]
  event: MortalEvent
  /** Quando o personagem acabou de cair: a rolagem do relógio. */
  timer?: RollResult
}

/**
 * O que uma mudança de PV faz com a vida do personagem. Nulo quando nada muda.
 *
 * Cair a 0 de pé abre o relógio; voltar a ter PV, de qualquer estado, fecha
 * tudo — quem tem vida não está morrendo, e curar um morto é decisão que só o
 * Mestre toma (uma ressurreição, um milagre), então o app não discute.
 */
export function hpShift(
  conditions: ActiveCondition[],
  con: number,
  from: number,
  to: number,
  by: string,
): HpShift | null {
  const state = mortalState(conditions)

  if (from > 0 && to <= 0 && state === 'standing') {
    const timer = rollDeathTimer(con)
    return {
      conditions: [...withoutMortal(conditions), dyingCondition(timer.rounds, by)],
      event: {
        action: 'applied',
        label: 'Morrendo',
        conditionId: DYING_ID,
        note: `${roundsLabel(timer.rounds)} · ${timer.roll.die} ${timer.roll.result}${signed(timer.roll.modifier ?? 0)}`,
      },
      timer: timer.roll,
    }
  }

  if (to > 0 && state !== 'standing') {
    return {
      conditions: withoutMortal(conditions),
      event: { action: 'removed', label: LABEL[state], conditionId: ID[state] },
    }
  }

  return null
}

const LABEL: Record<Exclude<MortalState, 'standing'>, string> = {
  dying: 'Morrendo',
  stable: 'Estável',
  dead: 'Morto',
}

const ID: Record<Exclude<MortalState, 'standing'>, string> = {
  dying: DYING_ID,
  stable: STABLE_ID,
  dead: DEAD_ID,
}

function signed(n: number): string {
  if (n === 0) return ''
  return n > 0 ? ` +${n}` : ` ${n}`
}

/** A rolagem da vez de quem está morrendo: d20 puro, só o 20 salva. */
export function rollAgainstDeath(rounds: number): RollResult {
  return withDc(rollDie('d20', 'Contra a morte', `${roundsLabel(rounds)} restante${rounds === 1 ? '' : 's'}`), DEATH_DC)
}

export interface DeathRollOutcome {
  outcome: 'rise' | 'holding' | 'dead'
  conditions: ActiveCondition[]
  /** As rodadas que sobraram depois desta vez. */
  roundsLeft: number
  event: MortalEvent | null
}

/**
 * Lê a rolagem contra a morte. Um 20 natural levanta o personagem — quem
 * chama escreve o 1 PV junto. Qualquer outra coisa gasta uma rodada do
 * relógio; a última leva o personagem.
 */
export function afterDeathRoll(conditions: ActiveCondition[], roll: RollResult, by: string): DeathRollOutcome {
  if (roll.success) {
    return {
      outcome: 'rise',
      conditions: withoutMortal(conditions),
      roundsLeft: 0,
      event: { action: 'removed', label: 'Morrendo', conditionId: DYING_ID, note: '20 natural' },
    }
  }

  const left = (dyingRounds(conditions) ?? 1) - 1
  if (left <= 0) {
    return {
      outcome: 'dead',
      conditions: [...withoutMortal(conditions), deadCondition(by)],
      roundsLeft: 0,
      event: { action: 'applied', label: 'Morto', conditionId: DEAD_ID },
    }
  }

  // O relógio anda sem barulho no log: a rolagem já está lá, e a vez seguinte
  // mostra quanto falta. Só as viradas viram linha própria.
  const previous = conditions.find(c => c.id === DYING_ID)
  return {
    outcome: 'holding',
    conditions: [
      ...withoutMortal(conditions),
      { ...dyingCondition(left, by), ...(previous && { appliedBy: previous.appliedBy, appliedAt: previous.appliedAt }) },
    ],
    roundsLeft: left,
    event: null,
  }
}

/** Um aliado passou no INT DC 15: o relógio para, mas o personagem segue apagado. */
export function stabilize(conditions: ActiveCondition[], by: string): { conditions: ActiveCondition[]; event: MortalEvent } {
  return {
    conditions: [...withoutMortal(conditions), stableCondition(by)],
    event: { action: 'applied', label: 'Estável', conditionId: STABLE_ID, note: `INT DC ${STABILIZE_DC}` },
  }
}
