'use client'

import { useState, useEffect, useRef } from 'react'
import { rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { useIsMobile } from '@/hooks/useIsMobile'

const SMALL_DICE = [4, 6, 8, 10, 12]

type RollMode = 'normal' | 'advantage' | 'disadvantage'

interface Props {
  onRoll?: (result: RollResult) => void
}

export function DiceRoller({ onRoll }: Props) {
  const [mod, setMod] = useState(0)
  const [d20Open, setD20Open] = useState(false)
  const [dc, setDc] = useState(14)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!d20Open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setD20Open(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [d20Open])

  function roll(sides: number, mode: RollMode = 'normal') {
    const result = rollDie(
      `d${sides}`,
      `d${sides}`,
      undefined,
      mod,
      mode === 'advantage',
      mode === 'disadvantage',
    )
    if (sides === 20) {
      result.isCritical = result.result === 20
      result.isFumble = result.result === 1
    }
    setD20Open(false)
    onRoll?.(result)
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: isMobile ? 12 : 11,
    fontWeight: 700,
    padding: isMobile ? '10px 12px' : '6px 10px',
    borderRadius: 2,
    cursor: 'pointer',
    border: '1px solid rgba(139,112,48,0.35)',
    background: 'rgba(42,34,16,0.7)',
    color: 'var(--bone-muted)',
    transition: 'all 200ms',
    lineHeight: 1,
    minHeight: 44,
    minWidth: 44,
    WebkitTapHighlightColor: 'transparent' as React.CSSProperties['WebkitTapHighlightColor'],
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? 6 : 4,
        background: 'linear-gradient(180deg, rgba(28,20,8,0.97) 0%, rgba(18,13,4,0.98) 100%)',
        border: '1px solid rgba(139,112,48,0.42)',
        borderTop: '1px solid rgba(139,112,48,0.6)',
        borderBottom: 'none',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.7)',
        borderRadius: '4px 4px 0 0',
        padding: `${isMobile ? '8px' : '7px'} ${isMobile ? '12px' : '10px'} calc(${isMobile ? '8px' : '7px'} + var(--safe-bottom))`,
        maxWidth: '100vw',
      }}
    >
      {/* Small dice */}
      {SMALL_DICE.map(d => (
        <button
          key={d}
          onClick={() => roll(d)}
          className="tactile glow-hover"
          style={btnBase}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--parchment-light)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,112,48,0.6)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,54,28,0.5)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-muted)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,112,48,0.35)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,34,16,0.7)'
          }}
        >
          d{d}
        </button>
      ))}

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: 'rgba(139,112,48,0.25)', margin: '0 2px', flexShrink: 0 }} />

      {/* Modifier */}
      <input
        type="text"
        inputMode="numeric"
        value={mod}
        onChange={e => setMod(Number(e.target.value))}
        title="Modificador"
        style={{
          width: isMobile ? 52 : 46,
          background: 'rgba(14,10,3,0.8)',
          border: '1px solid rgba(139,112,48,0.28)',
          color: 'var(--parchment-light)',
          fontFamily: 'var(--font-mono)',
          fontSize: isMobile ? 13 : 11,
          fontWeight: 700,
          padding: isMobile ? '10px 6px' : '5px 6px',
          outline: 'none',
          borderRadius: 2,
          textAlign: 'center',
          boxSizing: 'border-box',
          minHeight: 44,
        }}
      />

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: 'rgba(139,112,48,0.25)', margin: '0 2px', flexShrink: 0 }} />

      {/* d20 with dropdown */}
      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setD20Open(v => !v)}
          className="tactile glow-hover-blood"
          style={{
            ...btnBase,
            color: d20Open ? 'var(--parchment-light)' : 'var(--bone-muted)',
            border: `1px solid ${d20Open ? 'var(--blood-mid)' : 'rgba(139,112,48,0.35)'}`,
            background: d20Open ? 'rgba(139,21,21,0.25)' : 'rgba(42,34,16,0.7)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          d20
          <span style={{ fontSize: 7, opacity: 0.7, transform: d20Open ? 'scaleY(-1)' : 'none', display: 'inline-block', transition: 'transform 200ms' }}>▲</span>
        </button>

        {d20Open && (
          <div
            className="animate-drop-in"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              right: 0,
              transformOrigin: 'bottom center',
              background: 'linear-gradient(180deg, rgba(28,20,8,0.99) 0%, rgba(18,13,4,1) 100%)',
              border: '1px solid rgba(139,112,48,0.45)',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.7)',
              borderRadius: 3,
              padding: '8px',
              minWidth: 170,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {/* DC input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--bone-muted)',
                whiteSpace: 'nowrap',
              }}>
                DC Alvo
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={dc}
                onChange={e => setDc(Number(e.target.value))}
                style={{
                  flex: 1,
                  background: 'rgba(14,10,3,0.8)',
                  border: '1px solid rgba(139,112,48,0.28)',
                  color: 'var(--parchment-light)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '6px 6px',
                  outline: 'none',
                  borderRadius: 2,
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  minHeight: 40,
                }}
              />
            </div>

            {/* Roll mode buttons */}
            {([
              { mode: 'normal' as RollMode, label: '✦ Normal', color: 'var(--bone-muted)' },
              { mode: 'advantage' as RollMode, label: '↑ Vantagem', color: '#3D7060' },
              { mode: 'disadvantage' as RollMode, label: '↓ Desvantagem', color: 'var(--blood-bright)' },
            ] as const).map(({ mode, label, color }) => (
              <button
                key={mode}
                onClick={() => roll(20, mode)}
                className="tactile"
                style={{
                  ...btnBase,
                  width: '100%',
                  textAlign: 'left',
                  color,
                  padding: '11px 12px',
                  borderColor: 'rgba(139,112,48,0.22)',
                  fontSize: 13,
                  minHeight: 44,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,54,28,0.4)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,112,48,0.5)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,34,16,0.7)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,112,48,0.22)'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
