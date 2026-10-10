'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useEncounter } from '@/hooks/useEncounter'
import type { ActiveCondition, Character } from '@/types/character.types'
import type { EncounterActor } from '@/types/encounter.types'
import { nextTurn, turnOrder } from '@/types/encounter.types'
import type { NPC } from '@/types/npc.types'
import { recordEvent, rollPayload } from '@/lib/sessionEvents'
import { modifier, rollDie, withDc, type RollResult } from '@/lib/dice'
import {
  FLEEING_ID,
  MORALE_DC,
  isFleeing,
  npcActorFields,
  uniqueActorName,
} from '@/lib/encounterSetup'
import { mortalState } from '@/lib/dying'
import type { GmAction, Seat } from '@/lib/gmActions'

/** Quantos de cada ficha entram na trilha. */
export interface NpcPick {
  npc: NPC
  count: number
}

interface Options {
  sessionId: string
  gmName: string
  seats: Seat[]
  /** Dano e XP num PC vão para a ficha pelo caminho de sempre do painel. */
  act: (character: Character, action: GmAction) => Promise<void>
  /** As fichas do Mestre: iniciativa, moral e habilidades saem daqui. */
  bestiary: NPC[]
}

/**
 * O encontro ao vivo, como ações — sem tela nenhuma.
 *
 * Morava dentro do painel de encontro, misturado aos botões. A tela de mesa
 * agora espalha as mesmas ações pela fila de turnos, pelos cards e pelo menu
 * de comandos, então a regra precisa estar num lugar só. O PC não duplica
 * vida: a linha dele aponta para a ficha e o HP é lido e escrito lá.
 */
export function useEncounterControls({ sessionId, gmName, seats, act, bestiary }: Options) {
  const { encounter, actors, reload } = useEncounter(sessionId)
  const [busy, setBusy] = useState(false)

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

  /** Uma leva de monstros vira linhas de ator: nome único, vida própria, iniciativa rolada. */
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
          initiative: rollDie('d20', 'Iniciativa', npc.name, npc.stats.dex).total,
          sort_key: sort++,
        })
      }
    }
    return rows
  }

  const nextSort = () => actors.reduce((max, a) => Math.max(max, a.sortKey), 0) + 1

  // ── Montar ────────────────────────────────────────────────────────────────

  /**
   * Abrir um encontro já senta a mesa inteira e põe na trilha os monstros
   * escolhidos — é o que o Mestre faria à mão com o grupo esperando.
   */
  async function start(title: string, picks: NpcPick[] = []) {
    if (encounter) return
    const name = title.trim() || 'Encontro'
    setBusy(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('encounters')
      .insert({ session_id: sessionId, name })
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
      reload()
    }
    setBusy(false)
  }

  async function addNpcs(picks: NpcPick[]) {
    if (!encounter || picks.length === 0) return
    setBusy(true)
    const rows = npcRows(encounter.id, picks, actors.map(a => a.name), nextSort())
    const supabase = createClient()
    if (rows.length > 0) await supabase.from('encounter_actors').insert(rows)
    reload()
    setBusy(false)
  }

  /** Quem sentou depois de o encontro começar entra por aqui. */
  async function seatPc(seat: Seat) {
    if (!encounter) return
    setBusy(true)
    const supabase = createClient()
    await supabase.from('encounter_actors').insert({
      encounter_id: encounter.id,
      source: 'pc',
      ref_id: seat.character.id,
      name: seat.character.name,
      sort_key: nextSort(),
    })
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

  // ── A trilha anda ─────────────────────────────────────────────────────────

  async function advance() {
    if (!encounter) return
    // Quem está morrendo ainda tem vez — é nela que rola contra a morte. Quem
    // morreu, não: sai da trilha como o goblin que caiu.
    const living = actors.map(actor => {
      const seat = seatOf(actor)
      return seat && mortalState(seat.character.conditions) === 'dead' ? { ...actor, defeated: true } : actor
    })
    const { actorId, wrapped } = nextTurn(living, encounter.activeActorId)
    if (!actorId) return

    const round = wrapped ? encounter.round + 1 : encounter.round
    const supabase = createClient()
    await supabase
      .from('encounters')
      .update({ active_actor_id: actorId, round })
      .eq('id', encounter.id)

    if (wrapped) log({ action: 'round', round })
    const who = actors.find(a => a.id === actorId)
    log({ action: 'turn', actorName: who?.name, round })
    reload()
  }

  /**
   * Rola a iniciativa por alguém — o jogador que está sem o celular, o monstro
   * que entrou à mão. A do PC vai para o log da mesa como qualquer rolagem dele.
   */
  async function rollInitiativeFor(actor: EncounterActor): Promise<RollResult> {
    const seat = seatOf(actor)
    const mod = seat ? modifier(seat.character.stats.dex) : sheetOf(actor)?.stats.dex ?? 0
    const roll = rollDie('d20', 'Iniciativa', actor.name, mod)
    await patchActor(actor, { initiative: roll.total })
    if (seat) {
      void recordEvent({
        sessionId,
        actorName: gmName,
        characterId: seat.character.id,
        kind: 'roll',
        payload: rollPayload(roll, seat.character.name),
      })
    }
    return roll
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
    order: turnOrder(actors),
    busy,
    seatOf,
    sheetOf,
    log,
    start,
    addNpcs,
    seatPc,
    patchActor,
    removeActor,
    advance,
    rollInitiativeFor,
    damageActor,
    healActor,
    toggleActorCondition,
    rollMorale,
    end,
  }
}

export type EncounterControls = ReturnType<typeof useEncounterControls>
