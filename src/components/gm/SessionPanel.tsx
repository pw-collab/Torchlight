'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { PromptRequest } from './PromptComposer'
import { HandoutDrawer, type Delivery } from './HandoutDrawer'
import { SessionRecap } from './SessionRecap'
import { SessionFeed } from './SessionFeed'
import { STAT_LABELS } from '@/data/stats'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import { brightest, snuff } from '@/lib/light'
import { advancedShift, resumeShift, tableNow, type TableClock } from '@/lib/dungeonClock'
import { serverNow } from '@/lib/serverClock'
import { changeCharacter } from '@/lib/characterWrite'
import { doubledDice, modifier, rollFormula, rollWithMode, withDc, type RollResult } from '@/lib/dice'
import { consumeRation, findRation, lostSpells, restoredStates } from '@/lib/rest'
import { describeGrant, treasureItem } from '@/lib/treasure'
import type { GmAction, Seat, TreasureGrant } from '@/lib/gmActions'
import { rowToSession, type RollPayload, type SessionRow, type TableSession } from '@/types/session.types'
import { recordEvent, rollPayload } from '@/lib/sessionEvents'
import { afterDeathRoll, dyingRounds, hpShift, mortalState, rollAgainstDeath, stabilize } from '@/lib/dying'
import type { SessionEvent, SessionEventKind } from '@/types/session.types'
import { useSessionFeed } from '@/hooks/useSessionFeed'
import { useSessionPresence } from '@/hooks/useSessionPresence'
import { useBestiary } from '@/hooks/useBestiary'
import { useCrawl } from '@/hooks/useCrawl'
import { useEncounterControls } from '@/hooks/useEncounterControls'
import { TableHud } from './table/TableHud'
import { CombatRibbon, ExplorationRibbon, actorKey, npcKey, pcKey } from './table/TurnRibbon'
import { FoeFigure, PartyFigure, type Callout } from './table/Figure'
import { Nameplate } from './table/Nameplate'
import { TableCommands, type TableView } from './table/TableCommands'
import { PcCommands } from './table/PcCommands'
import { FoeCommands } from './table/FoeCommands'
import { AttackOutcomeCard, TargetingBar, type AttackOutcome } from './table/Targeting'
import type { TableController, Targeting } from './table/controller'

