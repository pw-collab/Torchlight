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
  pc_initiative: number | null
  npc_initiative: number | null
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
  /**
   * Os dois d6 da iniciativa: o do grupo, que um jogador rola por todos, e o
   * do Mestre, pelos dele. Nulo enquanto aquele lado não rolou. Quem age
   * agora não mora aqui, e sim na mesa (ver `lib/turns`): a vez continua
   * fora do combate.
   */
  pcInitiative: number | null
  npcInitiative: number | null
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
  conditions: ActiveCondition[]
  /**
   * Fora de combate. No NPC, a vida chegou a zero; no PC, o banco copia da
   * ficha (migração 022): morto, ou caído e estabilizado.
   */
  defeated: boolean
  sortKey: number
}

export function rowToEncounter(row: EncounterRow): Encounter {
  return {
    id: row.id,
    sessionId: row.session_id,
    name: row.name,
    round: row.round,
    pcInitiative: row.pc_initiative ?? null,
    npcInitiative: row.npc_initiative ?? null,
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
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    defeated: row.defeated,
    sortKey: row.sort_key,
  }
}
