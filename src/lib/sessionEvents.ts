import { createClient } from '@/lib/supabase'
import type { RollResult } from '@/lib/dice'
import type {
  ConditionPayload,
  EventPayload,
  EventVisibility,
  LightPayload,
  NotePayload,
  PromptPayload,
  RollPayload,
  SessionEvent,
  SessionEventKind,
  SessionPayload,
  VitalsPayload,
} from '@/types/session.types'

// ─── Escrita ──────────────────────────────────────────────────────────────────

export interface EventInput {
  sessionId: string
  actorName: string
  characterId?: string | null
  kind: SessionEventKind
  payload: EventPayload
  visibility?: EventVisibility
}

/**
 * Registra um acontecimento da mesa.
 *
 * Nunca lança: o log é uma testemunha, não um guarda. Se a escrita falhar — a
 * rede caiu, o personagem não está em mesa nenhuma — a rolagem já aconteceu na
 * tela de quem rolou, e é isso que importa. O erro vai para o console para não
 * sumir de vez.
 */
export async function recordEvent(input: EventInput): Promise<void> {
  try {
    const supabase = createClient()
    const { error } = await supabase.from('session_events').insert({
      session_id: input.sessionId,
      actor_name: input.actorName,
      character_id: input.characterId ?? null,
      kind: input.kind,
      payload: input.payload,
      visibility: input.visibility ?? 'table',
    })
    if (error) console.error('[sessionEvents] falha ao registrar', input.kind, error)
  } catch (err) {
    console.error('[sessionEvents] falha ao registrar', input.kind, err)
  }
}

/** O `RollResult` reduzido ao que a mesa precisa ver. */
export function rollPayload(roll: RollResult, characterName?: string): RollPayload {
  return {
    label: roll.label,
    ...(roll.subLabel && { subLabel: roll.subLabel }),
    die: roll.die,
    result: roll.result,
    total: roll.total,
    ...(roll.modifier !== undefined && { modifier: roll.modifier }),
    ...(roll.isCritical && { isCritical: true }),
    ...(roll.isFumble && { isFumble: true }),
    ...(roll.rolls && { rolls: roll.rolls }),
    ...(roll.dc !== undefined && { dc: roll.dc, success: roll.success === true }),
    ...(roll.rerollOf !== undefined && { rerollOf: roll.rerollOf }),
    ...(roll.promptId && { promptId: roll.promptId }),
    ...(characterName && { characterName }),
  }
}

// ─── Leitura ──────────────────────────────────────────────────────────────────

/**
 * Os grupos do filtro do feed. O Mestre procura por natureza do acontecimento
 * — "quem rolou o quê", "quem está morrendo", "quem ainda tem luz" — e não por
 * `kind` cru, então PV, Fortuna e XP moram juntos em Vitalidade.
 */
export const FEED_FILTERS = [
  { id: 'all', label: 'Tudo', kinds: null },
  { id: 'roll', label: 'Rolagens', kinds: ['roll', 'prompt'] },
  { id: 'vitals', label: 'Vitalidade', kinds: ['hp', 'luck', 'xp', 'condition'] },
  { id: 'light', label: 'Luz', kinds: ['light'] },
  { id: 'table', label: 'Mesa', kinds: ['note', 'session'] },
] as const

export type FeedFilterId = (typeof FEED_FILTERS)[number]['id']

export function matchesFilter(event: SessionEvent, filter: FeedFilterId): boolean {
  const entry = FEED_FILTERS.find(f => f.id === filter)
  if (!entry?.kinds) return true
  return (entry.kinds as readonly string[]).includes(event.kind)
}

const SIGNED = (n: number) => (n > 0 ? `+${n}` : `${n}`)

/** Um pedido é respondido pela rolagem que carrega o mesmo `promptId`. */
function answerKey(promptId: string, characterId: string | null): string {
  return `${promptId}::${characterId ?? ''}`
}

function answeredKeys(events: SessionEvent[]): Set<string> {
  const keys = new Set<string>()
  for (const event of events) {
    if (event.kind !== 'roll') continue
    const promptId = (event.payload as RollPayload).promptId
    if (promptId) keys.add(answerKey(promptId, event.characterId))
  }
  return keys
}