interface Props {
  session: TableSession
  gmName: string
  gmId: string
  /** Devolve a sessão recarregada ao pai quando o relógio muda. */
  onSessionChange: (session: TableSession) => void
  /** As rolagens do Mestre: escondidas da mesa, com aviso na tela dele. */
  onRoll: (roll: RollResult) => void
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

/** Quantas rolagens de dano dos jogadores esperam alvo ao mesmo tempo, no máximo. */
const PENDING_DAMAGE = 3

type Resolved =
  | { kind: 'pc'; seat: Seat; name: string }
  | { kind: 'npc'; actor: import('@/types/encounter.types').EncounterActor; name: string }

type LogLine = { kind: SessionEventKind; payload: Record<string, unknown> }

/** What a GM action leaves to log, and the column an undo would reverse. */
interface Logged {
  event: LogLine
  extra: LogLine[]
  undoField: UndoField | null
}

function undoValue(character: Character, field: UndoField): number {
  if (field === 'hp_current') return character.hpCurrent
  if (field === 'luck_tokens') return character.luckTokens
  return character.xp
}

/**
 * A mesa do Mestre, jogada como um RPG de turno — sem tabuleiro.
 *
 * Em cima, o relógio da masmorra e a fila de turnos (de combate, ou das
 * rodadas de exploração). No meio, o palco: os inimigos de um lado e o grupo
 * do outro, cada um num card. Ao lado, o menu de comandos de quem está em
 * foco — a vez de quem é, ou o card que o Mestre clicou — e, abaixo dele, o
 * registro da mesa.
 *
 * Toda ação do Mestre passa por aqui: escreve na ficha ou na trilha e vira
 * linha do log, que o jogador vê chegar na tela dele.
 */
export function SessionPanel({ session, gmName, gmId, onSessionChange, onRoll }: Props) {
  const sessionId = session.id
  // O elenco vem sempre acompanhado da mesa a que pertence, para o painel não
  // mostrar o elenco da sessão anterior por um quadro enquanto recarrega.
  const [roster, setRoster] = useState<{ sessionId: string | null; seats: Seat[] }>({
    sessionId: null,
    seats: [],
  })
  const [reloadToken, setReloadToken] = useState(0)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [delivering, setDelivering] = useState(false)
  const [recapping, setRecapping] = useState(false)

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

    const clock: TableClock = { pausedAt: session.pausedAt, shiftSeconds: session.shiftSeconds }
    // Para quem está fora do app: o Mestre rola a vez do caído. Rolled once,
    // here: if the save has to be worked out again, it is the same roll.
    const startRounds = action.type === 'death-roll' ? dyingRounds(character.conditions) : null
    const deathRoll = startRounds !== null ? rollAgainstDeath(startRounds) : null

    /*
     * Worked out from the character as it stands when the save lands, not
     * from this card's copy: if the player saved in between, the change is
     * computed again from their row (see `changeCharacter`).
     */
    const compute = (c: Character): { patch: Record<string, unknown>; result: Logged } | null => {
      let patch: Record<string, unknown> = {}
      let event: LogLine | null = null
      /** O que mais a mesma ação conta ao log, depois da linha principal. */
      const extra: LogLine[] = []
      /** A coluna que o desfazer teria de escrever de volta; nula quando não há volta. */
      let undoField: UndoField | null = null

      if (action.type === 'hp') {
        const from = c.hpCurrent
        const to = Math.max(0, Math.min(c.hpMax, from + action.delta))
        if (to !== from) {
          patch = { hp_current: to }
          event = { kind: 'hp', payload: { from, to, delta: to - from, ...named } }
          undoField = 'hp_current'
          // O goblin que derruba alguém abre o relógio da morte daqui mesmo —
          // a regra é a mesma da ficha (lib/dying), então os dois lados concordam.
          const shift = hpShift(c.conditions, c.stats.con, from, to, gmName)
          if (shift) {
            patch.conditions = shift.conditions
            extra.push({ kind: 'condition', payload: { ...shift.event, ...named } })
          }
        }
      } else if (action.type === 'stabilize') {
        // Um aliado passou no INT DC 15 — quem rola é ele, na ficha dele; quem
        // marca o resultado é o Mestre, que é quem pode escrever nesta ficha.
        if (dyingRounds(c.conditions) !== null) {
          const stable = stabilize(c.conditions, gmName)
          patch = { conditions: stable.conditions }
          event = { kind: 'condition', payload: { ...stable.event, ...named } }
        }
      } else if (action.type === 'death-roll') {
        // Para quem está fora do app: o Mestre rola a vez do caído, com a mesma
        // regra que o botão da ficha usa.
        if (deathRoll && dyingRounds(c.conditions) !== null) {
          const roll = deathRoll
          const out = afterDeathRoll(c.conditions, roll, gmName)
          patch = { conditions: out.conditions }
          if (out.outcome === 'rise') patch.hp_current = 1
          event = { kind: 'roll', payload: { ...rollPayload(roll, c.name) } }
          if (out.outcome === 'rise') {
            extra.push({
              kind: 'hp',
              payload: { from: c.hpCurrent, to: 1, delta: 1 - c.hpCurrent, ...named },
            })
          }
          if (out.event) extra.push({ kind: 'condition', payload: { ...out.event, ...named } })
        }
      } else if (action.type === 'luck') {
        const from = c.luckTokens
        const to = Math.max(0, from + action.delta)
        if (to !== from) {
          patch = { luck_tokens: to }
          event = { kind: 'luck', payload: { from, to, delta: to - from, ...named } }
          undoField = 'luck_tokens'
        }
      } else if (action.type === 'xp') {
        const from = c.xp
        const to = Math.max(0, from + action.delta)
        if (to !== from) {
          patch = { xp: to }
          event = { kind: 'xp', payload: { from, to, delta: to - from, ...named } }
          undoField = 'xp'
        }
      } else if (action.type === 'snuff') {
        // The table's clock, as the player's sheet reads it: a torch put out
        // here banks exactly the minutes the table was showing.
        const now = tableNow(clock, serverNow())
        const burning = brightest(c.inventory, now)
        if (burning) {
          const doused: InventoryItem[] = c.inventory.map(item => snuff(item, now))
          patch = { equipment: doused }
          event = { kind: 'light', payload: { action: 'out', itemName: burning.name, ...named } }
        }
      } else if (action.type === 'condition') {
        // O mesmo gesto nos dois sentidos: marcar de novo o que já está em vigor
        // é tirar.
        const already = c.conditions.some(c => c.id === action.condition.id)
        const next = already
          ? c.conditions.filter(c => c.id !== action.condition.id)
          : [...c.conditions, {
              ...action.condition,
              appliedBy: gmName,
              appliedAt: new Date(serverNow()).toISOString(),
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
      } else if (action.type === 'treasure') {
        // Moedas e XP somam; o item entra na mochila como qualquer outro. O log
        // diz o que chegou, e o XP vai numa linha própria para o recap contar.
        const grant = action.grant
        if (grant.gold > 0) patch.gold = c.gold + grant.gold
        if (grant.silver > 0) patch.silver = c.silver + grant.silver
        if (grant.copper > 0) patch.copper = c.copper + grant.copper
        if (grant.item?.name.trim()) patch.equipment = [...c.inventory, treasureItem(grant.item)]
        if (grant.xp > 0) patch.xp = c.xp + grant.xp

        const xpLine: LogLine | null = grant.xp > 0
          ? { kind: 'xp', payload: { from: c.xp, to: c.xp + grant.xp, delta: grant.xp, ...named } }
          : null
        const text = describeGrant(grant)
        event = text ? { kind: 'note', payload: { text: `recebeu ${text}`, ...named } } : xpLine
        if (text && xpLine) extra.push(xpLine)
      } else if (action.type === 'rest') {
        // O grupo acampa: a mesma regra do botão da ficha, por personagem.
        const ration = findRation(c.inventory)
        const from = c.hpCurrent
        const to = ration ? Math.max(from, c.hpMax) : from
        const spellsBack = ration ? lostSpells(c.techniqueStates).length : 0
        if (ration) {
          patch.equipment = consumeRation(c.inventory, ration.id)
          patch.technique_states = restoredStates(c.techniqueStates)
        }
        if (to !== from) patch.hp_current = to
        const shift = to !== from ? hpShift(c.conditions, c.stats.con, from, to, gmName) : null
        if (shift) {
          patch.conditions = shift.conditions
          extra.push({ kind: 'condition', payload: { ...shift.event, ...named } })
        }
        event = {
          kind: 'hp',
          payload: {
            from, to, delta: to - from, reason: 'rest', ration: Boolean(ration),
            ...(spellsBack > 0 && { spells: spellsBack }),
            ...named,
          },
        }
      }

      if (!event) return null
      return { patch, result: { event, extra, undoField } }
    }

    const first = compute(character)
    if (!first) return

    let logged: Logged = first.result
    // Um descanso sem ração não escreve nada — mas ainda conta à mesa.
    if (Object.keys(first.patch).length > 0) {
      setBusyId(character.id)
      const outcome = await changeCharacter(supabase, character, c => {
        const next = compute(c)
        return next && Object.keys(next.patch).length > 0
          ? { patch: next.patch as Partial<CharacterRow>, result: next.result }
          : null
      })
      setBusyId(null)

      if (!outcome.ok) {
        if (outcome.reason !== 'unchanged') {
          console.error('[SessionPanel] a ficha não aceitou a mudança', outcome.reason, outcome.error)
        }
        return
      }
      const updated = outcome.character
      setSeats(prev => prev.map(s => (s.character.id === updated.id ? { ...s, character: updated } : s)))
      logged = outcome.result
    }
    const { event, extra, undoField } = logged

    void recordEvent({ ...common, kind: event.kind, payload: event.payload })
    for (const line of extra) void recordEvent({ ...common, kind: line.kind, payload: line.payload })

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
  }, [sessionId, gmName, setSeats, offerUndo, session.pausedAt, session.shiftSeconds])

  /** Escreve o valor anterior de volta e registra a correção. */
  const undo = useCallback(async () => {
    if (!undoable) return
    const supabase = createClient()
    const seat = seats.find(s => s.character.id === undoable.characterId)
    if (!seat) return
    setBusyId(undoable.characterId)

    const reversal = undoable.previous - undoable.applied
    const outcome = await changeCharacter(supabase, seat.character, c => {
      const from = undoValue(c, undoable.field)
      const to = undoable.field === 'hp_current'
        ? Math.max(0, Math.min(c.hpMax, from + reversal))
        : Math.max(0, from + reversal)
      if (to === from) return null
      const patch: Partial<CharacterRow> = { [undoable.field]: to }
      // Desfazer o dano que derrubou alguém tem de levantá-lo de novo — senão
      // a ficha volta a ter PV e continua "morrendo".
      const shift = undoable.field === 'hp_current'
        ? hpShift(c.conditions, c.stats.con, from, to, gmName)
        : null
      if (shift) patch.conditions = shift.conditions
      return { patch, result: { from, to, shift } }
    })

    setBusyId(null)
    setUndoable(null)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    if (!outcome.ok) return

    const updated = outcome.character
    setSeats(prev => prev.map(s => (s.character.id === updated.id ? { ...s, character: updated } : s)))

    void recordEvent({
      sessionId,
      actorName: gmName,
      characterId: undoable.characterId,
      kind: undoable.kind,
      payload: {
        from: outcome.result.from,
        to: outcome.result.to,
        delta: outcome.result.to - outcome.result.from,
        characterName: undoable.characterName,
        by: 'gm',
        undo: true,
      },
    })
    if (outcome.result.shift) {
      void recordEvent({
        sessionId,
        actorName: gmName,
        characterId: undoable.characterId,
        kind: 'condition',
        payload: { ...outcome.result.shift.event, characterName: undoable.characterName, by: 'gm' },
      })
    }
  }, [undoable, seats, sessionId, gmName, setSeats])

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

  // ── O relógio da masmorra (§5.1/§6.9) ─────────────────────────────────────
  // A luz de todo mundo é derivada do relógio, então tudo aqui é uma escrita só
  // na sessão — nenhuma ficha é tocada. Apagar tudo é a exceção, e é por isso
  // que ele passa pelo mesmo `act` de sempre, ficha por ficha.

  const updateClock = useCallback(async (
    patch: { paused_at?: string | null; clock_shift_seconds?: number },
    note: string,
  ) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('sessions')
      .update(patch)
      .eq('id', sessionId)
      .select()
      .single()

    if (data) onSessionChange(rowToSession(data as SessionRow))
    void recordEvent({ sessionId, actorName: gmName, kind: 'note', payload: { text: note } })
  }, [sessionId, gmName, onSessionChange])

