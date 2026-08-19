'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_SPRING } from '@/lib/diceMotion'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  rolls: RollResult[]
  /** Fortuna disponível — sem token, a oferta de rerrolar nem aparece. */
  fortuneLeft?: number
  /** Gasta um token e rola de novo (§5.2). */
  onSpendFortune?: (roll: RollResult) => void
}

export function RollToasts({ rolls, fortuneLeft = 0, onSpendFortune }: Props) {
  const [now, setNow] = useState(Date.now())
  const isMobile = useIsMobile()

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const visible = rolls.filter(r => now - r.timestamp < 15000)

  // On mobile: stack in the top-right so they don't overlap the dice bar.
  // On desktop: stack upward from just above the floating dice button.
  const positionStyle: React.CSSProperties = isMobile
    ? { top: 58, right: 10, bottom: 'auto', flexDirection: 'column' }
    : { bottom: 96, right: 24, top: 'auto', flexDirection: 'column-reverse' }

  return (
    <div style={{
      position: 'fixed',
      zIndex: 150,
      display: 'flex',
      gap: 8,
      pointerEvents: 'none',
      ...positionStyle,
    }}>
      {/* Só a rolagem mais recente oferece a Fortuna: a segunda chance é da
          jogada que acabou de assentar, não de qualquer coisa ainda na tela. */}
      {visible.map((roll, index) => {
        const isCritical = roll.isCritical
        const isFumble = roll.isFumble
        const canReroll = index === 0 && fortuneLeft > 0 && Boolean(onSpendFortune)

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
          ? 'var(--chart-1)'
          : isFumble
          ? 'var(--destructive)'
          : 'var(--foreground)'

        const labelColor = isCritical
          ? 'var(--chart-1)'
          : isFumble
          ? 'var(--destructive)'
          : 'var(--muted-foreground)'

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
              // A pilha inteira é atravessável pelo ponteiro; só o cartão que
              // oferece a Fortuna precisa receber o clique.
              pointerEvents: canReroll ? 'auto' : 'none',
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
                color: 'var(--muted-foreground)',
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
                    color: 'var(--muted-foreground)',
                    marginBottom: 2,
                  }}>
                    {roll.subLabel}
                  </div>
                )}
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--muted-foreground)',
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

            {/* Verdict — the DC the roll was made against, already compared.
                The field existed on the roller for months without anything
                reading it; the player was left doing the arithmetic. */}
            {roll.dc !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
                marginTop: 6,
                paddingTop: 6,
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: roll.success ? 'var(--chart-2)' : 'var(--destructive)',
                }}>
                  {roll.success ? '✔ Sucesso' : '✖ Falha'}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--muted-foreground)',
                }}>
                  vs DC {roll.dc}
                </span>
              </div>
            )}

            {/* O total que a Fortuna deixou para trás, lado a lado com o novo. */}
            {roll.rerollOf !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 8,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--chart-1)',
                }}>
                  ✦ Rerrolado
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted-foreground)',
                  textDecoration: 'line-through',
                  opacity: 0.55,
                }}>
                  {roll.rerollOf}
                </span>
              </div>
            )}

            {/* A Fortuna é regra de rerrolagem, não um contador: o momento de
                gastá-la é agora, com o resultado ruim ainda na tela. */}
            {canReroll && (
              <button
                type="button"
                onClick={() => onSpendFortune?.(roll)}
                title={`Gastar um token de Fortuna e rolar de novo (${fortuneLeft} restante${fortuneLeft === 1 ? '' : 's'})`}
                style={{
                  marginTop: 8,
                  width: '100%',
                  cursor: 'pointer',
                  background: 'color-mix(in oklch, var(--chart-1), transparent 88%)',
                  border: '1px solid var(--chart-1)',
                  color: 'var(--chart-1)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '7px 8px',
                  minHeight: 32,
                }}
              >
                ✦ Gastar Fortuna
              </button>
            )}

            {roll.advantage && roll.rolls && roll.rolls.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 8,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: roll.advantage === 'advantage' ? 'var(--chart-2)' : 'var(--destructive)',
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
                        color: kept ? 'var(--foreground)' : 'var(--muted-foreground)',
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
