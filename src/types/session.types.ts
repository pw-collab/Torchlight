/**
 * A mesa: quem está nela e o que aconteceu.
 *
 * A sessão deixou de ser um nome com uma flag (migração 015). Ela tem um
 * código pelo qual se entra, um elenco (`session_members`) e um log
 * append-only (`session_events`) — é desse log que saem o feed ao vivo, o
 * histórico que sobrevive ao refresh e, adiante, o recap e o desfazer.
 */

// ─── Sessão ───────────────────────────────────────────────────────────────────

export interface SessionRow {
  id: string
  name: string
  code: string
  gm_id: string
  active: boolean
  created_at: string
  ended_at?: string | null
  /** O relógio da masmorra — ver `lib/dungeonClock`. */
  paused_at?: string | null
  clock_shift_seconds?: number | null
}

export interface TableSession {
  id: string
  name: string
  /** Os seis caracteres que o jogador digita para entrar. */
  code: string
  gmId: string
  active: boolean
  createdAt: string
  /** Preenchido enquanto o tempo da mesa está parado. */
  pausedAt: string | null
  /** O quanto a mesa corre à frente do relógio de parede, em segundos. */
  shiftSeconds: number
}

export function rowToSession(row: SessionRow): TableSession {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    gmId: row.gm_id,
    active: row.active,
    createdAt: row.created_at,
    pausedAt: row.paused_at ?? null,
    shiftSeconds: row.clock_shift_seconds ?? 0,
  }
}

// ─── Elenco ───────────────────────────────────────────────────────────────────

export interface SessionMemberRow {
  session_id: string
  character_id: string
  user_id: string
  player_name: string | null
  joined_at: string
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

export type SessionEventKind =
  | 'roll'
  | 'hp'
  | 'luck'
  | 'xp'
  | 'light'
  | 'note'
  | 'session'
  | 'condition'
  | 'prompt'
  | 'encounter'

export type EventVisibility = 'table' | 'gm_only'

/** Uma rolagem como ela chega ao feed — o `RollResult` menos o que só o motor 3D usa. */
export interface RollPayload {
  label: string
  subLabel?: string
  die: string
  result: number
  total: number
  modifier?: number
  isCritical?: boolean
  isFumble?: boolean
  rolls?: number[]
  dc?: number
  success?: boolean
  characterName?: string
  /** Responde a uma rolagem que o Mestre pediu (§6.4). */
  promptId?: string
  /** Rerrolagem paga com Fortuna: o total que ficou para trás (§5.2). */
  rerollOf?: number
  /** Este evento revela uma rolagem que estava escondida (§6.7). */
  revealOf?: string
}

/** Uma rolagem que o Mestre pediu e ainda espera resposta. */
export interface PromptPayload {
  /** O mesmo em todas as fichas quando o pedido é para a mesa inteira. */
  promptId: string
  /** Atributo do teste — `null` para uma rolagem crua de d20. */
  attribute: string | null
  label: string
  dc: number
  /** Só quem rolou e o Mestre veem o resultado. */
  secret?: boolean
  characterName?: string
  /** Sempre o Mestre — é o que faz o pedido virar aviso na tela do jogador. */
  by?: 'gm'
}

export interface ConditionPayload {
  action: 'applied' | 'removed'
  label: string
  note?: string
  characterName?: string
  by?: 'gm' | 'player'
}

/**
 * Uma mudança de número na ficha: PV, Fortuna ou XP. Guarda o antes e o
 * depois, não só a diferença — é o que torna o "desfazer" (§5.3) possível
 * sem adivinhação.
 */
export interface VitalsPayload {
  from: number
  to: number
  delta: number
  characterName?: string
  /** Quem mexeu. O jogador vê um aviso quando a mudança não partiu dele. */
  by?: 'gm' | 'player'
  /**
   * Este evento desfaz outro. O log é append-only, então desfazer é escrever de
   * volta — o erro continua registrado, e a correção também (§5.3).
   */
  undo?: boolean
  /** De onde veio a mudança, quando não foi um ajuste solto. */
  reason?: 'rest'
  /** O dado da recuperação, quando `reason` é descanso (§5.7). */
  die?: string
  roll?: number
  /** O descanso consumiu uma ração. */
  ration?: boolean
}

export interface LightPayload {
  action: 'lit' | 'out'
  itemName?: string
  minutesLeft?: number
  characterName?: string
  by?: 'gm' | 'player'
}

export interface SessionPayload {
  action: 'join' | 'leave' | 'start' | 'end'
  characterName?: string
  sessionName?: string
}

export interface NotePayload {
  text: string
}

/** O que acontece na trilha de turnos (§6.5). */
export interface EncounterPayload {
  action: 'start' | 'end' | 'turn' | 'round' | 'down' | 'attack'
  encounterName?: string
  /** De quem é a vez, ou quem caiu. */
  actorName?: string
  round?: number
  /** Ataque: o alvo e o veredito contra a CA dele (§6.6). */
  targetName?: string
  hit?: boolean
  ac?: number
  total?: number
  characterName?: string
}

export type EventPayload =
  | RollPayload
  | EncounterPayload
  | PromptPayload
  | ConditionPayload
  | VitalsPayload
  | LightPayload
  | SessionPayload
  | NotePayload
  | Record<string, unknown>

export interface SessionEventRow {
  id: string
  session_id: string
  actor_name: string
  character_id: string | null
  kind: SessionEventKind
  payload: EventPayload
  visibility: EventVisibility
  created_at: string
}

export interface SessionEvent {
  id: string
  sessionId: string
  actorName: string
  characterId: string | null
  kind: SessionEventKind
  payload: EventPayload
  visibility: EventVisibility
  createdAt: string
  /** `createdAt` em milissegundos — o que os toasts e a ordenação usam. */
  at: number
}

export function rowToEvent(row: SessionEventRow): SessionEvent {
  return {
    id: row.id,
    sessionId: row.session_id,
    actorName: row.actor_name,
    characterId: row.character_id,
    kind: row.kind,
    payload: row.payload ?? {},
    visibility: row.visibility,
    createdAt: row.created_at,
    at: new Date(row.created_at).getTime(),
  }
}
