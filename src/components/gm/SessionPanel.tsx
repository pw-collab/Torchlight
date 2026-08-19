'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PlayerCard, type GmAction } from './PlayerCard'
import { PromptComposer, type PromptRequest } from './PromptComposer'
import { SessionFeed } from './SessionFeed'
import { STAT_LABELS } from '@/data/stats'
import { StatBlock } from '@/components/sheet/StatBlock'
import { Spells } from '@/components/sheet/Spells'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import { brightest, snuff } from '@/lib/light'
import { recordEvent } from '@/lib/sessionEvents'
import type { SessionEvent, SessionEventKind } from '@/types/session.types'
import { useSessionFeed } from '@/hooks/useSessionFeed'
import { useSessionPresence } from '@/hooks/useSessionPresence'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  sessionId: string
  gmName: string
  gmId: string
}

/** Um lugar na mesa: o personagem e de quem ele é. */
interface Seat {
  character: Character
  playerName: string | null
}

interface MemberRow {
  character_id: string
  player_name: string | null
  joined_at: string
  characters: CharacterRow | null
}

/** Uma mesa vazia é sempre o mesmo array — um literal novo a cada render faria
    todo callback que depende do elenco se recriar sozinho. */
const NO_SEATS: Seat[] = []

/** As colunas numéricas que o desfazer sabe escrever de volta. */
type UndoField = 'hp_current' | 'luck_tokens' | 'xp'

interface Undoable {
  characterId: string
  characterName: string
  kind: 'hp' | 'luck' | 'xp'
  field: UndoField
  previous: number
  applied: number
}

const UNDO_WINDOW_MS = 30_000

const UNDO_LABEL: Record<'hp' | 'luck' | 'xp', string> = {
  hp: 'vida',
  luck: 'Fortuna',
  xp: 'XP',
}

/**
 * A mesa acontecendo.
 *
 * O painel filtrava `characters.session_id`, um campo que nada escrevia, e por
 * isso ficava permanentemente vazio em produção. Agora o elenco vem de
 * `session_members` — quem entrou pelo código — e cada card é operável: o
 * Mestre aplica dano, concede Fortuna e XP e apaga a luz de quem quiser, e
 * cada ação vira linha do log que o jogador vê chegar na ficha dele.
 */
