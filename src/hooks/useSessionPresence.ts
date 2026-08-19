'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'

export interface PresenceIdentity {
  /** Quem se anuncia: o personagem, ou o Mestre da mesa. */
  key: string
  characterId?: string
  name: string
  role: 'player' | 'gm'
}

interface PresenceMeta {
  characterId?: string
  name: string
  role: 'player' | 'gm'
  onlineAt: string
}

const NOBODY: PresenceMeta[] = []

/** Presença sempre lida junto da mesa a que pertence. */
interface PresenceState {
  sessionId: string | null
  present: PresenceMeta[]
}

/**
 * Quem está na mesa **agora** — não quem entrou algum dia.
 *
 * `session_members` é o elenco; presença é a plateia. Um jogador que fechou a
 * aba continua sendo da mesa, e é justamente essa diferença que o Mestre
 * precisa ver quando alguém some no meio do combate. O canal do Realtime já
 * está aberto de qualquer forma; presença custa quase nada em cima dele.
 */
export function useSessionPresence(sessionId: string | null, me: PresenceIdentity | null) {
  const [state, setState] = useState<PresenceState>({ sessionId: null, present: NOBODY })

  // O objeto de identidade é recriado a cada render de quem chama; o canal só
  // deve ser refeito quando o conteúdo dele mudar de verdade.
  const meKey = me?.key ?? null
  const meName = me?.name ?? null
  const meRole = me?.role ?? null
  const meCharacterId = me?.characterId ?? null

  useEffect(() => {
    if (!sessionId || !meKey) return

    const supabase = createClient()
    const channel = supabase.channel(`presence:${sessionId}`, {
      config: { presence: { key: meKey } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        setState({ sessionId, present: Object.values(channel.presenceState<PresenceMeta>()).flat() })
      })
      .subscribe(status => {
        if (status !== 'SUBSCRIBED') return
        void channel.track({
          characterId: meCharacterId ?? undefined,
          name: meName ?? '',
          role: meRole ?? 'player',
          onlineAt: new Date().toISOString(),
        } satisfies PresenceMeta)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, meKey, meName, meRole, meCharacterId])

  const present = state.sessionId === sessionId ? state.present : NOBODY

  const presentCharacterIds = useMemo(
    () => new Set(present.map(p => p.characterId).filter((id): id is string => Boolean(id))),
    [present],
  )

  const gmPresent = useMemo(() => present.some(p => p.role === 'gm'), [present])

  return { present, presentCharacterIds, gmPresent }
}
