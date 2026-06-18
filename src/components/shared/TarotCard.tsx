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

/** Pointy-top hexagon — echoes the avatar frame */
const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'

interface PopoverPos { top: number; left: number }

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
  /**
   * Content rendered on the card face itself, below the caption — for cards
   * that show their information inline instead of (or in addition to) the
   * popover. Receives the cream/dark ink treatment from the parent.
   */
  body?: ReactNode
  /**
   * Visual face variant.
   * - 'cream' — parchment-coloured card face with dark ink text (like a real tarot card).
   *   Use for talents, spells, techniques.
   * - 'dark' — the original dark gradient face (legacy / kept for backward compat).
   *   Default is now 'cream'.
   */
  face?: 'cream' | 'dark'
  /**
   * Opt-in 3D flip interaction. When enabled, toggling `expanded` rotates the
   * card horizontally to reveal a back face that carries the detail content
   * (`children`) — instead of opening the floating popover. The action buttons
   * (`badges`) float just outside the card so they stay reachable on both
   * faces. Used by the spell cards.
   */
  flip?: boolean
}

/** Card face heights for the flip variant (front art vs. revealed detail). */
const FLIP_FRONT_H = 176
const FLIP_BACK_H  = 264

export function TarotCard({
  numeral, glyph, title, subtitle, accent, accentSoft,
  dimmed, expanded, onToggle, badges, corner, children, body,
  face = 'cream', flip = false,
}: Props) {
  const isCream = face === 'cream'
  const cardRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<PopoverPos | null>(null)

  useEffect(() => {
    if (flip || !expanded || !cardRef.current) { setPos(null); return }
    const r = cardRef.current.getBoundingClientRect()
    let left = r.left + r.width / 2 - POPOVER_WIDTH / 2
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_WIDTH - 8))
    const spaceBelow = window.innerHeight - r.bottom - 8
    const top = spaceBelow >= 80
      ? r.bottom + 8
      : Math.max(8, r.top - 8 - Math.min(spaceBelow < 80 ? 380 : 280, window.innerHeight - 16))
    setPos({ top, left })
  }, [expanded, flip])

  useEffect(() => {
    if (!expanded) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onToggle?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [expanded, onToggle])

  // ── Cream-face derived values ────────────────────────────────────────────
  const cardBg = isCream
    ? 'linear-gradient(168deg, #E2D4AC 0%, #C8B880 100%)'
    : 'linear-gradient(168deg, rgba(74,54,28,0.28) 0%, rgba(24,17,7,0.96) 52%, rgba(12,8,2,0.99) 100%), #1C1305'

  const cardBorder = isCream
    ? (expanded ? `2px solid var(--blood-bright)` : `1px solid rgba(42,30,10,0.32)`)
    : (expanded ? `1px solid ${accent}` : `1px solid ${dimmed ? 'rgba(139,112,48,0.18)' : accentSoft}`)

  const cardShadow = isCream
    ? (expanded
        ? '0 6px 22px rgba(0,0,0,0.7), 0 0 14px rgba(196,32,32,0.3)'
        : `0 4px 14px rgba(0,0,0,0.65)`)
    : (expanded
        ? `0 6px 22px rgba(0,0,0,0.6), 0 0 16px ${accentSoft}`
        : `0 3px 10px rgba(0,0,0,0.55)${dimmed ? '' : `, 0 0 8px ${accentSoft}`}`)

  const innerBorder = isCream
    ? 'rgba(42,30,10,0.18)'
    : (dimmed ? 'rgba(139,112,48,0.18)' : accentSoft)

  const starColor   = isCream ? 'rgba(42,30,10,0.35)'    : accent
  const numeralColor = isCream ? 'rgba(42,30,10,0.50)'    : accent
  const titleColor  = isCream ? 'var(--ink-on-cream)'     : (dimmed ? 'var(--bone-muted)' : 'var(--parchment-pale)')
  const dividerColor = isCream ? 'rgba(42,30,10,0.30)'    : accent
  const captionColor = isCream ? 'rgba(42,30,10,0.45)'    : accent

  // Hex window: cream → ink ring + light interior; dark → accent-glow + near-black
  const hexOuter   = isCream ? 'rgba(42,30,10,0.25)' : (dimmed ? 'rgba(139,112,48,0.18)' : accentSoft)
  const hexInnerBg = isCream
    ? `radial-gradient(circle at 50% 60%, rgba(42,30,10,0.08) 0%, transparent 72%), #D8C9A0`
    : `radial-gradient(circle at 50% 60%, ${accentSoft} 0%, transparent 72%), #150F06`
  const hexGlyphShadow = isCream ? 'none' : (dimmed ? 'none' : `0 0 12px ${accentSoft}`)

  // Dimmed: cream → ash-gray card; dark → darkened
  const dimFilter = isCream
    ? 'grayscale(1) brightness(0.65) sepia(0.15)'
    : 'grayscale(0.75) brightness(0.62)'

  const popover = expanded && pos && children
    ? createPortal(
        <>
          <div
            onClick={onToggle}
            style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.55)' }}
          />
          <div
            className="animate-ink-spread"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: POPOVER_WIDTH,
              zIndex: 141,
              background: 'linear-gradient(168deg, rgba(20,8,4,0.98) 0%, rgba(8,6,4,0.99) 100%)',
              border: `1px solid ${isCream ? 'rgba(196,32,32,0.45)' : accentSoft}`,
              borderTop: `2px solid ${isCream ? 'var(--blood-bright)' : accent}`,
              borderRadius: 6,
              boxShadow: `0 10px 40px rgba(0,0,0,0.80), 0 0 20px ${isCream ? 'rgba(196,32,32,0.18)' : accentSoft}`,
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
              borderBottom: `1px solid ${isCream ? 'rgba(196,32,32,0.2)' : accentSoft}`,
              background: isCream
                ? 'linear-gradient(90deg, rgba(196,32,32,0.06) 0%, rgba(196,32,32,0.12) 100%)'
                : `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${accentSoft} 100%)`,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{glyph}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  color: 'var(--bone-white)',
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
                  color: isCream ? 'var(--blood-bright)' : accent,
                  opacity: 0.85,
                  marginTop: 2,
                }}>
                  {numeral} · {subtitle}
                </div>
              </div>
              <button
                onClick={onToggle}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bone-muted)', fontSize: 13, lineHeight: 1, padding: '2px 4px', flexShrink: 0, opacity: 0.6 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '12px 14px 16px' }}>
              {children}
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  // ── Front-face art — shared by the classic card and the flip front ─────────
  const cornerStars = ([
    { top: 2, left: 4 }, { top: 2, right: 4 },
    { bottom: 2, left: 4 }, { bottom: 2, right: 4 },
  ] as React.CSSProperties[]).map((p, i) => (
    <span key={i} aria-hidden style={{ position: 'absolute', fontSize: 6, color: starColor, opacity: 0.55, lineHeight: 1, ...p }}>
      ✦
    </span>
  ))

  const innerFrameStyle: React.CSSProperties = {
    position: 'relative',
    border: `1px solid ${innerBorder}`,
    borderRadius: 4,
    padding: '9px 8px 11px',
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  }

  const frontArt = (
    <>
      {cornerStars}

      {/* Arcana numeral */}
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '0.3em', color: numeralColor, opacity: 0.9, lineHeight: 1, marginLeft: '0.3em' }}>
        {numeral}
      </span>

      {/* Hexagonal art window */}
      <span style={{ width: 58, height: 52, clipPath: HEX_CLIP, background: hexOuter, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{
          width: 56,
          height: 50,
          clipPath: HEX_CLIP,
          background: hexInnerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          lineHeight: 1,
          textShadow: hexGlyphShadow,
          userSelect: 'none',
        }}>
          {glyph}
        </span>
      </span>

      {/* Name banner */}
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 11,
        letterSpacing: '0.06em',
        color: titleColor,
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
      <span aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 5, width: '72%', opacity: 0.5 }}>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${dividerColor})` }} />
        <span style={{ fontSize: 6, lineHeight: 1, color: dividerColor }}>✦</span>
        <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${dividerColor}, transparent)` }} />
      </span>

      {/* Caption / subtitle */}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 6.5,
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: captionColor,
        textAlign: 'center',
        marginLeft: '0.22em',
      }}>
        {subtitle}
      </span>

      {/* Inline body — card-face content (e.g. talent description) */}
      {body && (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>
          {body}
        </div>
      )}
    </>
  )

  const cornerAction = corner ? (
    <span onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 4, right: 5, zIndex: 2 }}>
      {corner}
    </span>
  ) : null

  // ── Flip variant — the card rotates to reveal its detail on the back ───────
  if (flip) {
    return (
      <div
        className="tarot-flip-wrap"
        style={{ perspective: 1200, WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          ref={cardRef}
          className={`tarot-flip${expanded ? ' is-flipped' : ''}`}
          style={{
            position: 'relative',
            width: '100%',
            height: expanded ? FLIP_BACK_H : FLIP_FRONT_H,
            opacity: dimmed ? 0.82 : 1,
            filter: dimmed ? dimFilter : 'none',
          }}
        >
          {/* Front face — the tarot art */}
          <div
            className="tarot-flip-face tarot-flip-face--front"
            onClick={onToggle}
            role={onToggle ? 'button' : undefined}
            style={{
              background: cardBg,
              border: isCream ? `1px solid rgba(42,30,10,0.32)` : `1px solid ${dimmed ? 'rgba(139,112,48,0.18)' : accentSoft}`,
              borderRadius: 7,
              boxShadow: cardShadow,
              padding: 5,
              cursor: onToggle ? 'pointer' : 'default',
              boxSizing: 'border-box',
            }}
          >
            <div style={innerFrameStyle}>{frontArt}</div>
            {cornerAction}
          </div>

          {/* Back face — the detail that used to live in the popover */}
          <div
            className="tarot-flip-face tarot-flip-face--back"
            onClick={onToggle}
            style={{
              background: 'linear-gradient(168deg, rgba(20,8,4,0.98) 0%, rgba(8,6,4,0.99) 100%)',
              border: `1px solid ${isCream ? 'rgba(196,32,32,0.45)' : accentSoft}`,
              borderTop: `2px solid ${isCream ? 'var(--blood-bright)' : accent}`,
              borderRadius: 7,
              boxShadow: `0 6px 22px rgba(0,0,0,0.7), 0 0 14px ${isCream ? 'rgba(196,32,32,0.22)' : accentSoft}`,
              cursor: onToggle ? 'pointer' : 'default',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 10px 7px',
              flexShrink: 0,
              borderBottom: `1px solid ${isCream ? 'rgba(196,32,32,0.2)' : accentSoft}`,
              background: isCream
                ? 'linear-gradient(90deg, rgba(196,32,32,0.06) 0%, rgba(196,32,32,0.12) 100%)'
                : `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${accentSoft} 100%)`,
            }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{glyph}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 11,
                  color: 'var(--bone-white)',
                  letterSpacing: '0.05em',
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 6.5,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: isCream ? 'var(--blood-bright)' : accent,
                  opacity: 0.85,
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {numeral} · {subtitle}
                </div>
              </div>
              <span
                aria-hidden
                title="Virar carta"
                style={{ color: 'var(--bone-muted)', fontSize: 12, lineHeight: 1, flexShrink: 0, opacity: 0.6 }}
              >
                ↺
              </span>
            </div>

            {/* Detail — formerly the popover body */}
            <div style={{ padding: '10px 12px 12px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {children}
            </div>
          </div>
        </div>

        {/* Action buttons — float just outside the card, on both faces */}
        {badges && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: 8,
              cursor: 'default',
              filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
            }}
          >
            {badges}
          </div>
        )}
      </div>
    )
  }

  // ── Classic variant — static card with floating popover on expand ──────────
  return (
    <>
      <div
        ref={cardRef}
        className="tarot-card"
        onClick={onToggle}
        role={onToggle ? 'button' : undefined}
        style={{
          position: 'relative',
          background: cardBg,
          border: cardBorder,
          borderRadius: 7,
          boxShadow: cardShadow,
          padding: 5,
          cursor: onToggle ? 'pointer' : 'default',
          opacity: dimmed ? 0.82 : 1,
          filter: dimmed ? dimFilter : 'none',
          minHeight: 176,
          boxSizing: 'border-box',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Inner frame line */}
        <div style={innerFrameStyle}>
          {frontArt}

          {/* Always-visible badges */}
          {badges && (
            <span
              onClick={e => e.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginTop: 'auto', cursor: 'default' }}
            >
              {badges}
            </span>
          )}
        </div>

        {cornerAction}
      </div>

      {popover}
    </>
  )
}
