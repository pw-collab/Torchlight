'use client'

import { useState, useEffect, useRef } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

interface Props {
  ac: number
  hpMax: number
  hpCurrent: number
  luckTokens: number
  onHpChange: (newHp: number) => void
  onLuckChange: (newValue: number) => void
}

/**
 * Floating vitals card pinned over the whole page — CA, PV and Fortuna are
 * always in sight regardless of the active tab or scroll position. The
 * compact strip expands on click to reveal damage/heal controls and the
 * luck token pips.
 */
export function FloatingVitals({ ac, hpMax, hpCurrent, luckTokens, onHpChange, onLuckChange }: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  // HP flash on change (same pattern as the old CombatStats panel)
  const [flash, setFlash] = useState<'damage' | 'heal' | null>(null)
  const prevHp = useRef(hpCurrent)
  useEffect(() => {
    if (hpCurrent < prevHp.current) setFlash('damage')
    else if (hpCurrent > prevHp.current) setFlash('heal')
    prevHp.current = hpCurrent
    const t = setTimeout(() => setFlash(null), 520)
    return () => clearTimeout(t)
  }, [hpCurrent])

  const hpPercent = hpMax > 0 ? Math.max(0, (hpCurrent / hpMax) * 100) : 0
  // Semantic accents: teal = healthy, amber = hurt, red = danger
  const hpColor = hpPercent > 50 ? 'var(--verdigris-bright)' : hpPercent > 25 ? 'var(--candle-amber)' : 'var(--blood-bright)'

  function applyHp(delta: number) {
    onHpChange(Math.min(hpMax, Math.max(0, hpCurrent + delta)))
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontSize: 7,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: 'var(--bone-muted)',
    lineHeight: 1,
  }

  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1,
    color: 'var(--parchment-light)',
  }

  const divider = <span aria-hidden style={{ width: 1, alignSelf: 'stretch', background: 'rgba(196,32,32,0.20)', flexShrink: 0 }} />

  const expandedPanel = open && (
    <div
      className="animate-ink-spread"
      onClick={e => e.stopPropagation()}
      style={{
        borderTop: isMobile ? 'none' : '1px solid rgba(196,32,32,0.20)',
        borderBottom: isMobile ? '1px solid rgba(196,32,32,0.20)' : 'none',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'default',
      }}
    >
      {/* Damage / heal controls */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
        <button
          onClick={() => applyHp(-step)}
          className="tactile"
          style={{
            flex: 1,
            background: 'rgba(139,21,21,0.25)',
            border: '1px solid var(--blood-mid)',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            padding: '8px 0',
            cursor: 'pointer',
            minHeight: 40,
            borderRadius: 1,
          }}
        >
          − Dano
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={step}
          onChange={e => {
            const n = parseInt(e.target.value, 10)
            setStep(isNaN(n) ? 0 : Math.max(0, n))
          }}
          onBlur={() => { if (step < 1) setStep(1) }}
          title="Valor aplicado por clique"
          style={{
            width: 46,
            flexShrink: 0,
            background: 'var(--ink-deep)',
            border: '1px solid rgba(196,32,32,0.25)',
            color: 'var(--parchment-light)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
            borderRadius: 1,
            boxSizing: 'border-box',
            minHeight: 40,
          }}
        />
        <button
          onClick={() => applyHp(step)}
          className="tactile"
          style={{
            flex: 1,
            background: 'rgba(42,80,69,0.25)',
            border: '1px solid #2A5045',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            padding: '8px 0',
            cursor: 'pointer',
            minHeight: 40,
            borderRadius: 1,
          }}
        >
          + Cura
        </button>
      </div>

      {/* Luck token pips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Fortuna</span>
        <div style={{ display: 'flex', gap: 5, flex: 1 }}>
          {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
            <button
              key={i}
              onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
              className="tactile"
              title={i < luckTokens ? 'Remover token' : 'Adicionar token'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontSize: 14,
                lineHeight: 1,
                color: i < luckTokens ? 'var(--gold-bright)' : 'var(--parchment-deep)',
                filter: i < luckTokens ? 'drop-shadow(0 0 3px rgba(201,168,76,0.5))' : 'none',
                transition: 'color 300ms, filter 300ms',
              }}
            >
              ✦
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div
      role="button"
      onClick={() => setOpen(o => !o)}
      title={open ? 'Recolher vitais' : 'Expandir vitais'}
      style={{
        position: 'fixed',
        ...(isMobile
          ? { left: 10, right: 10, bottom: 'calc(68px + var(--safe-bottom))' }
          : { left: 24, top: 70, width: 218 }),
        zIndex: 85,
        background: 'linear-gradient(148deg, rgba(196,32,32,0.07) 0%, rgba(8,6,4,0.98) 100%), #0D0A05',
        border: '1px solid rgba(196,32,32,0.35)',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.7), 0 0 12px rgba(196,32,32,0.15)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* On mobile the card sits at the bottom, so the panel opens upward */}
      {isMobile && expandedPanel}

      {/* Always-visible summary strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px' }}>
        {/* CA */}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={labelStyle}>CA</span>
          <span style={valueStyle}>{ac}</span>
        </span>

        {divider}

        {/* PV + bar */}
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 64 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={labelStyle}>PV</span>
            <span style={valueStyle}>
              <span
                key={flash ?? 'idle'}
                className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''}
                style={{ display: 'inline-block', color: hpColor, transition: 'color 400ms' }}
              >
                {hpCurrent}
              </span>
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--bone-muted)' }}>/{hpMax}</span>
            </span>
          </span>
          <span aria-hidden style={{ height: 3, background: 'var(--ink-deep)', borderRadius: 1, overflow: 'hidden', display: 'block' }}>
            <span style={{
              display: 'block',
              height: '100%',
              width: `${hpPercent}%`,
              background: hpColor,
              boxShadow: `0 0 4px ${hpColor}60`,
              transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
            }} />
          </span>
        </span>

        {divider}

        {/* Fortuna */}
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <span style={labelStyle}>Fortuna</span>
          <span style={{ ...valueStyle, color: 'var(--gold-bright)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <span aria-hidden style={{ fontSize: 10, filter: 'drop-shadow(0 0 3px rgba(201,168,76,0.5))' }}>✦</span>
            {luckTokens}
          </span>
        </span>

        {/* Expand hint */}
        <span aria-hidden style={{
          fontSize: 7,
          color: 'var(--bone-muted)',
          opacity: 0.7,
          transform: (isMobile ? !open : open) ? 'scaleY(-1)' : 'none',
          transition: 'transform 200ms',
          flexShrink: 0,
        }}>
          ▼
        </span>
      </div>

      {/* On desktop the card hangs from the top, so the panel opens downward */}
      {!isMobile && expandedPanel}
    </div>
  )
}
