'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { SessionRow, TableSession } from '@/types/session.types'
import { rowToSession } from '@/types/session.types'

/** As exceções que os RPCs levantam, ditas em português de mesa. */
const REASONS: Record<string, string> = {
  session_not_found: 'Nenhuma mesa aberta com esse código.',
  not_your_character: 'Este personagem não é seu.',
  not_authenticated: 'Sua sessão expirou — entre de novo.',
}

function reasonFor(message: string | undefined): string {
  if (!message) return 'Não foi possível entrar na mesa.'
  const key = Object.keys(REASONS).find(k => message.includes(k))
  return key ? REASONS[key] : 'Não foi possível entrar na mesa.'
}

/** A resposta lida junto do personagem a que pertence. */
interface TableState {
  characterId: string | null
  session: TableSession | null
}

/**
 * A mesa em que o personagem está, se estiver em alguma.
 *
 * O jogador não enxerga `sessions` — a policy de 001 é do Mestre — então tanto
 * a consulta quanto a entrada passam por funções do banco: é o código de seis
 * caracteres que autoriza, não a leitura da tabela. Entrar é do personagem,
 * não da criação dele: ele sobrevive a várias sessões, que é como campanhas
 * funcionam.
 */
export function useTableSession(characterId: string) {
  const [state, setState] = useState<TableState>({ characterId: null, session: null })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    supabase
      .rpc('character_session', { p_character_id: characterId })
      .then(({ data }) => {
        if (cancelled) return
        const row = (data as SessionRow[] | null)?.[0]
        setState({ characterId, session: row ? rowToSession(row) : null })
      })

    return () => { cancelled = true }
  }, [characterId])

  const join = useCallback(async (code: string): Promise<boolean> => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length === 0) return false

    setBusy(true)
    setError(null)
    const supabase = createClient()
    const { data, error: rpcError } = await supabase.rpc('join_session', {
      p_code: trimmed,
      p_character_id: characterId,
    })
    setBusy(false)

    if (rpcError) {
      setError(reasonFor(rpcError.message))
      return false
    }
    const row = (data as SessionRow[] | null)?.[0]
    setState({ characterId, session: row ? rowToSession(row) : null })
    return true
  }, [characterId])

  const leave = useCallback(async () => {
    setBusy(true)
    const supabase = createClient()
    await supabase.rpc('leave_session', { p_character_id: characterId })
    setState({ characterId, session: null })
    setBusy(false)
  }, [characterId])

  const settled = state.characterId === characterId

  return {
    session: settled ? state.session : null,
    loading: !settled,
    busy,
    error,
    join,
    leave,
  }
}
