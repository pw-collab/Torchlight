'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type {
  Encounter,
  EncounterActor,
  EncounterActorRow,
  EncounterRow,
} from '@/types/encounter.types'
import { rowToActor, rowToEncounter } from '@/types/encounter.types'
import { NO_TURNS, rowToLedger, type TurnLedger, type TurnLedgerRow } from '@/lib/turns'

interface EncounterState {
  sessionId: string | null
  encounter: Encounter | null
  actors: EncounterActor[]
  turns: TurnLedger
}

const EMPTY: EncounterState = { sessionId: null, encounter: null, actors: [], turns: NO_TURNS }

/**
 * O encontro em andamento da mesa, se houver um, e a vez — o mesmo para os
 * dois lados.
 *
 * O Mestre monta a trilha; a ficha do jogador lê a mesma coisa para saber de
 * quem é a vez. A RLS de 017 e 022 deixa a mesa ler e só o Mestre escrever,
 * então este hook não precisa saber quem está chamando: ele só lê.
 *
 * A vez (`session_turns`) vem junto mesmo sem encontro — a exploração também
 * anda em turnos — e é carregada na mesma leitura que o encontro: fechar uma
 * rodada mexe nas duas tabelas de uma vez, e lidas separadas elas
 * desconcordariam por um quadro.
 */
export function useEncounter(sessionId: string | null) {
  const [state, setState] = useState<EncounterState>(EMPTY)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    // Sem mesa não há o que carregar, e não há o que limpar: `settled` abaixo
    // já descarta o estado da mesa anterior sem precisar de uma escrita aqui.
    if (!sessionId) return
    let cancelled = false
    const supabase = createClient()

    async function load(id: string) {
      const [{ data: encounterRows }, { data: turnRows }] = await Promise.all([
        supabase
          .from('encounters')
          .select('*')
          .eq('session_id', id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1),
        supabase.from('session_turns').select('*').eq('session_id', id).limit(1),
      ])

      if (cancelled) return
      const turns = rowToLedger((turnRows as TurnLedgerRow[] | null)?.[0])
      const row = (encounterRows as EncounterRow[] | null)?.[0]
      if (!row) {
        setState({ sessionId: id, encounter: null, actors: [], turns })
        return
      }

      const { data: actorRows } = await supabase
        .from('encounter_actors')
        .select('*')
        .eq('encounter_id', row.id)

      if (cancelled) return
      setState({
        sessionId: id,
        encounter: rowToEncounter(row),
        actors: ((actorRows ?? []) as EncounterActorRow[]).map(rowToActor),
        turns,
      })
    }

    void load(sessionId)
    return () => { cancelled = true }
  }, [sessionId, reloadToken])

  // A trilha muda o tempo todo e de vários lados: um jogador assume a vez, o
  // Mestre a encerra, um goblin cai. Recarregar é mais honesto do que
  // remendar o estado linha a linha — são poucas linhas, e elas precisam
  // concordar entre as duas telas.
  //
  // `encounter_actors` vai sem filtro porque o id do encontro só existe depois
  // da carga; quem limita o que chega é a RLS de 017, que não entrega linha de
  // encontro de mesa alheia.
  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()
    const reload = () => setReloadToken(token => token + 1)

    const channel = supabase
      .channel(`encounter:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'encounters', filter: `session_id=eq.${sessionId}` },
        reload,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'encounter_actors' }, reload)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_turns', filter: `session_id=eq.${sessionId}` },
        reload,
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const settled = state.sessionId === sessionId
  return {
    encounter: settled ? state.encounter : null,
    actors: settled ? state.actors : [],
    turns: settled ? state.turns : NO_TURNS,
    loading: !settled,
    reload: () => setReloadToken(token => token + 1),
  }
}
