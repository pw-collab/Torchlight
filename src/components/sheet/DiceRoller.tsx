'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { DieGlyph } from '@/components/dice/DieGlyph'
import { DICE_SPRING } from '@/lib/diceMotion'
import { useIsMobile } from '@/hooks/useIsMobile'

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

export function DiceRoller({ onRoll }: Props) {
  const [mod,        setMod]        = useState(0)
  const [d20Open,    setD20Open]    = useState(false)
  const [dc,         setDc]         = useState(14)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!d20Open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setD20Open(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [d20Open])

  useEffect(() => {
    if (!mobileOpen) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function roll(sides: number, mode: RollMode = 'normal') {
    const result = rollDie(`d${sides}`, `d${sides}`, undefined, mod, mode === 'advantage', mode === 'disadvantage')
    if (sides === 20) { result.isCritical = result.result === 20; result.isFumble = result.result === 1 }
    setD20Open(false); setMobileOpen(false)
    onRoll?.(result)
  }

  const d20Modes = [
    { mode: 'normal'       as RollMode, label: '✦ Normal',      color: '#c8b890'  },
    { mode: 'advantage'    as RollMode, label: '↑ Vantagem',    color: '#4FA98C'  },
    { mode: 'disadvantage' as RollMode, label: '↓ Desvantagem', color: '#ff444c'  },
  ] as const

  // Shared label style for overlay form rows
  const overlayLabel: React.CSSProperties = {
    fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    color: 'rgba(200,184,144,0.55)', whiteSpace: 'nowrap',
  }
  const overlayInput: React.CSSProperties = {
    background: '#0a0805', border: '1px solid rgba(200,184,144,0.25)',
    color: '#c8b890', fontFamily: 'var(--font-numeral)', fontSize: 16,
    padding: '8px', outline: 'none', borderRadius: 2, textAlign: 'center',
    boxSizing: 'border-box', minHeight: 44,
  }

  // ── Mobile ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* FAB */}
        <motion.button
          onClick={() => setMobileOpen(v => !v)}
          title="Rolar dados"
          aria-label="Abrir painel de dados"
          whileTap={{ scale: 0.88 }}
          transition={DICE_SPRING.tap}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(62px + var(--safe-bottom))',
            zIndex: 55,
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: '1px solid #ff444c',
            background: mobileOpen ? '#ff444c' : '#0a0805',
            boxShadow: '0 4px 16px rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 250ms',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <DieGlyph className="animate-die-idle" sides={20} size={30} shapeColor={mobileOpen ? '#0a0805' : '#ff444c'} numberColor={mobileOpen ? '#ff444c' : '#0a0805'} />
        </motion.button>

        {mobileOpen && typeof document !== 'undefined' && createPortal(
          /* Backdrop doubles as the flex centering container — panel never clips off-screen */
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 95,
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            {/* Panel */}
            <div
              onClick={e => e.stopPropagation()}
              className="animate-ink-spread"
              style={{
                width: 'min(360px, 100%)',
                maxHeight: 'calc(100dvh - 32px)',
                overflowY: 'auto',
                flexShrink: 0,
                background: '#18140C',
                border: '2px solid rgba(200,184,144,0.25)',
                borderRadius: 4,
                boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
                padding: '16px 14px 18px',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8b890' }}>
                  Rolar Dados
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,184,144,0.6)', fontSize: 15, lineHeight: 1, padding: '4px 6px' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#c8b890')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,184,144,0.6)')}
                >
                  ✕
                </button>
              </div>

              {/* d4–d12 grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {SMALL_DICE.map(d => (
                  <motion.button
                    key={d}
                    onClick={() => roll(d)}
                    {...diceTap}
                    title={`d${d}`}
                    aria-label={`Rolar d${d}`}
                    style={{
                      background: '#0a0805', border: '1px solid #ff444c', borderRadius: 2,
                      cursor: 'pointer', minWidth: 0, height: 56,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 200ms, border-color 200ms',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onMouseEnter={e => { const t = e.currentTarget; t.style.background = '#1a140a'; t.style.borderColor = 'rgba(255,68,76,0.7)' }}
                    onMouseLeave={e => { const t = e.currentTarget; t.style.background = '#0a0805'; t.style.borderColor = '#ff444c' }}
                  >
                    <DieGlyph sides={d} size={30} shapeColor="#ff444c" numberColor="#0a0805" />
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
                      key={mode} onClick={() => roll(20, mode)}
                      {...diceTap}
                      style={{
                        background: '#0a0805', border: '1px solid rgba(200,184,144,0.25)', borderRadius: 2,
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
          </div>,
          document.body,
        )}
      </>
    )
  }

  // ── Desktop: docked at the bottom of the sticky sidebar column (see
  //    CharacterSheetClient) — fills that column's width, no fixed positioning
  //    of its own, so it can never drift out of alignment with it ──
  return (
    <div
      style={{
        width: '100%',
        flexShrink: 0,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        background: '#c8b890',
        border: '1px solid rgba(139,112,48,0.42)',
        borderBottom: 'none',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.7)',
        padding: '7px 7px 6px',
      }}
    >
      {/* Row 1: d4–d12 */}
      <div style={{ display: 'flex', gap: 2 }}>
        {SMALL_DICE.map(d => (
          <motion.button
            key={d} onClick={() => roll(d)}
            {...diceTap}
            title={`d${d}`} aria-label={`Rolar d${d}`}
            style={{ background: '#0a0805', border: '1px solid #ff444c', borderRadius: 0, color: '#c8b890', flex: '1 0 0', height: 48, minHeight: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 200ms, border-color 200ms' }}
            onMouseEnter={e => { const t = e.currentTarget; t.style.background = '#1a140a'; t.style.borderColor = 'rgba(255,68,76,0.7)' }}
            onMouseLeave={e => { const t = e.currentTarget; t.style.background = '#0a0805'; t.style.borderColor = '#ff444c' }}
          >
            <DieGlyph sides={d} size={32} shapeColor="#ff444c" numberColor="#0a0805" />
          </motion.button>
        ))}
      </div>

      {/* Row 2: d20 + modifier */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div ref={dropdownRef} style={{ position: 'relative', flex: '1 0 0' }}>
          <motion.button
            onClick={() => setD20Open(v => !v)}
            className="glow-hover-blood"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.94, y: 1 }}
            transition={DICE_SPRING.tap}
            title="Rolar d20" aria-label="Rolar d20"
            style={{
              background: '#ff444c',
              border: '1px solid rgba(139,112,48,0.35)',
              borderRadius: 0,
              height: 48,
              minHeight: 48,
              width: '100%',
              boxSizing: 'border-box',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '5px 9px',
            }}
          >
            <DieGlyph className="animate-die-idle" sides={20} size={36} shapeColor="#0a0805" numberColor="#ff444c" />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: '#0a0805', fontWeight: 700, transform: d20Open ? 'scaleY(-1)' : 'none', display: 'inline-block', transition: 'transform 200ms' }}>▲</span>
          </motion.button>

          {d20Open && (
            <div
              className="animate-drop-in"
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                transformOrigin: 'bottom center',
                background: '#18140C',
                border: '2px solid rgba(200,184,144,0.25)',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.7)',
                borderRadius: 0,
                padding: 8,
                minWidth: 180,
                display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, paddingBottom: 7, borderBottom: '1px solid rgba(200,184,144,0.18)' }}>
                <span style={overlayLabel}>DC Alvo</span>
                <input
                  type="text" inputMode="numeric" value={dc}
                  onChange={e => setDc(Number(e.target.value))}
                  style={{ ...overlayInput, flex: 1, fontSize: 14, minHeight: 40, borderRadius: 0 }}
                />
              </div>

              {d20Modes.map(({ mode, label, color }) => (
                <motion.button
                  key={mode} onClick={() => roll(20, mode)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={DICE_SPRING.tap}
                  style={{ background: '#0a0805', border: '1px solid rgba(200,184,144,0.25)', borderRadius: 0, width: '100%', textAlign: 'left', color, padding: '11px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, letterSpacing: '0.04em', minHeight: 44, transition: 'background 200ms, border-color 200ms' }}
                  onMouseEnter={e => { const t = e.currentTarget; t.style.background = '#1a140a'; t.style.borderColor = 'rgba(200,184,144,0.5)' }}
                  onMouseLeave={e => { const t = e.currentTarget; t.style.background = '#0a0805'; t.style.borderColor = 'rgba(200,184,144,0.25)' }}
                >
                  {label}
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#0a0805', fontWeight: 700, lineHeight: 1, textAlign: 'right', width: 45, flexShrink: 0, userSelect: 'none' }}>+</p>

        <input
          type="text" inputMode="numeric" value={mod}
          onChange={e => setMod(Number(e.target.value))}
          title="Modificador"
          style={{ background: '#18140c', border: '1px solid rgba(200,184,144,0.25)', color: '#c8b890', width: 49, height: 48, minHeight: 48, flexShrink: 0, fontFamily: 'var(--font-numeral)', fontSize: 16, textAlign: 'center', outline: 'none', borderRadius: 0, boxSizing: 'border-box' }}
        />
      </div>
    </div>
  )
}
