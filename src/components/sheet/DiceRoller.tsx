'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { useIsMobile } from '@/hooks/useIsMobile'

const SMALL_DICE = [4, 6, 8, 10, 12]
type RollMode = 'normal' | 'advantage' | 'disadvantage'

interface Props {
  onRoll?: (result: RollResult) => void
}

// ─── Die SVG icons ────────────────────────────────────────────────────────────

function D4({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="12,2 22,20 2,20" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="12" y1="20" x2="12" y2="9" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      <text x="12" y="18.5" textAnchor="middle" fontSize="5.5" fill="currentColor" fontFamily="'Courier New',monospace" fontWeight="700">4</text>
    </svg>
  )
}

function D6({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <text x="12" y="16.5" textAnchor="middle" fontSize="7" fill="currentColor" fontFamily="'Courier New',monospace" fontWeight="700">6</text>
    </svg>
  )
}

function D8({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="12,2 22,12 12,22 2,12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="6.5" fill="currentColor" fontFamily="'Courier New',monospace" fontWeight="700">8</text>
    </svg>
  )
}

function D10({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="12,1 21,10 18,22 6,22 3,10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="12" y="18.5" textAnchor="middle" fontSize="5" fill="currentColor" fontFamily="'Courier New',monospace" fontWeight="700">10</text>
    </svg>
  )
}

function D12({ size = 24 }: { size?: number }) {
  const r = 10, cx = 12, cy = 13
  const pts = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180)
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  }).join(' ')
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points={pts} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <text x="12" y="15.5" textAnchor="middle" fontSize="5" fill="currentColor" fontFamily="'Courier New',monospace" fontWeight="700">12</text>
    </svg>
  )
}

function D20({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <polygon points="12,2 22,19 2,19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="12,12 7,19 17,19" stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" opacity="0.5" />
      <line x1="12" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="0.75" opacity="0.4" />
    </svg>
  )
}

const DIE_ICONS: Record<number, (p: { size?: number }) => React.ReactElement> = {
  4: D4, 6: D6, 8: D8, 10: D10, 12: D12, 20: D20,
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 2,
  cursor: 'pointer',
  border: '1px solid rgba(139,112,48,0.35)',
  background: 'rgba(42,34,16,0.7)',
  color: 'var(--bone-muted)',
  transition: 'all 200ms',
  lineHeight: 1,
  minHeight: 44,
  minWidth: 44,
  WebkitTapHighlightColor: 'transparent',
}