/**
 * Os pedidos do Mestre que ainda esperam por este personagem (§6.4).
 *
 * O pedido e a resposta são duas linhas do mesmo log — não há tabela de
 * pendências, e não há estado para ficar dessincronizado: uma rolagem com o
 * mesmo `promptId` fecha o pedido, e é só isso.
 */
export function pendingPrompts(events: SessionEvent[], characterId: string): SessionEvent[] {
  const answered = answeredKeys(events)
  return events
    .filter(event => {
      if (event.kind !== 'prompt' || event.characterId !== characterId) return false
      return !answered.has(answerKey((event.payload as PromptPayload).promptId, characterId))
    })
    // Do mais antigo para o mais novo: responde-se na ordem em que foi pedido.
    .sort((a, b) => a.at - b.at)
}

/** Se o pedido daquela linha do feed já foi respondido — o Mestre quer saber quem falta. */
export function isPromptAnswered(events: SessionEvent[], prompt: SessionEvent): boolean {
  const promptId = (prompt.payload as PromptPayload).promptId
  if (!promptId) return true
  return answeredKeys(events).has(answerKey(promptId, prompt.characterId))
}

/** O nome que encabeça a linha: o personagem quando há um, senão quem agiu. */
export function eventActor(event: SessionEvent): string {
  const payload = event.payload as { characterName?: string }
  return payload.characterName ?? event.actorName
}

/**
 * A linha do feed em uma frase. Uma leitura só, sem precisar abrir nada — o
 * Mestre passa os olhos enquanto a mesa fala.
 */
export function eventHeadline(event: SessionEvent): string {
  const who = eventActor(event)

  switch (event.kind) {
    case 'roll': {
      const p = event.payload as RollPayload
      const verdict = p.dc !== undefined ? (p.success ? ' — sucesso' : ' — falha') : ''
      const verb = p.rerollOf !== undefined ? 'rerrolou' : 'rolou'
      const revealed = p.revealOf ? 'Revelado — ' : ''
      return `${revealed}${who} ${verb} ${p.label}: ${p.total}${verdict}`
    }
    case 'prompt': {
      const p = event.payload as PromptPayload
      const test = p.attribute ? `${p.attribute} DC ${p.dc}` : `DC ${p.dc}`
      return `O Mestre pediu ${test} de ${who}`
    }
    case 'condition': {
      const p = event.payload as ConditionPayload
      return p.action === 'applied'
        ? `${who} está ${p.label}`
        : `${who} não está mais ${p.label}`
    }
    case 'hp': {
      const p = event.payload as VitalsPayload
      if (p.undo) return `${who}: ajuste de vida desfeito`
      if (p.reason === 'rest') {
        return p.delta > 0
          ? `${who} descansou e recuperou ${p.delta} de vida`
          : `${who} descansou sem recuperar nada`
      }
      if (p.to <= 0) return `${who} caiu`
      return p.delta < 0
        ? `${who} sofreu ${Math.abs(p.delta)} de dano`
        : `${who} recuperou ${p.delta} de vida`
    }
    case 'luck': {
      const p = event.payload as VitalsPayload
      if (p.undo) return `${who}: ajuste de Fortuna desfeito`
      return p.delta < 0
        ? `${who} gastou ${Math.abs(p.delta)} de Fortuna`
        : `${who} recebeu ${p.delta} de Fortuna`
    }
    case 'xp': {
      const p = event.payload as VitalsPayload
      if (p.undo) return `${who}: ajuste de XP desfeito`
      return p.delta < 0
        ? `${who} perdeu ${Math.abs(p.delta)} XP`
        : `${who} ganhou ${p.delta} XP`
    }
    case 'light': {
      const p = event.payload as LightPayload
      const what = p.itemName ?? 'a luz'
      return p.action === 'lit'
        ? `${who} acendeu ${what}${p.minutesLeft ? ` — ${p.minutesLeft}min` : ''}`
        : `${who} ficou sem ${what}`
    }
    case 'note':
      return `${who}: ${(event.payload as NotePayload).text}`
    case 'session': {
      const p = event.payload as SessionPayload
      if (p.action === 'join') return `${who} entrou na mesa`
      if (p.action === 'leave') return `${who} saiu da mesa`
      if (p.action === 'start') return `A sessão começou`
      return `A sessão foi encerrada`
    }
    default:
      return `${who} — ${event.kind}`
  }
}

