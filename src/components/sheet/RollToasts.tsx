'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_SPRING } from '@/lib/diceMotion'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  rolls: RollResult[]
}

export function RollToasts({ rolls }: Props) {
  const [now, setNow] = useState(Date.now())
  const isMobile = useIsMobile()

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const visible = rolls.filter(r => now - r.timestamp < 15000)

  // On mobile: stack in the top-right so they don't overlap the dice bar
  const positionStyle: React.CSSProperties = isMobile
    ? { top: 58, right: 10, bottom: 'auto', flexDirection: 'column' }
    : { bottom: 80, right: 24, top: 'auto', flexDirection: 'column-reverse' }

  return (
    <div style={{
      position: 'fixed',
      zIndex: 150,
      display: 'flex',
      gap: 8,
      pointerEvents: 'none',
      ...positionStyle,
    }}>
      {visible.map(roll => {
        const isCritical = roll.isCritical
        const isFumble = roll.isFumble

        const borderColor = isCritical
          ? 'var(--chart-1)'
          : isFumble
          ? 'var(--destructive)'
          : 'var(--border)'

        const bg = isCritical
          ? 'linear-gradient(148deg, var(--chart-1) 0%, var(--card) 100%), var(--card)'
          : isFumble
          ? 'linear-gradient(148deg, var(--destructive) 0%, var(--card) 100%), var(--card)'
          : 'var(--card), var(--card)'

        const numColor = isCritical
          ? 'var(--gold-bright)'
          : isFumble
          ? 'var(--blood-bright)'
          : 'var(--parchment-pale)'

        const labelColor = isCritical
          ? 'var(--gold-bright)'
          : isFumble
          ? 'var(--blood-bright)'
          : 'var(--bone-muted)'

        return (
          <motion.div
            key={roll.id}
            className="worn-border"
            initial={{ opacity: 0, x: 26, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={DICE_SPRING.panel}
            style={{
              background: bg,
              border: `1px solid ${borderColor}`,
              boxShadow: isCritical
                ? '0 4px 20px var(--chart-1), 0 2px 12px rgba(0,0,0,0.6)'
                : isFumble
                ? '0 4px 20px var(--destructive), 0 2px 12px rgba(0,0,0,0.6)'
                : '0 2px 12px rgba(0,0,0,0.6)',
              padding: '10px 14px',
              minWidth: isMobile ? 140 : 160,
              maxWidth: isMobile ? 180 : 220,
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: labelColor,
              }}>
                {roll.label}
                {isCritical && ' ✦'}
                {isFumble && ' ☠'}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: 'var(--parchment-warm)',
              }}>
                {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {roll.subLabel && (
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 11,
                    color: 'var(--bone-muted)',
                    marginBottom: 2,
                  }}>
                    {roll.subLabel}
                  </div>
                )}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--bone-muted)',
                }}>
                  {roll.die}
                  {roll.modifier !== undefined && roll.modifier !== 0
                    ? (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`)
                    : ''}
                </span>
              </div>

              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 28,
                fontWeight: 700,
                color: numColor,
                lineHeight: 1,
                textShadow: isCritical ? '0 0 10px var(--chart-1)' : 'none',
              }}>
                {roll.total}
              </span>
            </div>

            {roll.advantage && roll.rolls && roll.rolls.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 8,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: roll.advantage === 'advantage' ? 'var(--verdigris-light)' : 'var(--blood-bright)',
                }}>
                  {roll.advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}
                </span>
                {roll.rolls.map((r, idx) => {
                  const kept = r === roll.result
                  return (
                    <span
                      key={idx}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: kept ? 700 : 400,
                        color: kept ? 'var(--parchment-pale)' : 'var(--bone-muted)',
                        textDecoration: kept ? 'none' : 'line-through',
                        opacity: kept ? 1 : 0.55,
                      }}
                    >
                      {r}
                    </span>
                  )
                })}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
