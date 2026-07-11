'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { DieGlyph } from '@/components/dice/DieGlyph'
import { DICE_SPRING } from '@/lib/diceMotion'

const SMALL_DICE = [4, 6, 8, 10, 12]
type RollMode = 'normal' | 'advantage' | 'disadvantage'

interface Props {
  onRoll?: (result: RollResult) => void
}

// Shared micro-interaction for every dice button: lift on hover,
// squash on press — spring-driven so release snaps back with life.
const diceTap = {
  whileHover: { scale: 1.05, y: -2 },
  whileTap: { scale: 0.9, y: 1 },
  transition: DICE_SPRING.tap,
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dice roller as the trailing FAB of the bottom navigation bar (see TabBar).
 * A single squared d20 button that toggles a compact popover anchored just
 * above it — never a fullscreen overlay. Identical on desktop and mobile.
 */
export function DiceRoller({ onRoll }: Props) {
  const [mod, setMod] = useState(0)
  const [dc,  setDc]  = useState(14)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  function roll(sides: number, mode: RollMode = 'normal') {
    const result = rollDie(`d${sides}`, `d${sides}`, undefined, mod, mode === 'advantage', mode === 'disadvantage')
    if (sides === 20) { result.isCritical = result.result === 20; result.isFumble = result.result === 1 }
    setOpen(false)
    onRoll?.(result)
  }

  const d20Modes = [
    { mode: 'normal'       as RollMode, label: '✦ Normal',      color: '#c8b890'  },
    { mode: 'advantage'    as RollMode, label: '↑ Vantagem',    color: '#4FA98C'  },
    { mode: 'disadvantage' as RollMode, label: '↓ Desvantagem', color: '#ff444c'  },
  ] as const

  // Shared label style for popover form rows
  const overlayLabel: React.CSSProperties = {
    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'rgba(200,184,144,0.55)', whiteSpace: 'nowrap',
  }
  const overlayInput: React.CSSProperties = {
    background: '#0a0805', border: '1px solid rgba(200,184,144,0.25)',
    color: '#c8b890', fontFamily: 'var(--font-numeral)', fontSize: 16,
    padding: '8px', outline: 'none', borderRadius: 0, textAlign: 'center',
    boxSizing: 'border-box', minHeight: 44,
  }

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      {/* FAB — the last button in the bottom navigation bar */}
      <motion.button
        type="button"
        onClick={() => setOpen(v => !v)}
        title="Rolar dados"
        aria-label="Abrir painel de dados"
        aria-expanded={open}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.9 }}
        transition={DICE_SPRING.tap}
        style={{
          width: 56,
          height: 48,
          minHeight: 48,
          borderRadius: 0,
          border: '1px solid #ff444c',
          background: open ? '#ff444c' : '#0a0805',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background 250ms',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <DieGlyph className="animate-die-idle" sides={20} size={30} shapeColor={open ? '#0a0805' : '#ff444c'} numberColor={open ? '#ff444c' : '#0a0805'} />
      </motion.button>

      {open && (
        <div
          role="dialog"
          aria-label="Rolar dados"
          className="animate-drop-in"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            right: 0,
            transformOrigin: 'bottom right',
            width: 'min(320px, calc(100vw - 32px))',
            maxHeight: 'calc(100dvh - 150px)',
            overflowY: 'auto',
            background: '#18140C',
            border: '2px solid rgba(200,184,144,0.25)',
            borderRadius: 0,
            boxShadow: '0 -6px 32px rgba(0,0,0,0.85)',
            padding: '14px 12px 16px',
            display: 'flex', flexDirection: 'column', gap: 12,
            zIndex: 70,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8b890' }}>
              Rolar Dados
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,184,144,0.6)', fontSize: 15, lineHeight: 1, padding: '4px 6px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#c8b890')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,184,144,0.6)')}
            >
              ✕
            </button>
          </div>

          {/* d4–d12 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {SMALL_DICE.map(d => (
              <motion.button
                key={d}
                type="button"
                onClick={() => roll(d)}
                {...diceTap}
                title={`d${d}`}
                aria-label={`Rolar d${d}`}
                style={{
                  background: '#0a0805', border: '1px solid #ff444c', borderRadius: 0,
                  cursor: 'pointer', minWidth: 0, height: 54,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 200ms, border-color 200ms',
                  WebkitTapHighlightColor: 'transparent',
                }}
                onMouseEnter={e => { const t = e.currentTarget; t.style.background = '#1a140a'; t.style.borderColor = 'rgba(255,68,76,0.7)' }}
                onMouseLeave={e => { const t = e.currentTarget; t.style.background = '#0a0805'; t.style.borderColor = '#ff444c' }}
              >
                <DieGlyph sides={d} size={28} shapeColor="#ff444c" numberColor="#0a0805" />
              </motion.button>
            ))}
          </div>

          {/* Modifier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={overlayLabel}>Modificador</span>
            <input
              type="text" inputMode="numeric" value={mod}
              onChange={e => setMod(Number(e.target.value))}
              style={{ ...overlayInput, flex: 1 }}
            />
          </div>

          <div style={{ height: 1, background: 'rgba(200,184,144,0.18)' }} />

          {/* d20 section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={overlayLabel}>DC Alvo</span>
              <input
                type="text" inputMode="numeric" value={dc}
                onChange={e => setDc(Number(e.target.value))}
                style={{ ...overlayInput, flex: 1 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {d20Modes.map(({ mode, label, color }) => (
                <motion.button
                  key={mode}
                  type="button"
                  onClick={() => roll(20, mode)}
                  {...diceTap}
                  style={{
                    background: '#0a0805', border: '1px solid rgba(200,184,144,0.25)', borderRadius: 0,
                    cursor: 'pointer', color, padding: '10px 4px', minHeight: 64,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.04em',
                    transition: 'background 200ms, border-color 200ms',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  onMouseEnter={e => { const t = e.currentTarget; t.style.background = '#1a140a'; t.style.borderColor = 'rgba(200,184,144,0.5)' }}
                  onMouseLeave={e => { const t = e.currentTarget; t.style.background = '#0a0805'; t.style.borderColor = 'rgba(200,184,144,0.25)' }}
                >
                  <DieGlyph sides={20} size={26} shapeColor="#ff444c" numberColor="#0a0805" />
                  <span>{label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