function hoverOn(e: React.MouseEvent) {
  const t = e.currentTarget as HTMLElement
  t.style.color = 'var(--parchment-light)'
  t.style.borderColor = 'rgba(139,112,48,0.6)'
  t.style.background = 'rgba(74,54,28,0.5)'
}
function hoverOff(e: React.MouseEvent) {
  const t = e.currentTarget as HTMLElement
  t.style.color = 'var(--bone-muted)'
  t.style.borderColor = 'rgba(139,112,48,0.35)'
  t.style.background = 'rgba(42,34,16,0.7)'
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

  const inputStyle = (large: boolean): React.CSSProperties => ({
    background: 'rgba(14,10,3,0.8)',
    border: '1px solid rgba(139,112,48,0.28)',
    color: 'var(--parchment-light)',
    fontFamily: 'var(--font-mono)',
    fontSize: large ? 16 : 11,
    fontWeight: 700,
    padding: large ? '8px' : '5px 6px',
    outline: 'none',
    borderRadius: 2,
    textAlign: 'center',
    boxSizing: 'border-box',
    minHeight: large ? 44 : 40,
  })

  const d20Modes = [
    { mode: 'normal'       as RollMode, label: '✦ Normal',      color: 'var(--bone-muted)'  },
    { mode: 'advantage'    as RollMode, label: '↑ Vantagem',    color: '#3D7060'             },
    { mode: 'disadvantage' as RollMode, label: '↓ Desvantagem', color: 'var(--blood-bright)' },
  ] as const

  // ── Mobile ────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* FAB */}
        <button
          onClick={() => setMobileOpen(v => !v)}
          title="Rolar dados"
          aria-label="Abrir painel de dados"
          className="tactile"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 'calc(62px + var(--safe-bottom))',
            zIndex: 55,
            width: 52,
            height: 52,
            borderRadius: '50%',
            border: mobileOpen ? '1px solid rgba(139,112,48,0.65)' : '1px solid rgba(139,112,48,0.45)',
            background: mobileOpen
              ? 'linear-gradient(145deg, rgba(139,112,48,0.28) 0%, rgba(28,20,8,0.98) 100%)'
              : 'linear-gradient(145deg, rgba(28,20,8,0.96) 0%, rgba(14,10,3,0.99) 100%)',
            boxShadow: `0 4px 16px rgba(0,0,0,0.65), 0 0 10px rgba(139,112,48,${mobileOpen ? '0.28' : '0.1'})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: mobileOpen ? 'var(--parchment-light)' : 'var(--bone-muted)',
            transition: 'all 250ms',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <D20 size={30} />
        </button>

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
                background: 'linear-gradient(180deg, rgba(28,20,8,0.99) 0%, rgba(14,10,3,1) 100%)',
                border: '1px solid rgba(139,112,48,0.5)',
                borderTop: '2px solid rgba(139,112,48,0.75)',
                borderRadius: 7,
                boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
                padding: '16px 14px 18px',
                display: 'flex', flexDirection: 'column', gap: 14,
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
                  ✦ Rolar Dados
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bone-muted)', fontSize: 13, lineHeight: 1, padding: '4px 6px', opacity: 0.55 }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.55')}
                >
                  ✕
                </button>
              </div>

              {/* d4–d12 grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                {SMALL_DICE.map(d => {
                  const Icon = DIE_ICONS[d]
                  return (
                    <button
                      key={d}
                      onClick={() => roll(d)}
                      className="tactile glow-hover"
                      title={`d${d}`}
                      aria-label={`Rolar d${d}`}
                      style={{
                        ...btnBase,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 4, minWidth: 0, minHeight: 64, padding: '10px 4px',
                        fontSize: 9, letterSpacing: '0.1em',
                      }}
                      onMouseEnter={hoverOn}
                      onMouseLeave={hoverOff}
                    >
                      <Icon size={28} />
                      <span>d{d}</span>
                    </button>
                  )
                })}
              </div>

              {/* Modifier */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,184,136,0.5)', whiteSpace: 'nowrap' }}>
                  Modificador
                </span>
                <input
                  type="text" inputMode="numeric" value={mod}
                  onChange={e => setMod(Number(e.target.value))}
                  style={{ ...inputStyle(true), flex: 1 }}
                />
              </div>

              <div style={{ height: 1, background: 'rgba(139,112,48,0.2)' }} />

              {/* d20 section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,184,136,0.5)', whiteSpace: 'nowrap' }}>
                    DC Alvo
                  </span>
                  <input
                    type="text" inputMode="numeric" value={dc}
                    onChange={e => setDc(Number(e.target.value))}
                    style={{ ...inputStyle(true), flex: 1 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {d20Modes.map(({ mode, label, color }) => (
                    <button
                      key={mode} onClick={() => roll(20, mode)}
                      className="tactile"
                      style={{
                        ...btnBase,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 5, color, padding: '10px 4px',
                        borderColor: 'rgba(139,112,48,0.22)',
                        fontSize: 8.5, minHeight: 64,
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(74,54,28,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,112,48,0.5)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(42,34,16,0.7)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,112,48,0.22)' }}
                    >
                      <D20 size={26} />
                      <span>{label}</span>
                    </button>
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

  // ── Desktop: floating bottom bar ─────────────────────────────────────────
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
        gap: 4,
        background: 'linear-gradient(180deg, rgba(28,20,8,0.97) 0%, rgba(18,13,4,0.98) 100%)',
        border: '1px solid rgba(139,112,48,0.42)',
        borderTop: '1px solid rgba(139,112,48,0.6)',
        borderBottom: 'none',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.7)',
        borderRadius: '4px 4px 0 0',
        padding: '7px 10px calc(7px + var(--safe-bottom))',
        maxWidth: '100vw',
      }}
    >
      {SMALL_DICE.map(d => {
        const Icon = DIE_ICONS[d]
        return (
          <button
            key={d} onClick={() => roll(d)}
            className="tactile glow-hover"
            title={`d${d}`} aria-label={`Rolar d${d}`}
            style={{ ...btnBase, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={hoverOn}
            onMouseLeave={hoverOff}
          >
            <Icon size={22} />
          </button>
        )
      })}

      <div style={{ width: 1, height: 22, background: 'rgba(139,112,48,0.25)', margin: '0 2px', flexShrink: 0 }} />

      <input
        type="text" inputMode="numeric" value={mod}
        onChange={e => setMod(Number(e.target.value))}
        title="Modificador"
        style={{ ...inputStyle(false), width: 46 }}
      />

      <div style={{ width: 1, height: 22, background: 'rgba(139,112,48,0.25)', margin: '0 2px', flexShrink: 0 }} />

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setD20Open(v => !v)}
          className="tactile glow-hover-blood"
          title="Rolar d20" aria-label="Rolar d20"
          style={{
            ...btnBase,
            color: d20Open ? 'var(--parchment-light)' : 'var(--bone-muted)',
            border: `1px solid ${d20Open ? 'var(--blood-mid)' : 'rgba(139,112,48,0.35)'}`,
            background: d20Open ? 'rgba(139,21,21,0.25)' : 'rgba(42,34,16,0.7)',
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px',
          }}
        >
          <D20 size={22} />
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
              padding: 8,
              minWidth: 170,
              display: 'flex', flexDirection: 'column', gap: 5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-muted)', whiteSpace: 'nowrap' }}>
                DC Alvo
              </span>
              <input
                type="text" inputMode="numeric" value={dc}
                onChange={e => setDc(Number(e.target.value))}
                style={{ ...inputStyle(false), flex: 1, fontSize: 13, minHeight: 40 }}
              />
            </div>

            {d20Modes.map(({ mode, label, color }) => (
              <button
                key={mode} onClick={() => roll(20, mode)}
                className="tactile"
                style={{ ...btnBase, width: '100%', textAlign: 'left', color, padding: '11px 12px', borderColor: 'rgba(139,112,48,0.22)', fontSize: 13, minHeight: 44 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(74,54,28,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,112,48,0.5)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(42,34,16,0.7)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,112,48,0.22)' }}
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
