import type { ActiveCondition } from './character.types'

/**
 * O encontro: o runtime que faltava.
 *
 * Os NPCs eram fichas estáticas de consulta — três goblins do mesmo statblock
 * com vidas diferentes viviam num papel ao lado do teclado. Aqui cada um vira
 * um **ator** com HP próprio, e a trilha de turnos é a mesma para o Mestre e
 * para a mesa.
 */

export type EncounterStatus = 'active' | 'ended'
export type ActorSource = 'pc' | 'npc'

export interface EncounterRow {
  id: string
  session_id: string
  name: string
  round: number
  active_actor_id: string | null
  status: EncounterStatus
  created_at: string
  ended_at: string | null
}

export interface EncounterActorRow {
  id: string
  encounter_id: string
  source: ActorSource
  ref_id: string | null
  name: string
  hp_current: number | null
  hp_max: number | null
  ac: number | null
  atk_bonus: number | null
  damage_die: string | null
  initiative: number | null
  conditions: ActiveCondition[]
  defeated: boolean
  sort_key: number
  created_at: string
}

export interface Encounter {
  id: string
  sessionId: string
  name: string
  round: number
  /** De quem é a vez. Nulo antes de a trilha começar a andar. */
  activeActorId: string | null
  status: EncounterStatus
  createdAt: string
}

export interface EncounterActor {
  id: string
  encounterId: string
  source: ActorSource
  /** O personagem ou o NPC de origem. */
  refId: string | null
  name: string
  /**
   * Só para NPCs. O PC lê vida e CA da própria ficha — duas verdades sobre o
   * mesmo HP é exatamente o defeito que a Fase 0 passou limpando.
   */
  hpCurrent: number | null
  hpMax: number | null
  ac: number | null
  /** O ataque do statblock, copiado quando o NPC entrou na trilha. */
  atkBonus: number | null
  damageDie: string | null
  /** Nulo enquanto não rolou; quem não rolou fica no fim da trilha. */
  initiative: number | null
  conditions: ActiveCondition[]
  defeated: boolean
  sortKey: number
}

export function rowToEncounter(row: EncounterRow): Encounter {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    round: row.round,
    activeActorId: row.active_actor_id,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function rowToActor(row: EncounterActorRow): EncounterActor {
  return {
    id: row.id,
    encounterId: row.encounter_id,
    source: row.source,
    refId: row.ref_id,
    name: row.name,
    hpCurrent: row.hp_current,
    hpMax: row.hp_max,
    ac: row.ac,
    atkBonus: row.atk_bonus,
    damageDie: row.damage_die,
    initiative: row.initiative,
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    defeated: row.defeated,
    sortKey: row.sort_key,
  }
}

/**
 * A ordem da trilha: maior iniciativa primeiro, e quem ainda não rolou vai
 * para o fim — ninguém perde a vez por ter demorado a pegar o celular. Empate
 * desempata pela ordem de entrada, que é estável entre os dois lados da mesa.
 */
export function turnOrder(actors: EncounterActor[]): EncounterActor[] {
  return [...actors].sort((a, b) => {
    if (a.initiative == null && b.initiative == null) return a.sortKey - b.sortKey
    if (a.initiative == null) return 1
    if (b.initiative == null) return -1
    if (b.initiative !== a.initiative) return b.initiative - a.initiative
    return a.sortKey - b.sortKey
  })
}

/** Quem age depois deste, pulando quem já caiu. Volta ao começo no fim da rodada. */
export function nextTurn(
  actors: EncounterActor[],
  activeActorId: string | null,
): { actorId: string | null; wrapped: boolean } {
  const order = turnOrder(actors).filter(a => !a.defeated)
  if (order.length === 0) return { actorId: null, wrapped: false }

  const at = order.findIndex(a => a.id === activeActorId)
  // Sem vez definida — ou a vez era de quem acabou de cair — a trilha recomeça
  // do topo, e isso não conta como rodada nova.
  if (at === -1) return { actorId: order[0].id, wrapped: false }

  const next = at + 1
  return next >= order.length
    ? { actorId: order[0].id, wrapped: true }
    : { actorId: order[next].id, wrapped: false }
}
