/**
 * A masmorra viva: o nível de perigo e a checagem de encontro.
 *
 * Em Shadowdark o Mestre conta as rodadas de exploração e, num ritmo ditado
 * pelo perigo do lugar, rola um d6: no 1, algo se aproxima. Quando aparece, a
 * mesa ainda precisa saber a que distância, fazendo o quê e com que humor.
 * Eram quatro rolagens e três tabelas de cabeça, no meio da cena; aqui são um
 * botão.
 */

export type DangerLevel = 'unsafe' | 'risky' | 'deadly'

export const DANGER_LEVELS: { id: DangerLevel; label: string; every: number }[] = [
  { id: 'unsafe', label: 'Inseguro', every: 3 },
  { id: 'risky', label: 'Arriscado', every: 2 },
  { id: 'deadly', label: 'Mortal', every: 1 },
]

export function dangerOf(id: DangerLevel) {
  return DANGER_LEVELS.find(d => d.id === id) ?? DANGER_LEVELS[0]
}

/** Se a rodada que acabou de passar pede a checagem, pelo ritmo do perigo. */
export function checkDue(round: number, danger: DangerLevel): boolean {
  return round > 0 && round % dangerOf(danger).every === 0
}

/** Quantas rodadas faltam até a próxima checagem. */
export function roundsToCheck(round: number, danger: DangerLevel): number {
  const every = dangerOf(danger).every
  return every - (round % every)
}

// ─── Tabelas ──────────────────────────────────────────────────────────────────

interface Band {
  max: number
  label: string
}

function band(table: Band[], value: number): string {
  return (table.find(b => value <= b.max) ?? table[table.length - 1]).label
}

/** d6: a que distância a coisa está quando a mesa a percebe. */
const DISTANCE: Band[] = [
  { max: 1, label: 'Perto (Close)' },
  { max: 4, label: 'Próximo (Near)' },
  { max: 6, label: 'Longe (Far)' },
]

/** 2d6: o que ela está fazendo. */
const ACTIVITY: Band[] = [
  { max: 4, label: 'Caçando' },
  { max: 6, label: 'Comendo' },
  { max: 8, label: 'Construindo ou fazendo ninho' },
  { max: 10, label: 'Socializando ou brincando' },
  { max: 11, label: 'Montando guarda' },
  { max: 12, label: 'Dormindo' },
]

/** 2d6 + CAR de quem fala pelo grupo: como ela recebe a mesa. */
const REACTION: Band[] = [
  { max: 6, label: 'Hostil' },
  { max: 8, label: 'Desconfiada' },
  { max: 9, label: 'Neutra' },
  { max: 11, label: 'Curiosa' },
  { max: Infinity, label: 'Amigável' },
]

// ─── Rolagem ──────────────────────────────────────────────────────────────────

function d(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export interface EncounterCheck {
  /** O d6 da checagem: 1 é encontro. */
  die: number
  encounter: boolean
  /** Só quando há encontro. */
  distance?: { roll: number; label: string }
  activity?: { roll: number; label: string }
  reaction?: { roll: number; mod: number; total: number; label: string }
}

/**
 * A checagem inteira de uma vez. O CAR é de quem fala pelo grupo — o painel
 * passa o melhor da mesa, que é quem costuma falar.
 */
export function rollEncounterCheck(chaMod: number): EncounterCheck {
  const die = d(6)
  if (die !== 1) return { die, encounter: false }

  const distance = d(6)
  const activity = d(6) + d(6)
  const reaction = d(6) + d(6)
  const total = reaction + chaMod

  return {
    die,
    encounter: true,
    distance: { roll: distance, label: band(DISTANCE, distance) },
    activity: { roll: activity, label: band(ACTIVITY, activity) },
    reaction: { roll: reaction, mod: chaMod, total, label: band(REACTION, total) },
  }
}

/** A checagem em uma frase, para o log do Mestre. */
export function describeCheck(check: EncounterCheck, round: number | null): string {
  const when = round ? ` (rodada ${round})` : ''
  if (!check.encounter) return `Checagem de encontro${when}: d6 ${check.die}, nada se aproxima.`
  const { distance, activity, reaction } = check
  return (
    `Checagem de encontro${when}: d6 1, algo se aproxima! ` +
    `${distance?.label} · ${activity?.label} · ${reaction?.label} (2d6 ${reaction?.roll}${signed(reaction?.mod ?? 0)})`
  )
}

function signed(n: number): string {
  if (n === 0) return ''
  return n > 0 ? ` +${n}` : ` ${n}`
}
