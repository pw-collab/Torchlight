'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AvatarUpload } from '@/components/sheet/AvatarUpload'
import { modifier, modifierStr, rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

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
  onAvatarUpload: (url: string) => void | Promise<void>
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
          background: 'var(--background)',
          border: '2px solid var(--border)',
          borderRadius: 0,
          boxShadow: '0 12px 48px rgba(0,0,0,0.9)',
          padding: '18px 18px 20px',
          display: 'flex', flexDirection: 'column', gap: 16,
          cursor: 'default',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            Pontos de Vida
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="text-[15px] leading-none text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--bone-dim)]"
          >
            ✕
          </Button>
        </div>

        {/* XP bar */}
        <div>
          <Progress value={xpPct} className="gap-0" aria-label="Progresso de XP">
            <ProgressTrack className="h-2 rounded-none border border-[var(--border)] bg-black/50">
              <ProgressIndicator
                className={cn(
                  'transition-[width] duration-[400ms] ease-[var(--ease-ritual)]',
                  xpReady ? 'bg-[var(--bone-dim)] shadow-[0_0_6px_color-mix(in_oklch,var(--muted-foreground),transparent_60%)]' : 'bg-[var(--chart-2)]',
                )}
              />
            </ProgressTrack>
          </Progress>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>XP</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                type="number"
                value={xp}
                min={0}
                onChange={e => onXpUpdate(Math.max(0, parseInt(e.target.value) || 0))}
                aria-label="XP atual"
                className={cn(
                  'h-auto w-11 cursor-text border-none bg-transparent p-0 text-right text-base',
                  'font-[var(--font-numeral)]',
                  xpReady ? 'text-[var(--chart-1)]' : 'text-[var(--muted-foreground)]',
                )}
              />
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 16, color: 'var(--muted-foreground)' }}>/ {nextXp}</span>
            </span>
          </div>
        </div>

        {/* Damage / heal */}
        <div className="flex items-stretch gap-3">
          <Button
            onClick={() => applyHp(-step)}
            title="Aplicar dano"
            aria-label="Aplicar dano"
            className="tactile bg-destructive h-auto min-h-13 w-16 shrink-0 border-none px-0 text-2xl leading-none text-[var(--background)]"
          >
            ↓
          </Button>
          <Input
            type="text"
            inputMode="numeric"
            value={String(step).padStart(2, '0')}
            onChange={e => { const n = parseInt(e.target.value, 10); setStep(isNaN(n) ? 0 : Math.max(0, n)) }}
            onBlur={() => { if (step < 1) setStep(1) }}
            title="Valor aplicado por clique"
            aria-label="Valor aplicado por clique"
            className="bg-secondary border-border text-secondary-foreground h-auto min-h-13 min-w-0 flex-1 rounded-none text-center font-[var(--font-numeral)] text-2xl"
          />
          <Button
            onClick={() => applyHp(step)}
            title="Curar"
            aria-label="Curar"
            className="tactile text-background h-auto min-h-13 w-16 shrink-0 border-none bg-[var(--chart-2)] px-0 text-2xl leading-none"
          >
            ↑
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP — fills the two-column vitals track the parent page lays out to
  // the right of the main block (see CharacterSheetClient). Identity (name,
  // class, ancestry) and the Editar link live in the main block's header, so
  // this column carries only the portrait, its overlays and the stats.
  // ════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    return (
      <div className="vitals-stack">

        {/* Portrait container with LV / AC badges + HP bar overlays */}
        <div className="vitals-portrait">
          <AvatarUpload
            characterId={characterId}
            portraitUrl={portraitUrl}
            fluid
            onUpload={onAvatarUpload}
          />

          {/* LV badge — top-left overlay */}
          <div style={{ position: 'absolute', top: 5, left: 5, height: 34, background: 'var(--secondary)', border: '1px solid var(--destructive)', padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4, boxSizing: 'border-box', zIndex: 5, pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--destructive)', lineHeight: 1 }}>LV</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: 'var(--destructive)', lineHeight: 1 }}>{level}</span>
          </div>

          {/* AC badge — top-right overlay */}
          <div style={{ position: 'absolute', top: 5, right: 5, width: 52, height: 50, background: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 5, pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: 'var(--background)', lineHeight: 1 }}>AC</span>
            <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 20, color: 'var(--background)', lineHeight: 1 }}>{ac}</span>
          </div>

          {/* HP bar — bottom overlay */}
          <div
            style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 36, overflow: 'hidden', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', cursor: 'pointer', zIndex: 5 }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            title={open ? 'Recolher controles' : 'Dano / Cura / XP'}
          >
            {/* Gold base */}
            <div style={{ position: 'absolute', inset: 0, background: 'var(--muted-foreground)' }} />
            {/* HP fill (red from left) */}
            <div
              key={flash ?? 'idle'}
              style={{ position: 'absolute', inset: 0, right: `${100 - hpPercent}%`, background: 'var(--destructive)', transition: 'right 400ms cubic-bezier(0.4,0,0.2,1)' }}
            />
            {/* Text */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 8px', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: 'var(--background)', lineHeight: 1 }}>PV</span>
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 20, color: 'var(--background)', lineHeight: 1 }}>
                <span
                  key={`flash-${flash ?? 'idle'}`}
                  className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''}
                  style={{ display: 'inline' }}
                >{hpCurrent}</span>
                <span style={{ color: 'var(--background)' }}>/{hpMax}</span>
              </span>
              <span style={{ fontSize: 9, color: 'var(--background)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms', marginLeft: 2 }}>+</span>
            </div>
          </div>
        </div>

        {/* Stats + Fortuna: stacked under the portrait on wide screens, beside
            it once the column goes full-width (see .vitals-* in globals.css) */}
        <div className="vitals-meta">
          {/* Stats 2×3 grid */}
          {stats && (
            <div className="vitals-stats">
              {STAT_KEYS.map(key => (
                <Button
                  key={key}
                  type="button"
                  variant="secondary"
                  title={`Rolar ${STAT_FULL[key]}`}
                  onClick={() => rollStat(key)}
                  className={cn(
                    'h-auto min-w-0 flex-col items-center justify-center gap-0 px-[3px] pt-[9px] pb-[11px] transition-colors duration-150',
                    'hover:bg-[var(--border)]',
                    onRoll ? 'cursor-pointer' : 'cursor-default',
                  )}
                >
                  <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: 'var(--muted-foreground)', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '15px' }}>{STAT_LABELS[key]}</span>
                  <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 24, color: 'var(--muted-foreground)', lineHeight: '26px', paddingTop: 2 }}>{modifierStr(stats[key])}</span>
                  <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: 'var(--muted-foreground)', lineHeight: '17px', paddingTop: 2 }}>{stats[key]}</span>
                </Button>
              ))}
            </div>
          )}

          {/* Fortuna — the only survivor of the old control row: LV moved onto
              the portrait and Editar onto the main block's header. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'var(--secondary)', border: '1px solid var(--border)', padding: '4px 8px', boxSizing: 'border-box' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: 'var(--muted-foreground)', lineHeight: 1, flexShrink: 0 }}>Fortuna</span>
            <div style={{ display: 'flex', gap: 2, minWidth: 0 }}>
              {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
                  title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
                  aria-label={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
                  className={cn(
                    'font-sans h-6 w-auto min-w-0 px-1 text-xl leading-6 transition-colors duration-300 hover:bg-transparent',
                    i < luckTokens ? 'text-destructive' : 'text-[var(--destructive)]/25',
                  )}
                >
                  ✦
                </Button>
              ))}
            </div>
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
        <p style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--muted-foreground)', letterSpacing: '0.07em', lineHeight: 1.4 }}>
          {className} · {ancestryName}
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: 'var(--destructive)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {characterName}
        </p>
      </div>

      {/* Portrait + stats row: portrait (with AC + HP overlays) | stats grid filling the rest */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>

        {/* Portrait */}
        <div style={{ position: 'relative', width: 160, height: 213, flexShrink: 0, background: 'var(--background)' }}>
          <AvatarUpload
            characterId={characterId}
            portraitUrl={portraitUrl}
            size={160}
            height={213}
            onUpload={onAvatarUpload}
          />

          {/* AC badge — top-right */}
          <div style={{ position: 'absolute', top: 5, right: 5, width: 44, height: 42, background: 'var(--muted-foreground)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, zIndex: 5, pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--background)', lineHeight: 1 }}>AC</span>
            <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 18, color: 'var(--background)', lineHeight: 1 }}>{ac}</span>
          </div>

          {/* HP bar — bottom */}
          <div
            style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 32, overflow: 'hidden', cursor: 'pointer', zIndex: 5 }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            title={open ? 'Recolher controles' : 'Dano / Cura / XP'}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'var(--muted-foreground)' }} />
            <div key={flash ?? 'idle'} style={{ position: 'absolute', inset: 0, right: `${100 - hpPercent}%`, background: 'var(--destructive)', transition: 'right 400ms cubic-bezier(0.4,0,0.2,1)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6px', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--background)', lineHeight: 1 }}>PV</span>
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 17, color: 'var(--background)', lineHeight: 1 }}>
                <span key={`f-${flash ?? 'idle'}`} className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''} style={{ display: 'inline' }}>{hpCurrent}</span>
                <span style={{ color: 'var(--background)' }}>/{hpMax}</span>
              </span>
              <span style={{ fontSize: 10, color: 'var(--background)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms', marginLeft: 1 }}>+</span>
            </div>
          </div>
        </div>

        {/* Stats 2×3 grid — fills the space beside the portrait, matching its height */}
        {stats && (
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)' }}>
            {STAT_KEYS.map(key => (
              <Button
                key={key}
                type="button"
                variant="secondary"
                title={`Rolar ${STAT_FULL[key]}`}
                onClick={() => rollStat(key)}
                className={cn(
                  'h-auto flex-col items-center justify-center gap-0 px-[3px] py-1 transition-colors duration-150',
                  'hover:bg-[var(--border)]',
                  onRoll ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: 'var(--muted-foreground)', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '15px' }}>{STAT_LABELS[key]}</span>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 24, color: 'var(--muted-foreground)', lineHeight: '26px', paddingTop: 2 }}>{modifierStr(stats[key])}</span>
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: 'var(--muted-foreground)', lineHeight: '15px', paddingTop: 2 }}>{stats[key]}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* LV + EDITAR — full-width row, mirroring the desktop control row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: 'var(--secondary)', border: '1px solid var(--destructive)', padding: '4px 13px', display: 'flex', alignItems: 'center', gap: 4, height: 32, boxSizing: 'border-box' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--destructive)', lineHeight: 1 }}>LV</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 24, color: 'var(--destructive)', lineHeight: 1 }}>{level}</span>
        </div>
        <Link
          href={editHref}
          onClick={e => e.stopPropagation()}
          style={{ fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--destructive)', textDecoration: 'underline', textUnderlineOffset: '2px', minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          Editar
        </Link>
      </div>

      {/* Luck bar */}
      <div style={{ background: 'var(--muted-foreground)', width: '100%', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', padding: 6, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
        <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
            <Button
              key={i}
              variant="ghost"
              onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
              title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
              aria-label={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
              className={cn(
                'font-sans h-auto min-h-[30px] w-auto px-0.5 text-[22px] leading-5 transition-colors duration-300 hover:bg-transparent',
                i < luckTokens ? 'text-destructive' : 'text-[var(--destructive)]/25',
              )}
            >
              ✦
            </Button>
          ))}
        </div>
        <div style={{ flexShrink: 0, paddingLeft: 6, paddingRight: 2, display: 'flex', alignItems: 'center', minWidth: 60 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: 'var(--background)', lineHeight: 1 }}>Fortuna</span>
        </div>
      </div>

      {/* HP / XP overlay */}
      {hpOverlay}
    </div>
  )
}