export function SessionPanel({ sessionId, gmName, gmId }: Props) {
  // O elenco vem sempre acompanhado da mesa a que pertence, para o painel não
  // mostrar o elenco da sessão anterior por um quadro enquanto recarrega.
  const [roster, setRoster] = useState<{ sessionId: string | null; seats: Seat[] }>({
    sessionId: null,
    seats: [],
  })
  const [reloadToken, setReloadToken] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [composing, setComposing] = useState(false)

  const loaded = roster.sessionId === sessionId
  const seats = loaded ? roster.seats : NO_SEATS
  const loading = !loaded

  const setSeats = useCallback(
    (update: (previous: Seat[]) => Seat[]) =>
      setRoster(prev => (prev.sessionId === sessionId ? { ...prev, seats: update(prev.seats) } : prev)),
    [sessionId],
  )

  // ── Desfazer (§5.3) ───────────────────────────────────────────────────────
  const [undoable, setUndoable] = useState<Undoable | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const offerUndo = useCallback((entry: Undoable) => {
    setUndoable(entry)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndoable(null), UNDO_WINDOW_MS)
  }, [])

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  const { events, loading: feedLoading } = useSessionFeed(sessionId)

  const gmIdentity = useMemo(
    () => ({ key: `gm:${gmId}`, name: gmName, role: 'gm' as const }),
    [gmId, gmName],
  )
  const { presentCharacterIds } = useSessionPresence(sessionId, gmIdentity)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase
      .from('session_members')
      .select('character_id, player_name, joined_at, characters(*)')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        const rows = (data ?? []) as unknown as MemberRow[]
        setRoster({
          sessionId,
          seats: rows
            .filter(row => row.characters)
            .map(row => ({
              character: rowToCharacter(row.characters as CharacterRow),
              playerName: row.player_name,
            })),
        })
      })

    return () => { cancelled = true }
  }, [sessionId, reloadToken])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`session:${sessionId}`)
      // As fichas mudam o tempo todo — pelo jogador ou por aqui.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `session_id=eq.${sessionId}` },
        payload => {
          const updated = rowToCharacter(payload.new as CharacterRow)
          setSeats(prev =>
            prev.map(seat => (seat.character.id === updated.id ? { ...seat, character: updated } : seat)),
          )
        },
      )
      // Entrar e sair mexe no elenco; a linha nova não traz o personagem junto,
      // então vale recarregar em vez de remendar o estado.
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_members', filter: `session_id=eq.${sessionId}` },
        () => setReloadToken(token => token + 1),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, setSeats])

  /**
   * Escreve na ficha e conta à mesa. As duas coisas, sempre juntas: uma ação do
   * Mestre que o jogador não vê chegar é exatamente o que não pode acontecer.
   *
   * A escrita devolve a linha e o card é atualizado com ela, em vez de esperar
   * o Realtime dar a volta — senão o Mestre clica duas vezes achando que não
   * pegou.
   */
  const act = useCallback(async (character: Character, action: GmAction) => {
    const supabase = createClient()
    const common = { sessionId, actorName: gmName, characterId: character.id }
    const named = { characterName: character.name, by: 'gm' as const }

    let patch: Record<string, unknown> | null = null
    let event: { kind: SessionEventKind; payload: Record<string, unknown> } | null = null
    /** A coluna que o desfazer teria de escrever de volta; nula quando não há volta. */
    let undoField: UndoField | null = null

    if (action.type === 'hp') {
      const from = character.hpCurrent
      const to = Math.max(0, Math.min(character.hpMax, from + action.delta))
      if (to !== from) {
        patch = { hp_current: to }
        event = { kind: 'hp', payload: { from, to, delta: to - from, ...named } }
        undoField = 'hp_current'
      }
    } else if (action.type === 'luck') {
      const from = character.luckTokens
      const to = Math.max(0, from + action.delta)
      if (to !== from) {
        patch = { luck_tokens: to }
        event = { kind: 'luck', payload: { from, to, delta: to - from, ...named } }
        undoField = 'luck_tokens'
      }
    } else if (action.type === 'xp') {
      const from = character.xp
      const to = Math.max(0, from + action.delta)
      if (to !== from) {
        patch = { xp: to }
        event = { kind: 'xp', payload: { from, to, delta: to - from, ...named } }
        undoField = 'xp'
      }
    } else if (action.type === 'snuff') {
      const burning = brightest(character.inventory)
      if (burning) {
        const doused: InventoryItem[] = character.inventory.map(item => snuff(item))
        patch = { equipment: doused }
        event = { kind: 'light', payload: { action: 'out', itemName: burning.name, ...named } }
      }
    } else if (action.type === 'condition') {
      // O mesmo gesto nos dois sentidos: marcar de novo o que já está em vigor
      // é tirar.
      const already = character.conditions.some(c => c.id === action.condition.id)
      const next = already
        ? character.conditions.filter(c => c.id !== action.condition.id)
        : [...character.conditions, {
            ...action.condition,
            appliedBy: gmName,
            appliedAt: new Date().toISOString(),
          }]
      patch = { conditions: next }
      event = {
        kind: 'condition',
        payload: {
          action: already ? 'removed' : 'applied',
          label: action.condition.label,
          ...(action.condition.note && { note: action.condition.note }),
          ...named,
        },
      }
    }

    if (!patch || !event) return

    setBusyId(character.id)
    const { data, error } = await supabase
      .from('characters')
      .update(patch)
      .eq('id', character.id)
      .select()
      .single()
    setBusyId(null)

    if (error) {
      console.error('[SessionPanel] a ficha não aceitou a mudança', error)
      return
    }
    if (data) {
      const updated = rowToCharacter(data as CharacterRow)
      setSeats(prev => prev.map(s => (s.character.id === updated.id ? { ...s, character: updated } : s)))
    }
    void recordEvent({ ...common, kind: event.kind, payload: event.payload })

    // O erro mais comum de qualquer VTT é aplicar dano no alvo errado ou
    // digitar 17 em vez de 7. Com o antes e o depois já no log, oferecer a
    // volta é quase de graça — e o log é append-only, então desfazer escreve
    // de volta em vez de apagar: o erro fica registrado, e a correção também.
    if (undoField) {
      const p = event.payload as { from: number; to: number }
      offerUndo({
        characterId: character.id,
        characterName: character.name,
        kind: event.kind as 'hp' | 'luck' | 'xp',
        field: undoField,
        previous: p.from,
        applied: p.to,
      })
    }
  }, [sessionId, gmName, setSeats, offerUndo])

  /** Escreve o valor anterior de volta e registra a correção. */
  const undo = useCallback(async () => {
    if (!undoable) return
    const supabase = createClient()
    setBusyId(undoable.characterId)

    const { data } = await supabase
      .from('characters')
      .update({ [undoable.field]: undoable.previous })
      .eq('id', undoable.characterId)
      .select()
      .single()

    setBusyId(null)
    setUndoable(null)
    if (undoTimer.current) clearTimeout(undoTimer.current)

    if (data) {
      const updated = rowToCharacter(data as CharacterRow)
      setSeats(prev => prev.map(s => (s.character.id === updated.id ? { ...s, character: updated } : s)))
    }

    void recordEvent({
      sessionId,
      actorName: gmName,
      characterId: undoable.characterId,
      kind: undoable.kind,
      payload: {
        from: undoable.applied,
        to: undoable.previous,
        delta: undoable.previous - undoable.applied,
        characterName: undoable.characterName,
        by: 'gm',
        undo: true,
      },
    })
  }, [undoable, sessionId, gmName, setSeats])

  /**
   * Revela à mesa uma rolagem que estava escondida (§6.7). O log é
   * append-only: revelar publica uma segunda linha apontando para a primeira,
   * em vez de mexer no que já foi escrito.
   */
  const reveal = useCallback((event: SessionEvent) => {
    void recordEvent({
      sessionId,
      actorName: event.actorName,
      characterId: event.characterId,
      kind: 'roll',
      payload: { ...(event.payload as Record<string, unknown>), revealOf: event.id },
      visibility: 'table',
    })
  }, [sessionId])

  /** XP para a mesa inteira — o fim de uma cena vale para todo mundo. */
  const grantXpToAll = useCallback(async () => {
    for (const seat of seats) await act(seat.character, { type: 'xp', delta: 1 })
  }, [seats, act])

  /**
   * "Todos, CON DC 12 contra o gás" (§6.4): uma linha de pedido por
   * personagem, todas com o mesmo `promptId`. Cada ficha vê a sua e responde
   * com uma rolagem que carrega esse id de volta — é assim que o painel sabe
   * quem já respondeu, sem estado para dessincronizar.
   */
  const sendPrompt = useCallback((request: PromptRequest) => {
    const promptId = crypto.randomUUID()
    const attributeLabel = request.attribute ? STAT_LABELS[request.attribute] : 'd20'

    for (const characterId of request.characterIds) {
      const seat = seats.find(s => s.character.id === characterId)
      void recordEvent({
        sessionId,
        actorName: gmName,
        characterId,
        kind: 'prompt',
        payload: {
          promptId,
          attribute: request.attribute,
          dc: request.dc,
          label: request.label || `Teste de ${attributeLabel}`,
          secret: request.secret,
          characterName: seat?.character.name,
          by: 'gm',
        },
      })
    }
  }, [seats, sessionId, gmName])

  const expanded = expandedId ? seats.find(s => s.character.id === expandedId) : null
  const presentCount = seats.filter(s => presentCharacterIds.has(s.character.id)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-heading text-[9px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          {loading
            ? 'Consultando o elenco...'
            : seats.length === 0
              ? 'Mesa vazia'
              : `${presentCount} de ${seats.length} aventureiro${seats.length === 1 ? '' : 's'} presente${presentCount === 1 ? '' : 's'}`}
        </span>

        {seats.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setComposing(c => !c)}
              className="font-heading h-8 min-h-8 rounded-[1px] border-[var(--primary)] px-2.5 text-[8.5px] tracking-[0.12em] uppercase"
            >
              ❔ Pedir rolagem
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void grantXpToAll()}
              disabled={busyId !== null}
              title="Conceder 1 de experiência a todos os personagens da mesa"
              className="font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase"
            >
              +1 XP a todos
            </Button>
          </div>
        )}
      </div>

      {undoable && (
        <div
          className="animate-ink-spread flex items-center gap-3 px-3 py-2"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--muted-foreground)',
            borderLeftWidth: 3,
          }}
        >
          <span className="font-body flex-1 text-[11px] text-[var(--muted-foreground)] italic">
            {undoable.characterName}: {UNDO_LABEL[undoable.kind]} {undoable.previous} → {undoable.applied}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => void undo()}
            disabled={busyId !== null}
            className="font-heading h-8 min-h-8 shrink-0 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase"
          >
            ↩ Desfazer
          </Button>
        </div>
      )}

      {composing && (
        <PromptComposer
          seats={seats.map(s => ({ id: s.character.id, name: s.character.name }))}
          onSend={sendPrompt}
          onClose={() => setComposing(false)}
        />
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {seats.map(seat => (
          <PlayerCard
            key={seat.character.id}
            character={seat.character}
            playerName={seat.playerName}
            present={presentCharacterIds.has(seat.character.id)}
            expanded={expandedId === seat.character.id}
            busy={busyId === seat.character.id}
            onToggle={() => setExpandedId(expandedId === seat.character.id ? null : seat.character.id)}
            onAct={action => void act(seat.character, action)}
          />
        ))}

        {!loading && seats.length === 0 && (
          <p className="col-span-full text-xs text-[var(--muted-foreground)] italic">
            Nenhum aventureiro entrou ainda. Passe o código da sessão para a mesa —
            cada jogador entra pela própria ficha.
          </p>
        )}
      </div>

      {expanded && (
        <Card className="worn-border animate-ink-spread gap-3.5 border-t-2 border-t-[var(--border)] bg-[var(--card)] px-5 py-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
          <CardHeader className="flex-row items-center justify-between px-0">
            <CardTitle className="font-heading text-lg font-bold tracking-[0.04em] text-[var(--foreground)]">
              {expanded.character.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpandedId(null)}
              aria-label="Fechar detalhes"
              className="font-mono text-xs text-[var(--muted-foreground)]"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 px-0">
            <StatBlock stats={expanded.character.stats} />
            {expanded.character.spells.length > 0 && (
              <Spells classId={expanded.character.classId} equippedSpells={expanded.character.spells} />
            )}
          </CardContent>
        </Card>
      )}

      <SessionFeed events={events} loading={feedLoading} onReveal={reveal} />
    </div>
  )
}
