'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { NPC, NPCRow } from '@/types/npc.types'
import { rowToNPC } from '@/types/npc.types'

interface BestiaryState {
  gmId: string | null
  npcs: NPC[]
}

const NONE: NPC[] = []

/**
 * As fichas do Mestre, à mão durante a mesa.
 *
 * O encontro precisa delas o tempo todo: para pôr um monstro na trilha, para
 * as habilidades do statblock no turno dele, para o modificador de SAB do
 * teste de moral. Uma leitura só, quando o painel abre — e o par com o Mestre
 * evita mostrar o bestiário de outra conta por um quadro.
 */
export function useBestiary(gmId: string) {
  const [state, setState] = useState<BestiaryState>({ gmId: null, npcs: NONE })
  const [token, setToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('npcs')
      .select('*')
      .eq('gm_id', gmId)
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        setState({ gmId, npcs: ((data ?? []) as NPCRow[]).map(rowToNPC) })
      })
    return () => { cancelled = true }
  }, [gmId, token])

  const settled = state.gmId === gmId
  return {
    npcs: settled ? state.npcs : NONE,
    loading: !settled,
    reload: useCallback(() => setToken(t => t + 1), []),
  }
}
