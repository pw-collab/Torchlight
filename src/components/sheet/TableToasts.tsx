'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DICE_SPRING } from '@/lib/diceMotion'
import { useIsMobile } from '@/hooks/useIsMobile'
import { eventAccent, eventDetail, eventGlyph, eventHeadline } from '@/lib/sessionEvents'
import type { SessionEvent } from '@/types/session.types'

interface Props {
  events: SessionEvent[]
  /** O personagem desta ficha — só o que acontece com ele é avisado aqui. */
  characterId: string
  /** Nada de antes disto vira aviso: o feed carrega o histórico inteiro. */
  since: number
}

const LIFETIME_MS = 9000

/**
 * O que o Mestre fez com este personagem, dito na tela do jogador.
 *
 * O Mestre pode aplicar dano, conceder XP, dar e gastar Fortuna e apagar a luz
 * de alguém — e nada disso pode acontecer em silêncio. Cada ação dele vira uma
 * linha do log, e é dessa linha que sai este aviso. O que o próprio jogador
 * faz não aparece: ele acabou de fazer.
 */
export function TableToasts({ events, characterId, since }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const isMobile = useIsMobile()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const visible = events.filter(event => {
    if (event.characterId !== characterId) return false
    if (event.at <= since) return false
    // Uma entrega já se anuncia abrindo o leitor na cara de quem recebeu
    // (§6.8) — o aviso por cima seria o mesmo recado duas vezes.
    if (event.kind === 'handout') return false
    if (now - event.at > LIFETIME_MS) return false
    return (event.payload as { by?: string }).by === 'gm'
  })

  if (visible.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
        left: isMobile ? 10 : 24,
        right: isMobile ? 10 : 'auto',
        bottom: isMobile ? 'calc(84px + var(--safe-bottom))' : 24,
        maxWidth: isMobile ? 'none' : 300,
      }}
    >
      {visible.map(event => {
        const accent = eventAccent(event) ?? 'var(--border)'
        const detail = eventDetail(event)

        return (
          <motion.div
            key={event.id}
            className="worn-border"
            initial={{ opacity: 0, x: -22, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={DICE_SPRING.panel}
            style={{
              background: 'var(--card)',
              border: `1px solid ${accent}`,
              borderLeftWidth: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 9,
            }}
          >
            <span aria-hidden style={{ fontSize: 13, lineHeight: 1.2, flexShrink: 0 }}>
              {eventGlyph(event)}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 10,
                  letterSpacing: '0.06em',
                  color: 'var(--foreground)',
                  lineHeight: 1.35,
                }}
              >
                {eventHeadline(event)}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 9,
                  color: 'var(--muted-foreground)',
                  lineHeight: 1.3,
                }}
              >
                {detail ?? 'pelo Mestre'}
              </span>
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
