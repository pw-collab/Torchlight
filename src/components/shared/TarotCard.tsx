'use client'

import { useRef, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function roman(n: number): string {
  let out = ''
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v }
  return out || '·'
}

const POPOVER_WIDTH = 300

interface PopoverPos {
  top: number
  left: number
}

interface Props {
  numeral: string
  glyph: ReactNode
  title: string
  subtitle: string
  accent: string
  accentSoft: string
  dimmed?: boolean
  expanded?: boolean
  onToggle?: () => void
  badges?: ReactNode
  corner?: ReactNode
  children?: ReactNode
}

export function TarotCard({
  numeral, glyph, title, subtitle, accent, accentSoft,
  dimmed, expanded, onToggle, badges, corner, children,
}: Props) {
  const frame = dimmed ? 'rgba(139,112,48,0.18)' : accentSoft
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<PopoverPos | null>(null)

  // Compute popover position anchored to the card rect
  useEffect(() => {
    if (!expanded || !cardRef.current) { setPos(null); return }
    const r = cardRef.current.getBoundingClientRect()
    let left = r.left + r.width / 2 - POPOVER_WIDTH / 2
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8))
    const spaceBelow = window.innerHeight - r.bottom - 8
    const top = spaceBelow >= 80 ? r.bottom + 8 : Math.max(8, r.top - 8 - Math.min(spaceBelow < 80 ? 380 : 280, window.innerHeight - 16))
    setPos({ top, left })
  }, [expanded])

  // Dismiss on Escape
  useEffect(() => {
    if (!expanded) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onToggle?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [expanded, onToggle])

  const popover = expanded && pos && children
    ? createPortal(
        <>
          {/* Backdrop — click to close */}
          <div
            onClick={onToggle}
            style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.42)' }}
          />

          {/* Floating detail panel */}
          <div
            className="animate-ink-spread"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: POPOVER_WIDTH,
              zIndex: 141,
              background: 'linear-gradient(168deg, rgba(74,54,28,0.18) 0%, rgba(20,14,4,0.98) 100%)',
              border: `1px solid ${accentSoft}`,
              borderRadius: 8,
              boxShadow: `0 8px 32px rgba(0,0,0,0.72), 0 0 20px ${accentSoft}`,
              padding: 0,
              overflow: 'hidden',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
            }}
          >
            {/* Popover header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px 8px',
              borderBottom: `1px solid ${accentSoft}`,
              background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${accentSoft} 100%)`,
            }}>
              <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{glyph}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  color: 'var(--parchment-pale)',
                  letterSpacing: '0.06em',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 7,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: accent,
                  opacity: 0.8,
                  marginTop: 2,
                }}>
                  {numeral} · {subtitle}
                </div>
              </div>
              <button
                onClick={onToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--bone-muted)',
                  fontSize: 12,
                  lineHeight: 1,
                  padding: '2px 4px',
                  flexShrink: 0,
                  opacity: 0.7,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
              >
                ✕
              </button>
            </div>

            {/* Detail content */}
            <div style={{ padding: '12px 14px 14px' }}>
              {children}
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <>
      <div
        ref={cardRef}
        className="tarot-card"
        onClick={onToggle}
        role={onToggle ? 'button' : undefined}
        style={{
          position: 'relative',
          background: 'linear-gradient(168deg, rgba(74,54,28,0.28) 0%, rgba(24,17,7,0.96) 52%, rgba(12,8,2,0.99) 100%), #1C1305',
          border: `1px solid ${expanded ? accent : frame}`,
          borderRadius: 7,
          boxShadow: expanded
            ? `0 6px 22px rgba(0,0,0,0.6), 0 0 16px ${accentSoft}`
            : `0 3px 10px rgba(0,0,0,0.55)${dimmed ? '' : `, 0 0 8px ${accentSoft}`}`,
          padding: 5,
          cursor: onToggle ? 'pointer' : 'default',
          opacity: dimmed ? 0.62 : 1,
          minHeight: 176,
          boxSizing: 'border-box',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Inner frame line */}
        <div style={{
          position: 'relative',
          border: `1px solid ${frame}`,
          borderRadius: 4,
          padding: '9px 8px 11px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}>
          {/* Corner stars */}
          {([
            { top: 2, left: 4 }, { top: 2, right: 4 },
            { bottom: 2, left: 4 }, { bottom: 2, right: 4 },
          ] as React.CSSProperties[]).map((p, i) => (
            <span key={i} aria-hidden style={{ position: 'absolute', fontSize: 6, color: accent, opacity: 0.5, lineHeight: 1, ...p }}>
              ✦
            </span>
          ))}

          {/* Arcana numeral */}
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '0.3em', color: accent, opacity: 0.85, lineHeight: 1, marginLeft: '0.3em' }}>
            {numeral}
          </span>

          {/* Arched art window */}
          <span style={{
            width: 54,
            height: 50,
            border: `1px solid ${frame}`,
            borderRadius: '50% 50% 6px 6px / 62% 62% 6px 6px',
            background: `radial-gradient(circle at 50% 64%, ${accentSoft} 0%, transparent 72%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            lineHeight: 1,
            flexShrink: 0,
            textShadow: `0 0 12px ${accentSoft}`,
            userSelect: 'none',
          }}>
            {glyph}
          </span>

          {/* Name banner */}
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: dimmed ? 'var(--bone-muted)' : 'var(--parchment-pale)',
            textAlign: 'center',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {title}
          </span>

          {/* Ornamental divider */}
          <span aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 5, width: '72%', opacity: 0.55 }}>
            <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${accent})` }} />
            <span style={{ fontSize: 6, lineHeight: 1, color: accent }}>✦</span>
            <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
          </span>

          {/* Caption */}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 6.5,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            opacity: 0.8,
            textAlign: 'center',
            marginLeft: '0.22em',
          }}>
            {subtitle}
          </span>

          {/* Always-visible status / quick actions */}
          {badges && (
            <span
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto', cursor: 'default' }}
            >
              {badges}
            </span>
          )}
        </div>

        {/* Top-right corner action */}
        {corner && (
          <span onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 4, right: 5, zIndex: 2 }}>
            {corner}
          </span>
        )}
      </div>

      {popover}
    </>
  )
}