  const togglePause = useCallback(() => {
    const clock: TableClock = { pausedAt: session.pausedAt, shiftSeconds: session.shiftSeconds }
    if (clock.pausedAt) {
      // Retomar desconta o tempo em que a mesa esteve parada: a tocha volta com
      // os minutos com que parou, em vez de dar um salto.
      void updateClock(
        { paused_at: null, clock_shift_seconds: resumeShift(clock) },
        'O tempo da mesa voltou a correr.',
      )
    } else {
      void updateClock({ paused_at: new Date().toISOString() }, 'O tempo da mesa parou.')
    }
  }, [session.pausedAt, session.shiftSeconds, updateClock])

  const advanceClock = useCallback((minutes: number) => {
    const clock: TableClock = { pausedAt: session.pausedAt, shiftSeconds: session.shiftSeconds }
    void updateClock(
      { clock_shift_seconds: advancedShift(clock, minutes) },
      `Um turno de exploração: ${minutes} minutos passaram.`,
    )
  }, [session.pausedAt, session.shiftSeconds, updateClock])

  /** A escuridão desce — uma escrita por ficha, e cada uma vira linha do log. */
  const snuffEveryLight = useCallback(async () => {
    for (const seat of seats) await act(seat.character, { type: 'snuff' })
  }, [seats, act])

