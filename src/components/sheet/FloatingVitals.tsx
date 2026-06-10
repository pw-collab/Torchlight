'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AvatarUpload } from '@/components/sheet/AvatarUpload'

interface Props {
  // Vitals
  ac: number
  hpMax: number
  hpCurrent: number
  luckTokens: number
  onHpChange: (newHp: number) => void
  onLuckChange: (newValue: number) => void
  // Character identity (integrated HUD header)
  characterId: string
  portraitUrl: string | null
  characterName: string
  level: number
  xp: number
  onXpUpdate: (xp: number) => void
  className: string
  ancestryName: string
  onAvatarUpload: (url: string) => void
  editHref: string
}

export function FloatingVitals({
  ac, hpMax, hpCurrent, luckTokens, onHpChange, onLuckChange,
  characterId, portraitUrl, characterName, level, xp, onXpUpdate,
  className, ancestryName, onAvatarUpload, editHref,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  // HP flash on change
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
  const hpColor = hpPercent > 50
    ? 'var(--verdigris-bright)'
    : hpPercent > 25
      ? 'var(--candle-amber)'
      : 'var(--blood-bright)'

  const nextXp = level * 10
  const xpPct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100
  const xpReady = xpPct >= 100

  function applyHp(delta: number) {
    onHpChange(Math.min(hpMax, Math.max(0, hpCurrent + delta)))
  }

  // ── Shared expanded controls (damage/heal + luck pips) ────────────────
  const expandedPanel = open && (
    <div
      className="animate-ink-spread"
      onClick={e => e.stopPropagation()}
      style={{
        padding: '10px 14px 12px',
        borderBottom: '1px solid rgba(196,32,32,0.20)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'default',
      }}
    >
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
            background: 'rgba(8,6,4,0.8)',
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 7,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--bone-muted)',
          flexShrink: 0,
        }}>
          Fortuna
        </span>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
            <button
              key={i}
              onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
              className="tactile"
              title={i < luckTokens ? 'Remover token' : 'Adicionar token'}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 14, lineHeight: 1,
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

  // ── Reusable sub-elements ─────────────────────────────────────────────

  const hpFlashNum = (fontSize: number) => (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize, fontWeight: 700, lineHeight: 1 }}>
      <span
        key={flash ?? 'idle'}
        className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''}
        style={{ display: 'inline-block', color: hpColor, transition: 'color 400ms' }}
      >
        {hpCurrent}
      </span>
      <span style={{ fontSize: fontSize * 0.75, fontWeight: 400, color: 'var(--bone-muted)' }}>/{hpMax}</span>
    </span>
  )

  const hpBarEl = (h: number) => (
    <div aria-hidden style={{ height: h, background: 'rgba(0,0,0,0.45)', borderRadius: 1, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${hpPercent}%`,
        background: hpColor,
        boxShadow: `0 0 8px ${hpColor}70`,
        transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )

  const xpBarEl = (
    <div aria-hidden style={{ height: 2, background: 'rgba(0,0,0,0.35)', borderRadius: 1, overflow: 'hidden' }}>
      <div style={{
        height: '100%',
        width: `${xpPct}%`,
        background: xpReady ? 'var(--gold-bright)' : 'var(--verdigris-light)',
        boxShadow: xpReady ? '0 0 5px var(--gold-bright)' : 'none',
        transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )

  const caLuck = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)', lineHeight: 1 }}>CA</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--parchment-light)', lineHeight: 1 }}>{ac}</span>
      </span>
      <span aria-hidden style={{ width: 1, height: 11, background: 'rgba(196,32,32,0.22)', flexShrink: 0 }} />
      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <span aria-hidden style={{ fontSize: 10, color: 'var(--gold-bright)', filter: 'drop-shadow(0 0 3px rgba(201,168,76,0.45))' }}>✦</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1 }}>{luckTokens}</span>
      </span>
    </div>
  )

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP — fixed bottom-left HUD (expands upward)
  // ════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          left: 0,
          bottom: 0,
          width: 290,
          zIndex: 85,
          // Atmospheric vignette: fully transparent at top → opaque at bottom
          background: 'linear-gradient(180deg, rgba(8,6,4,0) 0%, rgba(8,6,4,0.88) 20%), #080604',
          borderTop: '1px solid rgba(196,32,32,0.22)',
          borderRight: '1px solid rgba(196,32,32,0.16)',
          boxShadow: '6px -2px 28px rgba(0,0,0,0.6), inset 0 1px 0 rgba(196,32,32,0.10)',
        }}
      >
        {/* Controls expand upward */}
        {expandedPanel}

        {/* Always-visible HUD strip */}
        <div
          role="button"
          tabIndex={0}
          aria-label={open ? 'Recolher controles de combate' : 'Expandir controles de combate'}
          onClick={() => setOpen(o => !o)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpen(o => !o) }}
          style={{
            display: 'flex',
            gap: 12,
            padding: '10px 14px 12px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* Portrait */}
          <div onClick={e => e.stopPropagation()} style={{ flexShrink: 0, alignSelf: 'center' }}>
            <AvatarUpload
              characterId={characterId}
              portraitUrl={portraitUrl}
              size={60}
              onUpload={onAvatarUpload}
            />
          </div>

          {/* Info column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Name + edit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                color: 'var(--parchment-pale)',
                letterSpacing: '0.04em',
                lineHeight: 1.1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                minWidth: 0,
              }}>
                {characterName}
              </span>
              <Link
                href={editHref}
                onClick={e => e.stopPropagation()}
                title="Editar personagem"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: 'rgba(196,32,32,0.08)',
                  border: '1px solid rgba(196,32,32,0.25)',
                  color: 'rgba(200,184,136,0.55)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 9,
                  borderRadius: 1,
                  padding: '3px 8px',
                  textDecoration: 'none',
                  flexShrink: 0,
                  transition: 'all 200ms',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--bone-white)'
                  e.currentTarget.style.borderColor = 'rgba(196,32,32,0.5)'
                  e.currentTarget.style.background = 'rgba(196,32,32,0.14)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'rgba(200,184,136,0.55)'
                  e.currentTarget.style.borderColor = 'rgba(196,32,32,0.25)'
                  e.currentTarget.style.background = 'rgba(196,32,32,0.08)'
                }}
              >
                ✎
              </Link>
            </div>

            {/* Class · Ancestry · Level */}
            <span style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 9,
              color: 'var(--bone-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {className} · {ancestryName} · Nv {level}
            </span>

            {/* HP label + number */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 3 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
                PV
              </span>
              {hpFlashNum(11)}
            </div>

            {/* HP bar */}
            {hpBarEl(5)}

            {/* XP + input */}
            <div style={{ marginTop: 2 }}>
              {xpBarEl}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--bone-muted)' }}>XP</span>
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <input
                    type="number"
                    value={xp}
                    min={0}
                    onChange={e => onXpUpdate(Math.max(0, parseInt(e.target.value) || 0))}
                    style={{
                      background: 'transparent', border: 'none', outline: 'none',
                      fontFamily: 'var(--font-mono)', fontSize: 7,
                      color: xpReady ? 'var(--gold-bright)' : 'var(--bone-muted)',
                      textAlign: 'right', width: 28, padding: 0, cursor: 'text',
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--bone-muted)' }}>/ {nextXp}</span>
                </div>
              </div>
            </div>

            {/* CA + Luck + expand chevron */}
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 1 }}>
              {caLuck}
              <div style={{ flex: 1 }} />
              <span aria-hidden style={{
                fontSize: 7, color: 'var(--bone-muted)', opacity: 0.6,
                transform: open ? 'scaleY(-1)' : 'none',
                transition: 'transform 200ms',
                marginLeft: 6,
              }}>▼</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE — inline at top of sheet content (replaces old header)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(196,32,32,0.18)',
      }}>
        {/* Hex portrait */}
        <AvatarUpload
          characterId={characterId}
          portraitUrl={portraitUrl}
          size={72}
          onUpload={onAvatarUpload}
        />

        {/* Right info column */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Name + edit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              color: 'var(--parchment-pale)',
              letterSpacing: '0.04em',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}>
              {characterName}
            </span>
            <Link
              href={editHref}
              title="Editar personagem"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(196,32,32,0.08)',
                border: '1px solid rgba(196,32,32,0.28)',
                color: 'rgba(200,184,136,0.7)',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                borderRadius: 1,
                padding: '10px 14px',
                textDecoration: 'none',
                minHeight: 44,
                flexShrink: 0,
              }}
            >
              ✎
            </Link>
          </div>

          {/* Class · Ancestry · Level */}
          <span style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--bone-dim)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {className} · {ancestryName} · Nível {level}
          </span>

          {/* HP label + number */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>PV</span>
            {hpFlashNum(12)}
          </div>

          {/* HP bar (slightly thicker on mobile) */}
          {hpBarEl(6)}

          {/* XP bar + input */}
          <div>
            {xpBarEl}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 }}>
              <input
                type="number"
                value={xp}
                min={0}
                onChange={e => onXpUpdate(Math.max(0, parseInt(e.target.value) || 0))}
                style={{
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'var(--font-mono)', fontSize: 9,
                  color: xpReady ? 'var(--gold-bright)' : 'var(--bone-muted)',
                  textAlign: 'right', width: 30, padding: 0,
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bone-muted)' }}>/ {nextXp} XP</span>
            </div>
          </div>

          {/* CA + Luck + expand toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
            {caLuck}
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setOpen(o => !o)}
              title={open ? 'Recolher controles' : 'Dano / Cura / Fortuna'}
              style={{
                background: open ? 'rgba(196,32,32,0.14)' : 'rgba(196,32,32,0.06)',
                border: '1px solid rgba(196,32,32,0.28)',
                borderRadius: 1,
                padding: '8px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: 7,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: open ? 'var(--parchment-light)' : 'var(--bone-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                minHeight: 36,
                transition: 'all 200ms',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              ⚔
              <span aria-hidden style={{ fontSize: 7, transform: open ? 'scaleY(-1)' : 'none', transition: 'transform 200ms' }}>▼</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded controls open downward on mobile */}
      {open && (
        <div style={{ background: 'rgba(8,6,4,0.6)', borderBottom: '1px solid rgba(196,32,32,0.18)', marginBottom: 4 }}>
          {expandedPanel}
        </div>
      )}
    </div>
  )
}
