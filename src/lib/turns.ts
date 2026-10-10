import type { ActorSource, Encounter, EncounterActor } from '@/types/encounter.types'

/**
 * A vez na mesa.
 *
 * Em Shadowdark a mesa sempre anda em turnos, na exploração e no combate. A
 * ordem dentro do grupo não é uma fila: os jogadores combinam na hora quem
 * vai, e quem vai assume a vez. Enquanto alguém está agindo ninguém mais
 * assume; a vez fica livre quando ele a encerra.
 *
 * O combate só acrescenta a iniciativa, rolada ao entrar no encontro: um d6
 * pelo grupo inteiro e um d6 do Mestre pelos dele. O lado que tirou mais age
 * primeiro, todo ele, e depois o outro; no empate, o grupo. A ordem dos lados
 * vale para o encontro inteiro.
 *
 * Quem gravou a vez foi o banco (migração 022), e é ele quem recusa uma vez
 * fora de hora. Aqui a mesma regra é lida para a tela mostrar o botão certo
 * — `turn_side` e `close_round_if_done` lá, `combatTurn` aqui. As duas têm de
 * concordar.
 */

/** Um lado da mesa: o grupo ('pc') ou os do Mestre ('npc'). */
export type Side = ActorSource

/** A chave pela qual a vez conhece alguém: o PC pelo personagem, o NPC pela linha da trilha. */
export const pcKey = (characterId: string) => `pc:${characterId}`
export const npcKey = (actorId: string) => `npc:${actorId}`

export function actorKey(actor: EncounterActor): string {
  return actor.source === 'pc' && actor.refId ? pcKey(actor.refId) : npcKey(actor.id)
}

/** A linha `session_turns` da mesa. */
export interface TurnLedger {
  /** Quem está agindo; nulo com a vez livre. */
  actingKey: string | null
  actingName: string | null
  /** Quem já agiu nesta rodada. */
  acted: string[]
}

export interface TurnLedgerRow {
  session_id: string
  acting_key: string | null
  acting_name: string | null
  acted: string[] | null
}

export const NO_TURNS: TurnLedger = { actingKey: null, actingName: null, acted: [] }

export function rowToLedger(row: TurnLedgerRow | null | undefined): TurnLedger {
  if (!row) return NO_TURNS
  return {
    actingKey: row.acting_key,
    actingName: row.acting_name,
    acted: Array.isArray(row.acted) ? row.acted : [],
  }
}

/** Quem age primeiro: o d6 maior; no empate, o grupo. Nulo enquanto falta um dos dados. */
export function sideOrder(encounter: Encounter): Side[] | null {
  const { pcInitiative: pc, npcInitiative: npc } = encounter
  if (pc == null || npc == null) return null
  return pc >= npc ? ['pc', 'npc'] : ['npc', 'pc']
}

export type CombatTurn =
  | { stage: 'initiative' }
  | {
      stage: 'turns'
      order: Side[]
      round: number
      /** O lado que tem a vez; nulo só quando não há ninguém de pé. */
      side: Side | null
      acted: ReadonlySet<string>
      actingKey: string | null
    }

/** O primeiro lado, na ordem, com alguém de pé que ainda não agiu. */
function pendingSide(order: Side[], actors: EncounterActor[], acted: ReadonlySet<string>): Side | null {
  return order.find(side => actors.some(a => a.source === side && !a.defeated && !acted.has(actorKey(a)))) ?? null
}

/**
 * Onde o combate está: rolando a iniciativa, ou numa rodada — e, nela, de
 * qual lado é a vez.
 *
 * Quando todo mundo de pé já agiu e ninguém virou a rodada (o último goblin
 * saiu da trilha), a tela já mostra a seguinte: é ela que o banco abre na
 * próxima vez assumida.
 */
export function combatTurn(encounter: Encounter, actors: EncounterActor[], ledger: TurnLedger): CombatTurn {
  const order = sideOrder(encounter)
  if (!order) return { stage: 'initiative' }

  let acted: ReadonlySet<string> = new Set(ledger.acted)
  let round = encounter.round
  let side = pendingSide(order, actors, acted)

  if (!ledger.actingKey && side === null) {
    const fresh = new Set<string>()
    const next = pendingSide(order, actors, fresh)
    if (next) {
      acted = fresh
      round += 1
      side = next
    }
  }

  return { stage: 'turns', order, round, side, acted, actingKey: ledger.actingKey }
}

/**
 * Como alguém está em relação à vez.
 *
 *   acting   é ele quem está agindo
 *   ready    pode assumir a vez agora
 *   waiting  ainda age nesta rodada, mas não agora: alguém está agindo, a
 *            vez é do outro lado, ou a iniciativa não foi rolada
 *   done     já agiu nesta rodada
 *   out      não tem vez: fora de combate, ou fora da trilha
 */
export type TurnStatus = 'acting' | 'ready' | 'waiting' | 'done' | 'out'

export function combatStatus(turn: CombatTurn, actor: EncounterActor | undefined): TurnStatus {
  if (!actor) return 'out'
  if (turn.stage === 'initiative') return actor.defeated ? 'out' : 'waiting'
  const key = actorKey(actor)
  if (turn.actingKey === key) return 'acting'
  if (actor.defeated) return 'out'
  if (turn.acted.has(key)) return 'done'
  if (turn.actingKey !== null || turn.side !== actor.source) return 'waiting'
  return 'ready'
}

/** Na exploração só o grupo tem vez, e a rodada passa quando o Mestre a passa. */
export function explorationStatus(ledger: TurnLedger, key: string, out: boolean): TurnStatus {
  if (ledger.actingKey === key) return 'acting'
  if (out) return 'out'
  if (ledger.acted.includes(key)) return 'done'
  if (ledger.actingKey !== null) return 'waiting'
  return 'ready'
}

/**
 * A trilha na ordem em que a rodada anda: os lados na ordem dos d6 (o grupo
 * antes, enquanto falta um dado) e, dentro de cada lado, a ordem de entrada.
 */
export function trackOrder(encounter: Encounter, actors: EncounterActor[]): EncounterActor[] {
  const order = sideOrder(encounter) ?? ['pc', 'npc']
  return [...actors].sort((a, b) =>
    a.source !== b.source ? order.indexOf(a.source) - order.indexOf(b.source) : a.sortKey - b.sortKey,
  )
}

/** O próximo do lado que ainda não agiu, na ordem de entrada: o "▸" do Mestre na vez dos dele. */
export function nextUp(turn: CombatTurn, actors: EncounterActor[], side: Side): EncounterActor | undefined {
  if (turn.stage !== 'turns') return undefined
  return actors
    .filter(a => a.source === side && !a.defeated && !turn.acted.has(actorKey(a)))
    .sort((a, b) => a.sortKey - b.sortKey)[0]
}

/**
 * A vez deste lado já passou nesta rodada. Quem chega à trilha agora — o
 * reforço, o jogador atrasado — espera a rodada seguinte, em vez de reabrir
 * a vez do lado dele no meio da do outro.
 */
export function sideDone(turn: CombatTurn, side: Side): boolean {
  if (turn.stage !== 'turns') return false
  if (turn.side === null) return true
  return turn.order.indexOf(side) < turn.order.indexOf(turn.side)
}

/** "o grupo" / "os inimigos", para as frases da mesa. */
export function sideName(side: Side): string {
  return side === 'pc' ? 'o grupo' : 'os inimigos'
}
