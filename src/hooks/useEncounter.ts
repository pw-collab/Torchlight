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

interface EncounterState {
  sessionId: string | null
  encounter: Encounter | null
  actors: EncounterActor[]
}

const EMPTY: EncounterState = { sessionId: null, encounter: null, actors: [] }

/**
 * O encontro em andamento da mesa, se houver um — o mesmo para os dois lados.
 *
 * O Mestre monta e move a trilha; a ficha do jogador lê a mesma coisa para
 * saber de quem é a vez. A RLS de 017 deixa a mesa ler e só o Mestre escrever,
 * então este hook não precisa saber quem está chamando: ele só lê.
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
      const { data: encounterRows } = await supabase
        .from('encounters')
        .select('*')
        .eq('session_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

      if (cancelled) return
      const row = (encounterRows as EncounterRow[] | null)?.[0]
      if (!row) {
        setState({ sessionId: id, encounter: null, actors: [] })
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
      })
    }

    void load(sessionId)
    return () => { cancelled = true }
  }, [sessionId, reloadToken])

  // A trilha muda o tempo todo e de vários lados: o Mestre avança a vez, um
  // jogador rola iniciativa, um goblin cai. Recarregar é mais honesto do que
  // remendar o estado linha a linha — são poucas linhas, e elas precisam
  // concordar entre as duas telas.
  //
  // `encounter_actors` vai sem filtro porque o id do encontro só existe depois
  // da carga; quem limita o que chega é a RLS de 017, que não entrega linha de
  // encontro de mesa alheia.
  useEffect(() => {
    if (!sessionId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`encounter:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'encounters', filter: `session_id=eq.${sessionId}` },
        () => setReloadToken(token => token + 1),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'encounter_actors' },
        () => setReloadToken(token => token + 1),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const settled = state.sessionId === sessionId
  return {
    encounter: settled ? state.encounter : null,
    actors: settled ? state.actors : [],
    loading: !settled,
    reload: () => setReloadToken(token => token + 1),
  }
}
