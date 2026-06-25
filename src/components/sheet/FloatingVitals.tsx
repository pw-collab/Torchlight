'use client'

import { useState, useEffect, useRef } from 'react'
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

const PORTRAIT_RING_RADIUS = 12
const SHIELD_CLIP = 'polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%)'
const TEXT_REFLECT = 'below -4px linear-gradient(transparent 62%, rgba(0,0,0,0.3))'

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

  const hpPercent = hpMax > 0 ? Math.max(0, (hpCurrent / hpMax) * 100) : 0
  const hpColor = hpPercent > 50 ? 'var(--verdigris-bright)' : hpPercent > 25 ? 'var(--candle-amber)' : 'var(--blood-bright)'

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

  // Mobile sizes
  const sz = isMobile
    ? { avatar: 104, badge: 32, badgeFont: 14, name: 22, bar: 30, barNum: 16, shieldW: 44, shieldH: 52, acFont: 19, star: 17, meta: 14 }
    : { avatar: 132, badge: 40, badgeFont: 18, name: 26, bar: 36, barNum: 20, shieldW: 52, shieldH: 62, acFont: 23, star: 21, meta: 16 }

  // ── Expanded panel: XP + HP controls ─────────────────────────────────────
  const expandedPanel = open && (
    <div
      className="animate-ink-spread"
      onClick={e => e.stopPropagation()}
      style={{ background: '#1F1B16', border: '2px solid rgba(196,32,32,0.85)', borderRadius: 2, boxShadow: '0 8px 30px rgba(0,0,0,0.65)', padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 14, cursor: 'default' }}
    >
      {/* XP bar */}
      <div>
        <div aria-hidden style={{ height: 8, background: 'rgba(0,0,0,0.5)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${xpPct}%`, background: xpReady ? 'var(--gold-bright)' : 'var(--verdigris-bright)', boxShadow: xpReady ? '0 0 6px var(--gold-bright)' : 'none', transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.18em', color: 'var(--bone-muted)' }}>XP</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <input type="number" value={xp} min={0} onChange={e => onXpUpdate(Math.max(0, parseInt(e.target.value) || 0))} style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 12, color: xpReady ? 'var(--gold-bright)' : 'var(--bone-muted)', textAlign: 'right', width: 36, padding: 0, cursor: 'text' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', color: 'var(--bone-muted)' }}>/ {nextXp}</span>
          </span>
        </div>
      </div>
      {/* Damage / heal */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <button onClick={() => applyHp(-step)} className="tactile" title="Aplicar dano" style={{ width: 64, minHeight: 52, flexShrink: 0, background: 'var(--blood-bright)', border: 'none', borderRadius: 2, cursor: 'pointer', color: '#F5F0E8', fontSize: 24, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↓</button>
        <input type="text" inputMode="numeric" value={String(step).padStart(2, '0')} onChange={e => { const n = parseInt(e.target.value, 10); setStep(isNaN(n) ? 0 : Math.max(0, n)) }} onBlur={() => { if (step < 1) setStep(1) }} title="Valor aplicado por clique" style={{ flex: 1, minWidth: 0, minHeight: 52, background: 'rgba(16,11,5,0.9)', border: '1px solid var(--gold-oxidized)', borderRadius: 2, color: 'var(--parchment-pale)', fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, textAlign: 'center', letterSpacing: '0.12em', outline: 'none', boxSizing: 'border-box' }} />
        <button onClick={() => applyHp(step)} className="tactile" title="Curar" style={{ width: 64, minHeight: 52, flexShrink: 0, background: 'var(--verdigris-bright)', border: 'none', borderRadius: 2, cursor: 'pointer', color: '#F5F0E8', fontSize: 24, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↑</button>
      </div>
    </div>
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
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: '#0a0805', lineHeight: 1 }}>{ac}</span>
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
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: '#0a0805', lineHeight: 1 }}>
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
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6e5e35', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '15px' }}>{STAT_LABELS[key]}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 24, color: '#c8b890', lineHeight: '26px', paddingTop: 2 }}>{modifierStr(stats[key])}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#6e5e35', lineHeight: '17px', paddingTop: 2 }}>{stats[key]}</span>
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

        {/* Expanded panel */}
        {expandedPanel}
      </div>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE — inline at top of sheet content
  // ════════════════════════════════════════════════════════════════════════
  const mainBlock = (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {/* Portrait with ring + level badge */}
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: sz.avatar, height: sz.avatar, flexShrink: 0, cursor: 'default' }}>
        <div aria-hidden style={{ position: 'absolute', inset: -4, borderRadius: PORTRAIT_RING_RADIUS, background: 'linear-gradient(140deg, #E04848 0%, var(--blood-bright) 35%, #6E1010 100%)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.55))' }} />
        <div style={{ position: 'absolute', inset: 0 }}>
          <AvatarUpload characterId={characterId} portraitUrl={portraitUrl} size={sz.avatar} onUpload={onAvatarUpload} />
        </div>
        <div style={{ position: 'absolute', left: 0, bottom: sz.avatar * 0.06, width: sz.badge, height: sz.badge, borderRadius: '50%', background: '#140E08', border: '3px solid var(--blood-bright)', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.6)', zIndex: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: sz.badgeFont, fontWeight: 700, color: 'var(--blood-bright)', lineHeight: 1 }}>{level}</span>
        </div>
      </div>

      {/* Right column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: sz.name, color: 'var(--gold-bright)', letterSpacing: '0.04em', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textShadow: '0 2px 4px rgba(0,0,0,0.6)', WebkitBoxReflect: TEXT_REFLECT }}>{characterName}</span>

        {/* PV bar + AC shield */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0, height: sz.bar, background: 'rgba(8,6,4,0.8)', borderRadius: 2, overflow: 'hidden', boxShadow: '0 3px 8px rgba(0,0,0,0.5)' }}>
            <div aria-hidden style={{ position: 'absolute', inset: 0, width: `${hpPercent}%`, background: hpColor, transition: 'width 400ms cubic-bezier(0.4,0,0.2,1), background 400ms' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.24em', textTransform: 'uppercase', color: 'rgba(16,12,4,0.85)', flexShrink: 0 }}>PV</span>
              <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: sz.barNum, fontWeight: 700, lineHeight: 1 }}>
                <span key={flash ?? 'idle'} className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''} style={{ display: 'inline-block', color: '#2E2407' }}>{hpCurrent}</span>
                <span style={{ fontWeight: 400, color: 'rgba(16,12,4,0.7)' }}>/{hpMax}</span>
              </span>
              <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }} title={open ? 'Recolher controles' : 'Dano / Cura / XP'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(16,12,4,0.85)', fontSize: sz.barNum * 0.8, lineHeight: 1, padding: '2px 2px', flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms' }}>+</button>
            </div>
          </div>
          <div title={`Classe de Armadura ${ac}`} style={{ width: sz.shieldW, height: sz.shieldH, clipPath: SHIELD_CLIP, background: 'linear-gradient(160deg, #D43838 0%, var(--blood-bright) 45%, #8B1515 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: sz.shieldH * 0.2, boxSizing: 'border-box', flexShrink: 0, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.55))' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: sz.acFont, fontWeight: 700, color: '#10100C', lineHeight: 1 }}>{ac}</span>
          </div>
        </div>

        {/* Luck stars */}
        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 7, cursor: 'default' }}>
          {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
            <button key={i} onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)} className="tactile" title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: sz.star, lineHeight: 1, color: i < luckTokens ? 'var(--gold-bright)' : '#1A1410', filter: i < luckTokens ? 'drop-shadow(0 0 4px rgba(201,168,76,0.55))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))', transition: 'color 300ms, filter 300ms' }}>✦</button>
          ))}
        </div>

        {/* Class · Ancestry + Editar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: sz.meta, color: 'var(--gold-oxidized)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0, lineHeight: 1.2, WebkitBoxReflect: TEXT_REFLECT }}>{className} · {ancestryName}</span>
          <Link href={editHref} onClick={e => e.stopPropagation()} style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--parchment-warm)', background: 'rgba(226,212,172,0.12)', border: '1px solid var(--blood-bright)', borderRadius: 1, padding: '6px 14px', textDecoration: 'none', flexShrink: 0, transition: 'all 200ms' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,212,172,0.22)'; e.currentTarget.style.color = 'var(--bone-white)' }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(226,212,172,0.12)'; e.currentTarget.style.color = 'var(--parchment-warm)' }}>Editar</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {mainBlock}
      {expandedPanel}
    </div>
  )
}
