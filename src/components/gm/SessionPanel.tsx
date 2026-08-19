'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PlayerCard, type GmAction } from './PlayerCard'
import { SessionFeed } from './SessionFeed'
import { StatBlock } from '@/components/sheet/StatBlock'
import { Spells } from '@/components/sheet/Spells'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import { brightest, snuff } from '@/lib/light'
import { recordEvent } from '@/lib/sessionEvents'
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

  const loaded = roster.sessionId === sessionId
  const seats = loaded ? roster.seats : NO_SEATS
  const loading = !loaded

  const setSeats = useCallback(
    (update: (previous: Seat[]) => Seat[]) =>
      setRoster(prev => (prev.sessionId === sessionId ? { ...prev, seats: update(prev.seats) } : prev)),
    [sessionId],
  )

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
    let event: { kind: 'hp' | 'luck' | 'xp' | 'light'; payload: Record<string, unknown> } | null = null

    if (action.type === 'hp') {
      const from = character.hpCurrent
      const to = Math.max(0, Math.min(character.hpMax, from + action.delta))
      if (to !== from) {
        patch = { hp_current: to }
        event = { kind: 'hp', payload: { from, to, delta: to - from, ...named } }
      }
    } else if (action.type === 'luck') {
      const from = character.luckTokens
      const to = Math.max(0, from + action.delta)
      if (to !== from) {
        patch = { luck_tokens: to }
        event = { kind: 'luck', payload: { from, to, delta: to - from, ...named } }
      }
    } else if (action.type === 'xp') {
      const from = character.xp
      const to = Math.max(0, from + action.delta)
      if (to !== from) {
        patch = { xp: to }
        event = { kind: 'xp', payload: { from, to, delta: to - from, ...named } }
      }
    } else if (action.type === 'snuff') {
      const burning = brightest(character.inventory)
      if (burning) {
        const doused: InventoryItem[] = character.inventory.map(item => snuff(item))
        patch = { equipment: doused }
        event = { kind: 'light', payload: { action: 'out', itemName: burning.name, ...named } }
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
  }, [sessionId, gmName, setSeats])

  /** XP para a mesa inteira — o fim de uma cena vale para todo mundo. */
  const grantXpToAll = useCallback(async () => {
    for (const seat of seats) await act(seat.character, { type: 'xp', delta: 1 })
  }, [seats, act])

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
        )}
      </div>

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

      <SessionFeed events={events} loading={feedLoading} />
    </div>
  )
}
