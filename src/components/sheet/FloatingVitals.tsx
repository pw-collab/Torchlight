'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AvatarUpload } from '@/components/sheet/AvatarUpload'
import { modifier, modifierStr, rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import type { Stat } from '@/types/class.types'

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
  // Stats (desktop sidebar only)
  stats?: Record<Stat, number>
  onRoll?: (result: RollResult) => void
}

const STAT_KEYS: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const STAT_LABELS: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}
const STAT_FULL: Record<Stat, string> = {
  str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma',
}

export function FloatingVitals({
  ac, hpMax, hpCurrent, luckTokens, onHpChange, onLuckChange,
  characterId, portraitUrl, characterName, level, xp, onXpUpdate,
  className, ancestryName, onAvatarUpload, editHref,
  stats, onRoll,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)

  const [flash, setFlash] = useState<'damage' | 'heal' | null>(null)
  const prevHp = useRef(hpCurrent)
  useEffect(() => {
    if (hpCurrent < prevHp.current) setFlash('damage')
    else if (hpCurrent > prevHp.current) setFlash('heal')
    prevHp.current = hpCurrent
    const t = setTimeout(() => setFlash(null), 520)
    return () => clearTimeout(t)
  }, [hpCurrent])

  // Lock background scroll while the HP/XP overlay is open
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  const hpPercent = hpMax > 0 ? Math.max(0, (hpCurrent / hpMax) * 100) : 0

  const nextXp = level * 10
  const xpPct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100
  const xpReady = xpPct >= 100

  function applyHp(delta: number) {
    onHpChange(Math.min(hpMax, Math.max(0, hpCurrent + delta)))
  }

  function rollStat(stat: Stat) {
    if (!onRoll) return
    const mod = modifier(stats![stat])
    const result = rollDie(`d20`, STAT_FULL[stat], STAT_LABELS[stat], mod, false, false)
    onRoll(result)
  }

  // ── HP / XP controls — centered overlay (portal) ─────────────────────────
  const hpOverlay = open && typeof document !== 'undefined' && createPortal(
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        className="animate-ink-spread"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(360px, 100%)',
          background: '#18140C',
          border: '2px solid rgba(200,184,144,0.25)',
          borderRadius: 4,
          boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
          padding: '18px 18px 20px',
          display: 'flex', flexDirection: 'column', gap: 16,
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c8b890' }}>
            Pontos de Vida
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(200,184,144,0.6)', fontSize: 15, lineHeight: 1, padding: '4px 6px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#c8b890')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,184,144,0.6)')}
          >
            ✕
          </button>
        </div>

        {/* XP bar */}
        <div>
          <div aria-hidden style={{ height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(200,184,144,0.18)' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: xpReady ? '#c8b890' : '#4FA98C', boxShadow: xpReady ? '0 0 6px #c8b890' : 'none', transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(200,184,144,0.6)' }}>XP</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="number" value={xp} min={0} onChange={e => onXpUpdate(Math.max(0, parseInt(e.target.value) || 0))} style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-numeral)', fontSize: 16, color: xpReady ? '#c8b890' : 'rgba(200,184,144,0.6)', textAlign: 'right', width: 44, padding: 0, cursor: 'text' }} />
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 16, color: 'rgba(200,184,144,0.45)' }}>/ {nextXp}</span>
            </span>
          </div>
        </div>

        {/* Damage / heal */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
          <button onClick={() => applyHp(-step)} className="tactile" title="Aplicar dano" style={{ width: 64, minHeight: 52, flexShrink: 0, background: '#ff444c', border: 'none', borderRadius: 2, cursor: 'pointer', color: '#0a0805', fontSize: 24, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
          <input type="text" inputMode="numeric" value={String(step).padStart(2, '0')} onChange={e => { const n = parseInt(e.target.value, 10); setStep(isNaN(n) ? 0 : Math.max(0, n)) }} onBlur={() => { if (step < 1) setStep(1) }} title="Valor aplicado por clique" style={{ flex: 1, minWidth: 0, minHeight: 52, background: '#0a0805', border: '1px solid rgba(200,184,144,0.25)', borderRadius: 2, color: '#c8b890', fontFamily: 'var(--font-numeral)', fontSize: 24, textAlign: 'center', outline: 'none', boxSizing: 'border-box' }} />
          <button onClick={() => applyHp(step)} className="tactile" title="Curar" style={{ width: 64, minHeight: 52, flexShrink: 0, background: '#4FA98C', border: 'none', borderRadius: 2, cursor: 'pointer', color: '#0a0805', fontSize: 24, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
        </div>
      </div>
    </div>,
    document.body,
  )

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP — fixed left sidebar
  // ════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    return (
      <div style={{ position: 'fixed', left: 24, top: 80, width: 268, zIndex: 85, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100dvh - 96px)', paddingBottom: 24 }}>

        {/* Heading: class/ancestry + character name */}
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: '#6e5e35', letterSpacing: '1px', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {className} · {ancestryName}
          </p>
          <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 30, color: '#ff444c', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {characterName}
          </p>
        </div>

        {/* Portrait container with AC badge + HP bar overlays */}
        <div style={{ position: 'relative', width: 268, height: 356, background: '#18140c', border: '1px solid rgba(200,184,144,0.25)', flexShrink: 0 }}>
          <AvatarUpload
            characterId={characterId}
            portraitUrl={portraitUrl}
            size={268}
            height={356}
            onUpload={onAvatarUpload}
          />

          {/* AC badge — top-right overlay */}
          <div style={{ position: 'absolute', top: 5, right: 5, width: 52, height: 50, background: '#c8b890', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 5, pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: '#0a0805', lineHeight: 1 }}>AC</span>
            <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 20, color: '#0a0805', lineHeight: 1 }}>{ac}</span>
          </div>

          {/* HP bar — bottom overlay */}
          <div
            style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 36, overflow: 'hidden', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', cursor: 'pointer', zIndex: 5 }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            title={open ? 'Recolher controles' : 'Dano / Cura / XP'}
          >
            {/* Gold base */}
            <div style={{ position: 'absolute', inset: 0, background: '#c8b890' }} />
            {/* HP fill (red from left) */}
            <div
              key={flash ?? 'idle'}
              style={{ position: 'absolute', inset: 0, right: `${100 - hpPercent}%`, background: '#ff444c', transition: 'right 400ms cubic-bezier(0.4,0,0.2,1)' }}
            />
            {/* Text */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: '#0a0805', lineHeight: 1 }}>PV</span>
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 20, color: '#0a0805', lineHeight: 1 }}>
                <span
                  key={`flash-${flash ?? 'idle'}`}
                  className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''}
                  style={{ display: 'inline' }}
                >{hpCurrent}</span>
                <span style={{ color: 'rgba(10,9,5,0.7)' }}>/{hpMax}</span>
              </span>
              <span style={{ fontSize: 9, color: '#0a0805', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms', marginLeft: 2 }}>+</span>
            </div>
          </div>
        </div>

        {/* LV + EDITAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ background: '#0a0805', border: '1px solid #ff444c', padding: '4px 13px', display: 'flex', alignItems: 'center', gap: 4, height: 32, boxSizing: 'border-box' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#ff444c', lineHeight: 1 }}>LV</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 24, color: '#ff444c', lineHeight: 1 }}>{level}</span>
          </div>
          <Link
            href={editHref}
            style={{ fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', color: '#ff444c', textDecoration: 'underline', textUnderlineOffset: '2px', minHeight: 44, display: 'flex', alignItems: 'center' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            Editar
          </Link>
        </div>

        {/* Stats 2×3 grid */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 1fr)', height: 234 }}>
            {STAT_KEYS.map(key => (
              <button
                key={key}
                type="button"
                title={`Rolar ${STAT_FULL[key]}`}
                onClick={() => rollStat(key)}
                style={{ background: '#0a0805', border: '1px solid #c8b890', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '9px 3px 11px', cursor: onRoll ? 'pointer' : 'default', transition: 'background 150ms' }}
                onMouseEnter={e => { if (onRoll) e.currentTarget.style.background = 'rgba(200,184,144,0.07)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0a0805' }}
              >
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: '#6e5e35', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '15px' }}>{STAT_LABELS[key]}</span>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 24, color: '#c8b890', lineHeight: '26px', paddingTop: 2 }}>{modifierStr(stats[key])}</span>
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: '#6e5e35', lineHeight: '17px', paddingTop: 2 }}>{stats[key]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div style={{ height: 4 }} />

        {/* Luck row */}
        <div style={{ background: '#c8b890', width: '100%', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', padding: 6, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
          <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'space-between' }}>
            {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
              <button
                key={i}
                onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
                title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 24, lineHeight: '20px', color: i < luckTokens ? '#ff444c' : 'rgba(255,68,76,0.25)', transition: 'color 300ms', fontFamily: 'var(--font-body)', minHeight: 28 }}
              >
                ✦
              </button>
            ))}
          </div>
          <div style={{ flexShrink: 0, paddingLeft: 6, paddingRight: 2, display: 'flex', alignItems: 'center', minWidth: 62 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: '#0a0805', lineHeight: 1 }}>Fortuna</span>
          </div>
        </div>

        {/* HP / XP overlay */}
        {hpOverlay}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE — inline card at top of sheet content, same visual language as desktop
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Character heading */}
      <div style={{ paddingTop: 12 }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: '#6e5e35', letterSpacing: '0.07em', lineHeight: 1.4 }}>
          {className} · {ancestryName}
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: '#ff444c', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {characterName}
        </p>
      </div>

      {/* Portrait + stats row: portrait (with AC + HP overlays) | stats grid filling the rest */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>

        {/* Portrait */}
        <div style={{ position: 'relative', width: 160, height: 213, flexShrink: 0, background: '#18140c', border: '1px solid rgba(200,184,144,0.25)' }}>
          <AvatarUpload
            characterId={characterId}
            portraitUrl={portraitUrl}
            size={160}
            height={213}
            onUpload={onAvatarUpload}
          />

          {/* AC badge — top-right */}
          <div style={{ position: 'absolute', top: 5, right: 5, width: 44, height: 42, background: '#c8b890', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, zIndex: 5, pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: '#0a0805', lineHeight: 1 }}>AC</span>
            <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 18, color: '#0a0805', lineHeight: 1 }}>{ac}</span>
          </div>

          {/* HP bar — bottom */}
          <div
            style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 32, overflow: 'hidden', cursor: 'pointer', zIndex: 5 }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            title={open ? 'Recolher controles' : 'Dano / Cura / XP'}
          >
            <div style={{ position: 'absolute', inset: 0, background: '#c8b890' }} />
            <div key={flash ?? 'idle'} style={{ position: 'absolute', inset: 0, right: `${100 - hpPercent}%`, background: '#ff444c', transition: 'right 400ms cubic-bezier(0.4,0,0.2,1)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6px', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: '#0a0805', lineHeight: 1 }}>PV</span>
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 17, color: '#0a0805', lineHeight: 1 }}>
                <span key={`f-${flash ?? 'idle'}`} className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''} style={{ display: 'inline' }}>{hpCurrent}</span>
                <span style={{ color: 'rgba(10,9,5,0.7)' }}>/{hpMax}</span>
              </span>
              <span style={{ fontSize: 10, color: '#0a0805', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms', marginLeft: 1 }}>+</span>
            </div>
          </div>
        </div>

        {/* Stats 2×3 grid — fills the space beside the portrait, matching its height */}
        {stats && (
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 1fr)' }}>
            {STAT_KEYS.map(key => (
              <button
                key={key}
                type="button"
                title={`Rolar ${STAT_FULL[key]}`}
                onClick={() => rollStat(key)}
                style={{ background: '#0a0805', border: '1px solid #c8b890', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 3px', cursor: onRoll ? 'pointer' : 'default', transition: 'background 150ms', WebkitTapHighlightColor: 'transparent' }}
                onMouseEnter={e => { if (onRoll) e.currentTarget.style.background = 'rgba(200,184,144,0.07)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#0a0805' }}
              >
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: '#6e5e35', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '15px' }}>{STAT_LABELS[key]}</span>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 24, color: '#c8b890', lineHeight: '26px', paddingTop: 2 }}>{modifierStr(stats[key])}</span>
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: '#6e5e35', lineHeight: '15px', paddingTop: 2 }}>{stats[key]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LV + EDITAR — full-width row, mirroring the desktop control row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: '#0a0805', border: '1px solid #ff444c', padding: '4px 13px', display: 'flex', alignItems: 'center', gap: 4, height: 32, boxSizing: 'border-box' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: '#ff444c', lineHeight: 1 }}>LV</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 24, color: '#ff444c', lineHeight: 1 }}>{level}</span>
        </div>
        <Link
          href={editHref}
          onClick={e => e.stopPropagation()}
          style={{ fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', color: '#ff444c', textDecoration: 'underline', textUnderlineOffset: '2px', minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          Editar
        </Link>
      </div>

      {/* Luck bar */}
      <div style={{ background: '#c8b890', width: '100%', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', padding: 6, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
        <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
            <button
              key={i}
              onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
              title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 22, lineHeight: '20px', color: i < luckTokens ? '#ff444c' : 'rgba(255,68,76,0.25)', transition: 'color 300ms', fontFamily: 'var(--font-body)', minHeight: 30, WebkitTapHighlightColor: 'transparent' }}
            >
              ✦
            </button>
          ))}
        </div>
        <div style={{ flexShrink: 0, paddingLeft: 6, paddingRight: 2, display: 'flex', alignItems: 'center', minWidth: 60 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: '#0a0805', lineHeight: 1 }}>Fortuna</span>
        </div>
      </div>

      {/* HP / XP overlay */}
      {hpOverlay}
    </div>
  )
}
