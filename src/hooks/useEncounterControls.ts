'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useEncounter } from '@/hooks/useEncounter'
import type { ActiveCondition, Character } from '@/types/character.types'
import type { EncounterActor } from '@/types/encounter.types'
import type { NPC } from '@/types/npc.types'
import { recordEvent, rollPayload } from '@/lib/sessionEvents'
import { rollDie, withDc, type RollResult } from '@/lib/dice'
import {
  FLEEING_ID,
  MORALE_DC,
  isFleeing,
  npcActorFields,
  rollSideInitiative,
  uniqueActorName,
} from '@/lib/encounterSetup'
import { outOfFight } from '@/lib/dying'
import {
  actorKey,
  combatStatus,
  combatTurn,
  explorationStatus,
  nextUp,
  npcKey,
  pcKey,
  sideDone,
  trackOrder,
  type Side,
  type TurnStatus,
} from '@/lib/turns'
import { claimTurn, endTurn, resetTurns, setPartyInitiative, type TurnOutcome } from '@/lib/turnActions'
import type { GmAction, Seat } from '@/lib/gmActions'

/** Quantos de cada ficha entram na trilha. */
export interface NpcPick {
  npc: NPC
  count: number
}

/**
 * O que o "▸" faz agora. O botão da faixa, o do menu e a tecla N dizem e
 * fazem a mesma coisa, então a escolha mora num lugar só.
 */
export interface NextStep {
  icon: string
  label: string
  hint: string
  /** Nada para o Mestre fazer: a vez está com o grupo, que assume na ficha. */
  idle: boolean
  run: () => Promise<void>
}

/** Uma linha recém-posta na trilha, do jeito que o insert a devolve. */
interface SeatedRow {
  id: string
  source: Side
  ref_id: string | null
}

interface Options {
  sessionId: string
  gmName: string
  seats: Seat[]
  /** Dano e XP num PC vão para a ficha pelo caminho de sempre do painel. */
  act: (character: Character, action: GmAction) => Promise<void>
  /** As fichas do Mestre: moral e habilidades saem daqui. */
  bestiary: NPC[]
}

/**
 * O encontro ao vivo, e a vez da mesa, como ações — sem tela nenhuma.
 *
 * Morava dentro do painel de encontro, misturado aos botões. A tela de mesa
 * agora espalha as mesmas ações pela fila de turnos, pelos cards e pelo menu
 * de comandos, então a regra precisa estar num lugar só. O PC não duplica
 * vida: a linha dele aponta para a ficha e o HP é lido e escrito lá.
 *
 * A vez vale também fora do combate (ver `lib/turns`): assumir, encerrar e
 * pular servem à exploração do mesmo jeito.
 */