/** A segunda linha, quando há uma: os dados por trás do número. */
export function eventDetail(event: SessionEvent): string | null {
  switch (event.kind) {
    case 'roll': {
      const p = event.payload as RollPayload
      const parts: string[] = []
      const dice = p.rolls && p.rolls.length > 1 ? `${p.die}: ${p.rolls.join(', ')} → ${p.result}` : `${p.die}: ${p.result}`
      parts.push(dice)
      if (p.modifier) parts.push(SIGNED(p.modifier))
      if (p.dc !== undefined) parts.push(`DC ${p.dc}`)
      // Os dois resultados lado a lado: a Fortuna comprou esta segunda chance.
      if (p.rerollOf !== undefined) parts.push(`✦ antes ${p.rerollOf}`)
      return parts.join(' · ')
    }
    case 'prompt': {
      const p = event.payload as PromptPayload
      return p.secret ? 'só quem rolar e você' : 'a mesa vê o resultado'
    }
    case 'condition': {
      const p = event.payload as ConditionPayload
      const parts = [p.note, p.by === 'gm' ? 'pelo Mestre' : null].filter(Boolean)
      return parts.length > 0 ? parts.join(' · ') : null
    }
    case 'hp': {
      const p = event.payload as VitalsPayload
      const parts = [`PV ${p.from} → ${p.to}`]
      if (p.reason === 'rest' && p.die) parts.push(`${p.die}: ${p.roll}`)
      if (p.ration) parts.push('1 ração')
      if (p.by === 'gm') parts.push('pelo Mestre')
      return parts.join(' · ')
    }
    case 'luck':
    case 'xp': {
      const p = event.payload as VitalsPayload
      return `${p.from} → ${p.to}${p.by === 'gm' ? ' · pelo Mestre' : ''}`
    }
    case 'light': {
      const p = event.payload as LightPayload
      return p.by === 'gm' ? 'pelo Mestre' : null
    }
    default:
      return null
  }
}

/** A cor de destaque da linha — crítico, queda e falha crítica saltam do feed. */
export function eventAccent(event: SessionEvent): string | null {
  if (event.kind === 'roll') {
    const p = event.payload as RollPayload
    if (p.isCritical) return 'var(--chart-1)'
    if (p.isFumble) return 'var(--destructive)'
    if (p.dc !== undefined) return p.success ? 'var(--chart-2)' : 'var(--destructive)'
    return null
  }
  if (event.kind === 'hp') {
    const p = event.payload as VitalsPayload
    if (p.undo) return 'var(--muted-foreground)'
    if (p.to <= 0) return 'var(--destructive)'
    return p.delta < 0 ? 'var(--destructive)' : 'var(--chart-2)'
  }
  if (event.kind === 'light') {
    return (event.payload as LightPayload).action === 'lit' ? 'var(--chart-1)' : 'var(--destructive)'
  }
  if (event.kind === 'prompt') return 'var(--primary)'
  if (event.kind === 'condition') {
    return (event.payload as ConditionPayload).action === 'applied' ? 'var(--primary)' : null
  }
  return null
}

const KIND_GLYPH: Record<string, string> = {
  roll: '🎲',
  hp: '✚',
  luck: '✦',
  xp: '△',
  light: '🔥',
  note: '✎',
  session: '⚔',
  prompt: '❔',
  condition: '⚑',
}

export function eventGlyph(event: SessionEvent): string {
  if (event.kind === 'light' && (event.payload as LightPayload).action === 'out') return '🌑'
  return KIND_GLYPH[event.kind] ?? '·'
}
