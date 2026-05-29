'use client'

import { useState, useEffect } from 'react'
import type { RollResult } from '@/lib/dice'

interface Props {
  isRolling: boolean
  lastResult: RollResult | null
}

export function DiceOverlay({ isRolling, lastResult }: Props) {
  const [displayValue, setDisplayValue] = useState(20)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isRolling) {
      setShowResult(false)
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 20) + 1)
      }, 50)
    } else if (lastResult) {
      setShowResult(true)
      const timer = setTimeout(() => setShowResult(false), 2000)
      return () => {
        clearInterval(interval)
        clearTimeout(timer)
      }
    }
    return () => clearInterval(interval)
  }, [isRolling, lastResult])

  if (!isRolling && !showResult) return null

  const isCritical = showResult && lastResult?.isCritical
  const isFumble = showResult && lastResult?.isFumble

  const borderColor = isCritical
    ? 'rgba(201,168,76,0.65)'
    : isFumble
    ? 'rgba(196,32,32,0.55)'
    : 'rgba(139,112,48,0.42)'

  const topBorderColor = isCritical ? '#C9A84C' : isFumble ? '#C42020' : '#7A6030'

  const bg = isCritical
    ? 'linear-gradient(148deg, rgba(201,168,76,.18) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.96) 100%), #2E2210'
    : isFumble
    ? 'linear-gradient(148deg, rgba(139,21,21,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.96) 100%), #2E2210'
    : 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.96) 100%), #2E2210'

  const numberColor = isCritical
    ? 'var(--gold-bright)'
    : isFumble
    ? 'var(--blood-bright)'
    : 'var(--parchment-pale)'

  const numberShadow = isCritical
    ? '0 0 24px rgba(201,168,76,0.7)'
    : isFumble
    ? '0 0 24px rgba(196,32,32,0.7)'
    : 'none'

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(2px)',
      }} />

      <div
        className="worn-border animate-ink-spread"
        style={{
          position: 'relative',
          background: bg,
          border: `1px solid ${borderColor}`,
          borderTop: `2px solid ${topBorderColor}`,
          boxShadow: isCritical
            ? '0 8px 40px rgba(201,168,76,0.3), 0 4px 20px rgba(0,0,0,0.8)'
            : isFumble
            ? '0 8px 40px rgba(196,32,32,0.3), 0 4px 20px rgba(0,0,0,0.8)'
            : '0 8px 40px rgba(0,0,0,0.8)',
          padding: '28px 48px',
          minWidth: 200,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 8,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: 'var(--bone-muted)',
        }}>
          {isRolling ? 'Rolando...' : lastResult?.label ?? 'Resultado'}
        </span>

        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 80,
          fontWeight: 700,
          lineHeight: 1,
          color: numberColor,
          textShadow: numberShadow,
          letterSpacing: '-0.02em',
        }}>
          {isRolling ? displayValue : lastResult?.total}
        </span>

        {showResult && lastResult && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bone-muted)' }}>
              {lastResult.die}
              {lastResult.modifier !== undefined && lastResult.modifier !== 0
                ? (lastResult.modifier > 0 ? ` +${lastResult.modifier}` : ` ${lastResult.modifier}`)
                : ''}
            </span>

            {lastResult.advantage && lastResult.rolls && lastResult.rolls.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 7,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: lastResult.advantage === 'advantage' ? 'var(--verdigris-light)' : 'var(--blood-bright)',
                }}>
                  {lastResult.advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}
                </span>
                {lastResult.rolls.map((r, idx) => {
                  const kept = r === lastResult.result
                  return (
                    <span
                      key={idx}
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 14,
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
            {isCritical && (
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--gold-bright)',
                textShadow: '0 0 8px rgba(201,168,76,0.5)',
              }}>
                ✦ Crítico!
              </span>
            )}
            {isFumble && (
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--blood-bright)',
              }}>
                ☠ Falha Crítica!
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