  // ── O que vale para a mesa inteira ────────────────────────────────────────

  const grantXpToAll = useCallback(async (amount: number) => {
    for (const seat of seats) await act(seat.character, { type: 'xp', delta: amount })
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

  /**
   * A revelação (§6.8): o conteúdo vai junto no evento, e não um id para a
   * gaveta — o jogador não lê a gaveta, e o que foi revelado tem de continuar
   * legível mesmo que o Mestre apague o original depois.
   */
  const deliverHandout = useCallback((delivery: Delivery) => {
    const base = { sessionId, actorName: gmName } as const
    const payload = { title: delivery.title, content: delivery.content, by: 'gm' as const }

    if (delivery.characterIds === null) {
      void recordEvent({ ...base, kind: 'handout', payload })
      return
    }

    for (const characterId of delivery.characterIds) {
      const seat = seats.find(s => s.character.id === characterId)
      void recordEvent({
        ...base,
        characterId,
        kind: 'handout',
        payload: { ...payload, characterName: seat?.character.name },
      })
    }
  }, [seats, sessionId, gmName])

  /** Uma linha de narração: vai para o log e aparece em todas as fichas. */
  const narrate = useCallback((text: string) => {
    void recordEvent({
      sessionId,
      actorName: gmName,
      kind: 'note',
      payload: { text, narration: true, by: 'gm' },
    })
  }, [sessionId, gmName])

  const giveTreasure = useCallback(async (characterIds: string[], grant: TreasureGrant) => {
    for (const id of characterIds) {
      const seat = seats.find(s => s.character.id === id)
      // O item é um objeto só: com várias pessoas marcadas ele não viaja.
      const share = characterIds.length > 1 ? { ...grant, item: undefined } : grant
      if (seat) await act(seat.character, { type: 'treasure', grant: share })
    }
  }, [seats, act])

  /**
   * A checagem de encontro vai para o log escondida da mesa: o Mestre decide
   * quando a coisa aparece — a mesa descobre quando ela chega.
   */
  const recordCrawlCheck = useCallback((text: string) => {
    void recordEvent({ sessionId, actorName: gmName, kind: 'note', payload: { text }, visibility: 'gm_only' })
  }, [sessionId, gmName])

  // Quem fala pelo grupo costuma ser quem tem mais lábia.
  const partyChaMod = seats.length > 0
    ? Math.max(...seats.map(s => modifier(s.character.stats.cha)))
    : 0

  const crawl = useCrawl(sessionId, partyChaMod, recordCrawlCheck)

  const partyRest = useCallback(async () => {
    for (const seat of seats) await act(seat.character, { type: 'rest' })
    // Um descanso é um capítulo novo da exploração.
    crawl.reset()
  }, [seats, act, crawl])

  const { npcs: bestiary } = useBestiary(gmId)
  const enc = useEncounterControls({ sessionId, gmName, seats, act, bestiary })
  const encounter = enc.encounter

  // ── Foco: de quem é o menu de comandos ────────────────────────────────────
  //
  // Por padrão, de quem é a vez. Clicar num card muda o foco até a vez virar —
  // quando ela vira, o menu segue o turno de novo, como num RPG de turno.

  const turnId = encounter?.activeActorId ?? null
  const activeActor = encounter ? enc.actors.find(a => a.id === turnId) : undefined
  const activeKey = activeActor ? actorKey(activeActor) : null
  const [pick, setPick] = useState<{ key: string | null; turn: string | null } | null>(null)
  const focusKey = pick && pick.turn === turnId ? pick.key : activeKey
  const focus = useCallback((key: string | null) => setPick({ key, turn: turnId }), [turnId])

  const resolveKey = useCallback((key: string | null): Resolved | null => {
    if (!key) return null
    if (key.startsWith('pc:')) {
      const seat = seats.find(s => s.character.id === key.slice(3))
      return seat ? { kind: 'pc', seat, name: seat.character.name } : null
    }
    const actor = enc.actors.find(a => a.id === key.slice(4))
    return actor ? { kind: 'npc', actor, name: actor.name } : null
  }, [seats, enc.actors])

  // ── Alvos ─────────────────────────────────────────────────────────────────

  const [targeting, setTargeting] = useState<Targeting | null>(null)
  const [outcome, setOutcome] = useState<AttackOutcome | null>(null)
  const [applying, setApplying] = useState(false)
  /** As rolagens de dano dos jogadores que o Mestre já aplicou ou dispensou. */
  const [settledDamage, setSettledDamage] = useState<ReadonlySet<string>>(() => new Set())
  const settleDamage = (id: string) => setSettledDamage(prev => new Set(prev).add(id))

  function isTargetable(key: string): boolean {
    if (!targeting) return false
    const target = resolveKey(key)
    if (!target) return false
    if (target.kind === 'npc' && target.actor.defeated) return false
    if (target.kind === 'pc' && mortalState(target.seat.character.conditions) === 'dead') return false
    if (targeting.kind === 'attack') return key !== npcKey(targeting.attackerId)
    return true
  }

  async function applyDamage(key: string, amount: number) {
    const target = resolveKey(key)
    if (!target) return
    if (target.kind === 'pc') await act(target.seat.character, { type: 'hp', delta: -amount })
    else await enc.damageActor(target.actor, amount)
  }

  /**
   * O ataque do monstro contra a CA de verdade (§6.6): o número contra a CA do
   * alvo, crítico dobrando os dados, e o dano esperando o Mestre aplicar.
   */
  function resolveAttack(t: Extract<Targeting, { kind: 'attack' }>, key: string) {
    const attacker = enc.actors.find(a => a.id === t.attackerId)
    const target = resolveKey(key)
    setTargeting(null)
    if (!attacker || !target) return

    const ac = target.kind === 'pc' ? target.seat.character.ac : target.actor.ac ?? 10
    const roll = withDc(rollWithMode('d20', `${attacker.name} ataca`, target.name, attacker.atkBonus ?? 0, t.mode), ac)
    const hit = roll.success === true
    const formula = (attacker.damageDie || '1d6').trim()
    const damage = hit ? rollFormula(roll.isCritical ? doubledDice(formula) : formula, 'Dano', attacker.name) : null

    enc.log({ action: 'attack', actorName: attacker.name, targetName: target.name, hit, ac, total: roll.total })
    setOutcome({
      attackerId: attacker.id,
      attackerName: attacker.name,
      targetKey: key,
      targetName: target.name,
      roll,
      ac,
      hit,
      damage,
    })
  }

  const commandsRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const isNarrow = () => window.matchMedia('(max-width: 1023px)').matches

  function onCardClick(key: string) {
    if (!targeting) {
      focus(key)
      // No celular o menu mora abaixo do palco: tocar num card leva até ele.
      if (isNarrow()) commandsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    if (!isTargetable(key)) return
    if (targeting.kind === 'attack') {
      resolveAttack(targeting, key)
    } else if (targeting.kind === 'damage') {
      const t = targeting
      setTargeting(null)
      if (t.eventId) settleDamage(t.eventId)
      void applyDamage(key, t.amount)
    } else {
      const picked = targeting.picked.includes(key)
        ? targeting.picked.filter(k => k !== key)
        : [...targeting.picked, key]
      setTargeting({ ...targeting, picked })
    }
  }

  async function confirmArea() {
    if (targeting?.kind !== 'area') return
    const t = targeting
    setTargeting(null)
    setApplying(true)
    for (const key of t.picked) await applyDamage(key, t.amount)
    setApplying(false)
  }

  async function applyOutcome() {
    if (!outcome?.damage) return
    setApplying(true)
    await applyDamage(outcome.targetKey, outcome.damage.total)
    setApplying(false)
    setOutcome(null)
  }

  // O jogador rola o dano na ficha; aqui ele espera um alvo. Só o que foi
  // rolado depois de o combate abrir — o dano de ontem não tem alvo.
  const pendingDamage = useMemo(() => {
    if (!encounter) return []
    const since = new Date(encounter.createdAt).getTime()
    return events
      .filter(e => e.kind === 'roll' && e.at >= since && !settledDamage.has(e.id))
      .filter(e => (e.payload as RollPayload).isDamage)
      .slice(0, PENDING_DAMAGE)
  }, [encounter, events, settledDamage])

  // ── Atalhos: N passa a vez, Esc desfaz o que está no ar ───────────────────

  const advanceRef = useRef<() => void>(() => {})
  const escapeRef = useRef<() => void>(() => {})
  useEffect(() => {
    advanceRef.current = () => {
      if (encounter) void enc.advance()
      else crawl.nextRound()
    }
    escapeRef.current = () => {
      if (targeting) setTargeting(null)
      else if (outcome) setOutcome(null)
      else focus(null)
    }
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return
      if (e.key === 'Escape') escapeRef.current()
      else if (e.key === 'n' || e.key === 'N') advanceRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── O controlador que os menus recebem ────────────────────────────────────

  const clock: TableClock = { pausedAt: session.pausedAt, shiftSeconds: session.shiftSeconds }
  const [tableView, setTableView] = useState<TableView>('menu')

  const ctl: TableController = {
    sessionId,
    gmName,
    seats,
    presentIds: presentCharacterIds,
    clock,
    busyId,
    enc,
    crawl,
    bestiary,
    act,
    onRoll,
    beginTargeting: t => {
      setOutcome(null)
      setTargeting(t)
      // E o caminho de volta: o alvo se escolhe nos cards, lá em cima.
      if (isNarrow()) stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    },
    focus,
    sendPrompt,
    openHandouts: () => setDelivering(true),
    toggleRecap: () => setRecapping(r => !r),
    narrate,
    giveTreasure,
    partyRest,
    grantXpToAll,
  }

  const focused = resolveKey(focusKey)
  const presentCount = seats.filter(s => presentCharacterIds.has(s.character.id)).length
  const foes = enc.order.filter(a => a.source === 'npc')
  const attacker = targeting?.kind === 'attack' ? enc.actors.find(a => a.id === targeting.attackerId) : undefined

  const figState = (key: string, active: boolean) => ({
    active,
    focused: focusKey === key,
    targetable: isTargetable(key),
    picked: targeting?.kind === 'area' && targeting.picked.includes(key),
  })

  // O veredito do golpe sobe em cima de quem levou.
  const calloutFor = (key: string): Callout | null =>
    outcome && outcome.targetKey === key
      ? {
          id: `${outcome.attackerId}:${outcome.roll.id}`,
          text: outcome.roll.isCritical ? 'Crítico!' : outcome.hit ? 'Acertou' : 'Errou',
          tone: outcome.roll.isCritical ? 'crit' : outcome.hit ? 'hit' : 'miss',
        }
      : null

  const standingFoes = foes.filter(a => !a.defeated).length
  const tablePlate = encounter
    ? {
        mode: 'combat' as const,
        title: encounter.name,
        detail: `Combate · rodada ${encounter.round}`,
        stats: [
          { label: 'Inimigos', value: standingFoes },
          { label: 'De pé', value: seats.filter(s => s.character.hpCurrent > 0).length },
          { label: 'Rodada', value: encounter.round },
        ],
      }
    : {
        mode: 'exploration' as const,
        title: session.name,
        detail: `Exploração · perigo ${crawl.dangerLevel.label.toLowerCase()}`,
        stats: [
          { label: 'Na mesa', value: `${presentCount}/${seats.length}` },
          { label: 'Rodada', value: crawl.round },
          { label: 'Checa em', value: crawl.roundsToCheck },
        ],
      }

  // ── A tela ────────────────────────────────────────────────────────────────

  return (
    <div className="dd flex flex-col gap-3">
      <TableHud
        seats={seats}
        clock={clock}
        present={presentCount}
        busy={busyId !== null}
        onPauseToggle={togglePause}
        onAdvance={advanceClock}
        onSnuffAll={() => void snuffEveryLight()}
      />

      {encounter ? (
        <CombatRibbon
          encounter={encounter}
          order={enc.order}
          seatOf={enc.seatOf}
          focusKey={focusKey}
          onSelect={key => onCardClick(key)}
          onAdvance={() => void enc.advance()}
          busy={enc.busy}
        />
      ) : (
        <ExplorationRibbon
          round={crawl.round}
          danger={crawl.danger}
          roundsToCheck={crawl.roundsToCheck}
          onNextRound={crawl.nextRound}
          onSetDanger={crawl.setDanger}
          onReset={crawl.reset}
        />
      )}

      {recapping && (
        <SessionRecap
          sessionId={sessionId}
          sessionName={session.name}
          events={events}
          onClose={() => setRecapping(false)}
        />
      )}

      {/* ── O palco: o grupo à esquerda, os inimigos à direita ────────── */}
      <div ref={stageRef} className="dd-stage scroll-mt-20">
        <div className="dd-overlay">
          {targeting && (
            <TargetingBar
              targeting={targeting}
              attackerName={attacker?.name}
              busy={applying}
              onMode={mode => targeting.kind === 'attack' && setTargeting({ ...targeting, mode })}
              onConfirmArea={() => void confirmArea()}
              onCancel={() => setTargeting(null)}
            />
          )}
          {outcome && (
            <AttackOutcomeCard
              outcome={outcome}
              busy={applying}
              onApply={() => void applyOutcome()}
              onAgain={() => ctl.beginTargeting({ kind: 'attack', attackerId: outcome.attackerId, mode: 'normal' })}
              onDismiss={() => setOutcome(null)}
            />
          )}
          {!targeting && pendingDamage.map(event => {
            const p = event.payload as RollPayload
            const who = p.characterName ?? event.actorName
            return (
              <div key={event.id} className="dd-scroll dd-scroll--blood animate-ink-spread">
                <span className="dd-scroll__text" style={{ color: 'var(--dd-bone)' }}>
                  🗡 {who} rolou <b className="font-heading text-[15px] not-italic">{p.total}</b> de dano
                </span>
                <button
                  type="button"
                  onClick={() => ctl.beginTargeting({ kind: 'damage', amount: p.total, label: `${who}: ${p.total} de dano`, eventId: event.id })}
                  className="dd-btn dd-btn--sm dd-btn--blood"
                >
                  🎯 Em quem?
                </button>
                <button
                  type="button"
                  onClick={() => settleDamage(event.id)}
                  title="Errou, ou já foi aplicado à mão"
                  aria-label="Dispensar este dano"
                  className="dd-btn dd-btn--sm"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <div className="dd-arena">
          <div role="group" aria-label="O grupo" className="dd-side dd-side--party">
            {loading && <p className="dd-void">Chamando o grupo…</p>}
            {!loading && seats.length === 0 && (
              <p className="dd-void">Ninguém entrou ainda. Passe o código da sessão para a mesa.</p>
            )}
            {seats.map(seat => {
              const actor = enc.actors.find(a => a.source === 'pc' && a.refId === seat.character.id)
              const key = pcKey(seat.character.id)
              return (
                <PartyFigure
                  key={seat.character.id}
                  seat={seat}
                  actor={actor}
                  inEncounter={Boolean(encounter)}
                  present={presentCharacterIds.has(seat.character.id)}
                  clock={clock}
                  state={figState(key, Boolean(actor && actor.id === turnId))}
                  callout={calloutFor(key)}
                  onClick={() => onCardClick(key)}
                />
              )
            })}
          </div>

          <div role="group" aria-label="Inimigos" className="dd-side dd-side--foes">
            {encounter ? (
              foes.length === 0 ? (
                <p className="dd-void">Nenhum inimigo na trilha. Chame 👹 Reforços.</p>
              ) : (
                foes.map(actor => (
                  <FoeFigure
                    key={actor.id}
                    actor={actor}
                    state={figState(npcKey(actor.id), actor.id === turnId)}
                    callout={calloutFor(npcKey(actor.id))}
                    onClick={() => onCardClick(npcKey(actor.id))}
                  />
                ))
              )
            ) : crawl.last ? (
              <EncounterAlert
                last={crawl.last}
                onBuild={() => { focus(null); setTableView('start') }}
                onDismiss={crawl.dismiss}
              />
            ) : (
              <p className="dd-void">A escuridão adiante…</p>
            )}
          </div>
        </div>
      </div>

      {/* ── O painel de baixo: a placa, os comandos, o registro ──────── */}
      <div className="dd-frame dd-deck">
        <Nameplate
          pc={focused?.kind === 'pc' ? focused.seat : undefined}
          foe={focused?.kind === 'npc' ? focused.actor : undefined}
          sheet={focused?.kind === 'npc' ? enc.sheetOf(focused.actor) : undefined}
          table={tablePlate}
        />

        <section ref={commandsRef} aria-label="Comandos" className="flex scroll-mt-20 flex-col gap-3 p-4">
          <div className="flex items-center gap-2">
            <span className="dd-title text-[11px]">
              {focused
                ? focused.kind === 'pc' ? 'Aventureiro' : 'Inimigo'
                : encounter ? 'A mesa · combate' : 'A mesa · exploração'}
            </span>
            {focused && (
              <button type="button" onClick={() => focus(null)} className="dd-btn dd-btn--sm ml-auto">
                ↩ Mesa
              </button>
            )}
          </div>

          {focused?.kind === 'pc' ? (
            <PcCommands key={focusKey} ctl={ctl} seat={focused.seat} />
          ) : focused?.kind === 'npc' ? (
            <FoeCommands key={focusKey} ctl={ctl} actor={focused.actor} />
          ) : (
            <TableCommands ctl={ctl} view={tableView} setView={setTableView} />
          )}
        </section>

        <div className="dd-deck__log max-h-[480px] overflow-y-auto p-1">
          <SessionFeed events={events} loading={feedLoading} onReveal={reveal} />
        </div>
      </div>

      {delivering && (
        <HandoutDrawer
          gmId={gmId}
          seats={seats.map(s => ({ id: s.character.id, name: s.character.name }))}
          onDeliver={deliverHandout}
          onClose={() => setDelivering(false)}
        />
      )}

      {undoable && (
        <div
          className="dd-scroll animate-ink-spread fixed bottom-4 left-1/2 z-[140] -translate-x-1/2"
          style={{ width: 'auto', maxWidth: 'calc(100vw - 32px)' }}
        >
          <span className="dd-scroll__text">
            {undoable.characterName}: {UNDO_LABEL[undoable.kind]} {undoable.previous} → {undoable.applied}
          </span>
          <button
            type="button"
            onClick={() => void undo()}
            disabled={busyId !== null}
            className="dd-btn dd-btn--sm dd-btn--gold"
          >
            ↩ Desfazer
          </button>
        </div>
      )}
    </div>
  )
}

/** O que a última checagem de encontro trouxe — e, se trouxe algo, o atalho para a briga. */
function EncounterAlert({
  last, onBuild, onDismiss,
}: {
  last: NonNullable<ReturnType<typeof useCrawl>['last']>
  onBuild: () => void
  onDismiss: () => void
}) {
  const { check, round } = last
  if (!check.encounter) {
    return (
      <p className="dd-void flex items-center gap-2">
        🎲 d6 {check.die}: nada se aproxima{round ? ` na rodada ${round}` : ''}.
        <button type="button" onClick={onDismiss} aria-label="Dispensar" className="dd-btn dd-btn--sm">
          ✕
        </button>
      </p>
    )
  }
  return (
    <div role="status" className="dd-scroll dd-scroll--blood animate-ink-spread mx-auto self-center" style={{ maxWidth: 340 }}>
      <span className="flex flex-col items-center gap-1 text-center">
        <span className="dd-scroll__title" style={{ color: 'var(--dd-blood-hi)' }}>
          Algo se aproxima!{round ? ` · rodada ${round}` : ''}
        </span>
        <span className="dd-scroll__text">
          {check.distance?.label} · {check.activity?.label} · {check.reaction?.label} (reação {check.reaction?.total})
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        <button type="button" onClick={onBuild} className="dd-btn dd-btn--sm dd-btn--blood">
          ⚔ Montar o encontro
        </button>
        <button type="button" onClick={onDismiss} aria-label="Dispensar" className="dd-btn dd-btn--sm">
          ✕
        </button>
      </span>
    </div>
  )
}
