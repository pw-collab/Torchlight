'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { SessionEvent, SessionEventRow } from '@/types/session.types'
import { rowToEvent } from '@/types/session.types'

const NONE: SessionEvent[] = []

/** O que já chegou, e de qual mesa — o par evita mostrar o feed da sessão anterior. */
interface FeedState {
  sessionId: string | null
  events: SessionEvent[]
}

/**
 * O que aconteceu na mesa, ao vivo e do mais recente para o mais antigo.
 *
 * Antes disso as rolagens viviam na memória de um navegador, vinte no máximo,
 * e sumiam no refresh — o Mestre nunca via uma. Agora elas são linhas de
 * `session_events`, e a RLS já decide o que cada um enxerga: a mesa vê o que é
 * da mesa, o Mestre vê também o que rolou escondido. O hook não filtra nada
 * por conta própria.
 */
export function useSessionFeed(sessionId: string | null, limit = 150) {
  const [state, setState] = useState<FeedState>({ sessionId: null, events: NONE })

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false
    const supabase = createClient()

    supabase
      .from('session_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (cancelled) return
        setState({ sessionId, events: ((data ?? []) as SessionEventRow[]).map(rowToEvent) })
      })

    const channel = supabase
      .channel(`feed:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'session_events', filter: `session_id=eq.${sessionId}` },
        payload => {
          const incoming = rowToEvent(payload.new as SessionEventRow)
          setState(prev => {
            // Chegou antes da carga inicial: ela vai trazer esta linha junto.
            if (prev.sessionId !== sessionId) return prev
            // O Realtime pode repetir uma linha numa reconexão; o log é
            // append-only, então o id basta para reconhecer o que já chegou.
            if (prev.events.some(e => e.id === incoming.id)) return prev
            return { sessionId, events: [incoming, ...prev.events].slice(0, limit) }
          })
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [sessionId, limit])

  const settled = state.sessionId === sessionId
  return {
    events: settled ? state.events : NONE,
    loading: Boolean(sessionId) && !settled,
  }
}