export function useEncounterControls({ sessionId, gmName, seats, act, bestiary }: Options) {
  const { encounter, actors, turns, reload } = useEncounter(sessionId)
  const [busy, setBusy] = useState(false)
  /** A última jogada de vez que o banco recusou, dita à mesa na faixa. */
  const [notice, setNotice] = useState<string | null>(null)
  const turn = encounter ? combatTurn(encounter, actors, turns) : null

  const seatOf = useCallback(
    (actor: EncounterActor) =>
      actor.source === 'pc' ? seats.find(s => s.character.id === actor.refId) : undefined,
    [seats],
  )

  const sheetOf = useCallback(
    (actor: EncounterActor) =>
      actor.source === 'npc' ? bestiary.find(n => n.id === actor.refId) : undefined,
    [bestiary],
  )

  const log = useCallback(
    (payload: Record<string, unknown>) =>
      void recordEvent({ sessionId, actorName: gmName, kind: 'encounter', payload }),
    [sessionId, gmName],
  )

  /** Uma leva de monstros vira linhas de ator: nome único, vida própria. */
  function npcRows(encounterId: string, picks: NpcPick[], taken: string[], firstSort: number) {
    const rows: Record<string, unknown>[] = []
    let sort = firstSort
    for (const { npc, count } of picks) {
      for (let i = 0; i < count; i++) {
        const label = uniqueActorName(npc.name, taken)
        taken.push(label)
        rows.push({
          encounter_id: encounterId,
          source: 'npc',
          ref_id: npc.id,
          name: label,
          ...npcActorFields(npc),
          sort_key: sort++,
        })
      }
    }
    return rows
  }

  const nextSort = () => actors.reduce((max, a) => Math.max(max, a.sortKey), 0) + 1

  /** O d6 vai ao log da mesa à vista: quem começa não é segredo. */
  const logRoll = useCallback(
    (roll: RollResult) =>
      void recordEvent({ sessionId, actorName: gmName, kind: 'roll', payload: rollPayload(roll) }),
    [sessionId, gmName],
  )

  // ── Montar ────────────────────────────────────────────────────────────────

  /**
   * Abrir um encontro já senta a mesa inteira, põe na trilha os monstros
   * escolhidos e rola o d6 do Mestre — é o que ele faria à mão com o grupo
   * esperando. O d6 do grupo fica para os jogadores, na ficha.
   */
  async function start(title: string, picks: NpcPick[] = []) {
    if (encounter) return
    const name = title.trim() || 'Encontro'
    setBusy(true)
    const supabase = createClient()
    const foes = rollSideInitiative('npc')

    const { data } = await supabase
      .from('encounters')
      .insert({ session_id: sessionId, name, npc_initiative: foes.total })
      .select('*')
      .single()

    if (data) {
      const encounterId = (data as { id: string }).id
      const pcRows = seats.map((seat, index) => ({
        encounter_id: encounterId,
        source: 'pc',
        ref_id: seat.character.id,
        name: seat.character.name,
        sort_key: index,
      }))
      // Os nomes da mesa contam: dois "Corvo" na mesma trilha seriam ambíguos.
      const taken = seats.map(s => s.character.name)
      const rows = [...pcRows, ...npcRows(encounterId, picks, taken, seats.length)]
      if (rows.length > 0) await supabase.from('encounter_actors').insert(rows)
      log({ action: 'start', encounterName: name })
      logRoll(foes)
      reload()
    }
    setBusy(false)
  }

  /**
   * Quem chega com a vez do lado dele já passada nesta rodada espera a
   * seguinte: o reforço que entra na vez do grupo não reabre a dos goblins.
   */
  async function waitForNextRound(rows: SeatedRow[]) {
    if (!turn) return
    for (const row of rows) {
      if (!sideDone(turn, row.source)) continue
      await endTurn(sessionId, row.source === 'pc' && row.ref_id ? pcKey(row.ref_id) : npcKey(row.id))
    }
  }

  async function addNpcs(picks: NpcPick[]) {
    if (!encounter || picks.length === 0) return
    setBusy(true)
    const rows = npcRows(encounter.id, picks, actors.map(a => a.name), nextSort())
    const supabase = createClient()
    if (rows.length > 0) {
      const { data } = await supabase.from('encounter_actors').insert(rows).select('id, source, ref_id')
      await waitForNextRound((data ?? []) as SeatedRow[])
    }
    reload()
    setBusy(false)
  }

  /** Quem sentou depois de o encontro começar entra por aqui. */
  async function seatPc(seat: Seat) {
    if (!encounter) return
    setBusy(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('encounter_actors')
      .insert({
        encounter_id: encounter.id,
        source: 'pc',
        ref_id: seat.character.id,
        name: seat.character.name,
        sort_key: nextSort(),
      })
      .select('id, source, ref_id')
    await waitForNextRound((data ?? []) as SeatedRow[])
    reload()
    setBusy(false)
  }

  async function patchActor(actor: EncounterActor, patch: Record<string, unknown>) {
    const supabase = createClient()
    await supabase.from('encounter_actors').update(patch).eq('id', actor.id)
    reload()
  }

  async function removeActor(actor: EncounterActor) {
    const supabase = createClient()
    await supabase.from('encounter_actors').delete().eq('id', actor.id)
    reload()
  }

  // ── A iniciativa ──────────────────────────────────────────────────────────

  /** O Mestre rola o d6 pelo grupo: a mesa sem celular, o jogador que demora. */
  async function rollPartyInitiative() {
    if (!encounter || encounter.pcInitiative != null) return
    setBusy(true)
    const roll = rollSideInitiative('pc')
    const out = await setPartyInitiative(encounter.id, roll.total)
    if (out.ok) {
      setNotice(null)
      logRoll(roll)
      if (out.foes != null) log({ action: 'initiative', party: roll.total, foes: out.foes })
    } else {
      setNotice(out.reason)
    }
    reload()
    setBusy(false)
  }

  /** O d6 do Mestre, para o encontro que abriu sem ele (aberto antes da migração 022). */
  async function rollFoesInitiative() {
    if (!encounter || encounter.npcInitiative != null) return
    setBusy(true)
    const roll = rollSideInitiative('npc')
    const supabase = createClient()
    const { data } = await supabase
      .from('encounters')
      .update({ npc_initiative: roll.total })
      .eq('id', encounter.id)
      .is('npc_initiative', null)
      .select('pc_initiative')
    const party = (data as { pc_initiative: number | null }[] | null)?.[0]?.pc_initiative
    if (data && data.length > 0) {
      logRoll(roll)
      if (party != null) log({ action: 'initiative', party, foes: roll.total })
    }
    reload()
    setBusy(false)
  }

  // ── A vez ─────────────────────────────────────────────────────────────────

  const nameOf = (key: string) =>
    actors.find(a => actorKey(a) === key)?.name
    ?? seats.find(s => pcKey(s.character.id) === key)?.character.name

  /** Em que pé alguém está na vez: no combate pela trilha, na exploração pela mesa. */
  function statusOf(key: string): TurnStatus {
    if (turn) return combatStatus(turn, actors.find(a => actorKey(a) === key))
    const seat = seats.find(s => pcKey(s.character.id) === key)
    return explorationStatus(turns, key, !seat || outOfFight(seat.character.conditions))
  }

  /** O que a jogada conta ao log. Só o combate narra a vez: na exploração ela é ritmo, não notícia. */
  function settle(out: TurnOutcome, claimedKey?: string) {
    if (!out.ok) {
      setNotice(out.reason)
      return
    }
    setNotice(null)
    if (!encounter) return
    if (out.wrapped && out.round != null) log({ action: 'round', round: out.round })
    if (claimedKey) log({ action: 'turn', actorName: nameOf(claimedKey), round: out.round ?? undefined })
  }

  /** Assume a vez por alguém: o monstro, ou o jogador que está sem a ficha aberta. */
  async function claim(key: string) {
    setBusy(true)
    settle(await claimTurn(sessionId, key), key)
    reload()
    setBusy(false)
  }

  /** Encerra a vez de quem está agindo — ou, para quem não está, pula a vez dele nesta rodada. */
  async function finish(key: string) {
    setBusy(true)
    settle(await endTurn(sessionId, key))
    reload()
    setBusy(false)
  }

  /** Uma rodada nova de exploração: a vez fica livre e todos voltam a ter a sua. */
  async function newExplorationRound() {
    await resetTurns(sessionId)
    reload()
  }

  function nextStep(): NextStep | null {
    if (!encounter || !turn) return null
    if (turn.stage === 'initiative') {
      if (encounter.npcInitiative == null) {
        return { icon: '🎲', label: 'd6 do Mestre', hint: 'Rolar o d6 dos inimigos', idle: false, run: rollFoesInitiative }
      }
      return {
        icon: '🎲',
        label: 'Rolar pelo grupo',
        hint: 'O d6 do grupo. Qualquer jogador também rola, na ficha.',
        idle: false,
        run: rollPartyInitiative,
      }
    }
    const acting = turns.actingKey
    if (acting) {
      return {
        icon: '■',
        label: 'Encerrar a vez',
        hint: `Encerrar a vez de ${turns.actingName ?? nameOf(acting) ?? 'quem age'}`,
        idle: false,
        run: () => finish(acting),
      }
    }
    if (turn.side === 'npc') {
      const foe = nextUp(turn, actors, 'npc')
      if (foe) {
        return { icon: '▸', label: 'Próximo inimigo', hint: `${foe.name} age`, idle: false, run: () => claim(actorKey(foe)) }
      }
    }
    return {
      icon: '⏳',
      label: turn.side === 'pc' ? 'Vez do grupo' : 'Ninguém de pé',
      hint: 'Os jogadores assumem a vez na ficha. Para agir por alguém, clique no card dele.',
      idle: true,
      run: async () => {},
    }
  }

  // ── Vida ──────────────────────────────────────────────────────────────────

  /** Dano num NPC vive na linha dele; num PC vai para a ficha, pelo caminho de sempre. */
  async function damageActor(actor: EncounterActor, amount: number) {
    const seat = seatOf(actor)
    if (actor.source === 'pc') {
      if (seat) await act(seat.character, { type: 'hp', delta: -amount })
      return
    }
    const to = Math.max(0, (actor.hpCurrent ?? 0) - amount)
    await patchActor(actor, { hp_current: to, defeated: to <= 0 })
    if (to <= 0 && !actor.defeated) log({ action: 'down', actorName: actor.name })
  }

  /** Cura volta a pôr de pé o monstro que tinha caído — o xamã goblin existe. */
  async function healActor(actor: EncounterActor, amount: number) {
    const seat = seatOf(actor)
    if (actor.source === 'pc') {
      if (seat) await act(seat.character, { type: 'hp', delta: amount })
      return
    }
    const max = actor.hpMax ?? actor.hpCurrent ?? 0
    const to = Math.min(max, (actor.hpCurrent ?? 0) + amount)
    await patchActor(actor, { hp_current: to, defeated: to <= 0 })
  }

  /** Condição num monstro: o mesmo gesto de ligar e desligar que a ficha usa. */
  async function toggleActorCondition(actor: EncounterActor, condition: ActiveCondition) {
    const has = actor.conditions.some(c => c.id === condition.id)
    const next = has
      ? actor.conditions.filter(c => c.id !== condition.id)
      : [...actor.conditions, { ...condition, appliedBy: gmName, appliedAt: new Date().toISOString() }]
    await patchActor(actor, { conditions: next })
  }

  /**
   * O teste de moral: cada inimigo de pé rola SAB contra DC 15, e quem falha
   * foge. O modificador vem do statblock de origem; um ator sem ficha no
   * bestiário rola puro.
   */
  async function rollMorale() {
    if (!encounter) return
    setBusy(true)
    const supabase = createClient()
    const fled: string[] = []
    const held: string[] = []

    for (const actor of actors) {
      if (actor.source !== 'npc' || actor.defeated || isFleeing(actor)) continue
      const wis = sheetOf(actor)?.stats.wis ?? 0
      const roll = withDc(rollDie('d20', 'Moral', actor.name, wis), MORALE_DC)
      if (roll.success) {
        held.push(actor.name)
        continue
      }
      fled.push(actor.name)
      await supabase
        .from('encounter_actors')
        .update({ conditions: [...actor.conditions, { id: FLEEING_ID, label: 'Fugindo' }] })
        .eq('id', actor.id)
    }

    if (fled.length + held.length > 0) log({ action: 'morale', fled, held })
    reload()
    setBusy(false)
  }

  async function end(xpEach: number) {
    if (!encounter) return
    setBusy(true)
    const supabase = createClient()
    await supabase
      .from('encounters')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', encounter.id)

    log({ action: 'end', encounterName: encounter.name })
    if (xpEach > 0) {
      for (const seat of seats) await act(seat.character, { type: 'xp', delta: xpEach })
    }
    reload()
    setBusy(false)
  }

  return {
    encounter,
    actors,
    order: encounter ? trackOrder(encounter, actors) : [],
    turns,
    turn,
    notice,
    busy,
    seatOf,
    sheetOf,
    log,
    start,
    addNpcs,
    seatPc,
    patchActor,
    removeActor,
    rollPartyInitiative,
    statusOf,
    claim,
    finish,
    newExplorationRound,
    next: nextStep(),
    damageActor,
    healActor,
    toggleActorCondition,
    rollMorale,
    end,
  }
}

export type EncounterControls = ReturnType<typeof useEncounterControls>
