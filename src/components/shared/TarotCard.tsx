'use client'

import type { ReactNode } from 'react'

const ROMAN: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

export function roman(n: number): string {
  let out = ''
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v }
  return out || '·'
}

interface Props {
  /** Arcana number shown at the top (e.g. "VII") */
  numeral: string
  /** Central art glyph (emoji or symbol) */
  glyph: ReactNode
  title: string
  /** Caption under the divider (e.g. "ANCESTRALIDADE", "ARCANO · DC 12") */
  subtitle: string
  /** Accent color (full strength) */
  accent: string
  /** Accent as soft rgba — used for frame lines, halos and glows */
  accentSoft: string
  /** Faded look for expended/failed/inactive cards */
  dimmed?: boolean
  /** When true the card spans the full grid width and reveals children */
  expanded?: boolean
  onToggle?: () => void
  /** Always-visible status row pinned to the card bottom (pips, action buttons) */
  badges?: ReactNode
  /** Top-right corner action (e.g. remove ✕) */
  corner?: ReactNode
  /** Detail content revealed when expanded */
  children?: ReactNode
}

/**
 * Tarot-style card frame: double border with corner stars, arcana numeral,
 * arched art window, name banner and ornamental divider. Used by talents,
 * techniques, inventory items and spells.
 */
export function TarotCard({
  numeral, glyph, title, subtitle, accent, accentSoft,
  dimmed, expanded, onToggle, badges, corner, children,
}: Props) {
  const frame = dimmed ? 'rgba(139,112,48,0.18)' : accentSoft

  return (
    <div
      className={`tarot-card${expanded ? ' tarot-card--expanded' : ''}`}
      onClick={onToggle}
      role={onToggle ? 'button' : undefined}
      style={{
        position: 'relative',
        background: 'linear-gradient(168deg, rgba(74,54,28,0.28) 0%, rgba(24,17,7,0.96) 52%, rgba(12,8,2,0.99) 100%), #1C1305',
        border: `1px solid ${frame}`,
        borderRadius: 7,
        boxShadow: expanded
          ? `0 6px 22px rgba(0,0,0,0.6), 0 0 16px ${accentSoft}`
          : `0 3px 10px rgba(0,0,0,0.55)${dimmed ? '' : `, 0 0 8px ${accentSoft}`}`,
        padding: 5,
        cursor: onToggle ? 'pointer' : 'default',
        opacity: dimmed ? 0.62 : 1,
        minHeight: expanded ? 0 : 176,
        boxSizing: 'border-box',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Inner frame line */}
      <div style={{
        position: 'relative',
        border: `1px solid ${frame}`,
        borderRadius: 4,
        padding: expanded ? '10px 14px 14px' : '9px 8px 11px',
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
        ] as React.CSSProperties[]).map((pos, i) => (
          <span key={i} aria-hidden style={{ position: 'absolute', fontSize: 6, color: accent, opacity: 0.5, lineHeight: 1, ...pos }}>
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

        {/* Expanded detail */}
        {expanded && children && (
          <div
            className="animate-ink-spread"
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              marginTop: 4,
              paddingTop: 10,
              borderTop: `1px solid ${frame}`,
              textAlign: 'left',
              cursor: 'default',
              boxSizing: 'border-box',
            }}
          >
            {children}
          </div>
        )}
      </div>

      {/* Top-right corner action */}
      {corner && (
        <span onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 4, right: 5, zIndex: 2 }}>
          {corner}
        </span>
      )}
    </div>
  )
}
