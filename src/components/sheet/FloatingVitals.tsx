'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AvatarUpload } from '@/components/sheet/AvatarUpload'
import { FortuneBar } from '@/components/sheet/FortuneBar'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { modifier, modifierStr, rollWithMode } from '@/lib/dice'
import type { RollMode, RollResult } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import { STAT_FULL, STAT_KEYS, STAT_LABELS } from '@/data/stats'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { FavouriteIcon, MinusPlus02Icon } from '@hugeicons/core-free-icons'
import { Divider } from '@/components/shared/Divider'

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
  /** Desktop: what sits under the attributes (the active conditions). */
  footer?: ReactNode
}


/**
 * One attribute on the desktop vitals (the Figma's Attribute Button, 181:625):
 * the modifier large on top, since it is what gets added to the roll, and the
 * abbreviation with the raw score along the foot. Pressing it opens the
 * normal / advantage / disadvantage menu.
 */
function AttributeTile({ stat, score, onRoll }: {
  stat: Stat
  score: number
  onRoll?: (mode: RollMode) => void
}) {
  return (
    <RollModeMenu label={`Rolar ${STAT_FULL[stat]}`} disabled={!onRoll} onRoll={mode => onRoll?.(mode)}>
      {/* Drawn as a button, not one: the menu trigger around it is the control. */}
      <span
        title={`Rolar ${STAT_FULL[stat]}`}
        className={cn(
          buttonVariants({ variant: 'secondary' }),
          'h-full w-full min-w-0 flex-col items-center justify-between gap-0 p-1 transition-colors duration-150',
          'border-2 border-[var(--border-frame)] bg-[var(--bg-raised)] hover:border-[var(--border-control)]',
          onRoll ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <span className="type-display-lg text-foreground normal-case" style={{ lineHeight: '26px' }}>
          {modifierStr(score)}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] leading-[1.5] tracking-[0.12em] uppercase">
          <span className="text-muted-foreground font-normal">{STAT_LABELS[stat]}</span>
          <span className="font-medium text-[var(--accent-foreground)]">{score}</span>
        </span>
      </span>
    </RollModeMenu>
  )
}

/** The Armour Class shield from the Figma (243:1943): ember, 52px, the number inked on it. */
function ArmorShield({ ac }: { ac: number }) {
  return (
    <div
      aria-label={`Classe de armadura ${ac}`}
      role="img"
      style={{ position: 'absolute', top: 6, right: 6, width: 52, height: 52, zIndex: 5, pointerEvents: 'none', display: 'grid', placeItems: 'center' }}
    >
      <svg aria-hidden viewBox="0 0 44 50" width={44} height={50} style={{ position: 'absolute', top: 1, left: 4 }}>
        <path d="M22 1 L42 7 V24 C42 37 33 45 22 49 C11 45 2 37 2 24 V7 Z" fill="var(--ember)" stroke="var(--border-frame)" strokeWidth={2} />
      </svg>
      <span className="type-display-md text-[var(--ember-foreground)]" style={{ position: 'relative', lineHeight: 1, marginTop: -2 }}>{ac}</span>
    </div>
  )
}

export function FloatingVitals({
  ac, hpMax, hpCurrent, luckTokens, onHpChange, onLuckChange,
  characterId, portraitUrl, characterName, level, xp, onXpUpdate,
  className, ancestryName, onAvatarUpload, editHref,
  stats, onRoll, footer,
}: Props) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [entry, setEntry] = useState('')

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
    if (delta === 0) return
    onHpChange(Math.min(hpMax, Math.max(0, hpCurrent + delta)))
  }

  /**
   * Dano por digitação (§5.5). O campo aceita `11`, `-11` e `+5`, e o Enter
   * aplica — tomar onze de dano eram onze cliques, o que no celular é a
   * diferença entre usar e não usar o app. Dano é o padrão: é o que a mesa
   * digita noventa por cento das vezes.
   *
   * As setas continuam valendo, usando o que estiver escrito (ou 1, para o
   * ajuste de um ponto continuar sendo um toque só).
   */
  const typed = Math.abs(parseInt(entry, 10))
  const amount = Number.isFinite(typed) && typed > 0 ? typed : 1

  function submitEntry() {
    if (!Number.isFinite(typed) || typed === 0) return
    applyHp(entry.trim().startsWith('+') ? typed : -typed)
    setEntry('')
  }

  function applyFromButton(sign: 1 | -1) {
    applyHp(sign * amount)
    setEntry('')
  }

  function rollStat(stat: Stat, mode: RollMode) {
    if (!onRoll) return
    onRoll(rollWithMode('d20', STAT_FULL[stat], STAT_LABELS[stat], modifier(stats![stat]), mode))
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
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
            Pontos de Vida
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="text-muted-foreground hover:text-foreground text-[15px] leading-none hover:bg-transparent"
          >
            ✕
          </Button>
        </div>

        {/* XP bar */}
        <div>
          <Progress value={xpPct} className="gap-0" aria-label="Progresso de XP">
            <ProgressTrack className="border-border bg-input h-2 rounded-none border">
              <ProgressIndicator
                className={cn(
                  'transition-[width] duration-[400ms] ease-[var(--ease-ritual)]',
                  xpReady ? 'bg-[var(--chart-1)] shadow-[0_0_6px_color-mix(in_oklch,var(--chart-1),transparent_60%)]' : 'bg-[var(--chart-2)]',
                )}
              />
            </ProgressTrack>
          </Progress>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>XP</span>
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

        {/* Damage / heal — digite e dê Enter, ou use as setas */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-stretch gap-3">
            <Button
              onClick={() => applyFromButton(-1)}
              title={`Aplicar ${amount} de dano`}
              aria-label={`Aplicar ${amount} de dano`}
              className="tactile bg-destructive h-auto min-h-13 w-16 shrink-0 border-none px-0 text-2xl leading-none text-[var(--background)]"
            >
              ↓
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={entry}
              onChange={e => {
                const next = e.target.value.replace(/[^0-9+-]/g, '')
                if (/^[+-]?\d{0,3}$/.test(next)) setEntry(next)
              }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitEntry() } }}
              placeholder="−11"
              title="Quanto aplicar — Enter tira, +5 cura"
              aria-label="Quanto aplicar. Um número tira vida, com mais na frente cura, Enter aplica."
              className="bg-secondary border-border text-secondary-foreground placeholder:text-muted-foreground h-auto min-h-13 min-w-0 flex-1 rounded-none text-center font-[var(--font-numeral)] text-2xl"
            />
            <Button
              onClick={() => applyFromButton(1)}
              title={`Curar ${amount}`}
              aria-label={`Curar ${amount}`}
              className="tactile text-background h-auto min-h-13 w-16 shrink-0 border-none bg-[var(--chart-2)] px-0 text-2xl leading-none"
            >
              ↑
            </Button>
          </div>
          <p className="font-body text-muted-foreground text-center text-[10px] leading-tight italic">
            Enter tira vida · <span className="font-mono">+5</span> cura
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )

  // ════════════════════════════════════════════════════════════════════════
  // DESKTOP: the vitals column of the character card (Figma 137:877). The
  // page sets these straight into the column, which lays them out with its
  // 16px gap: portrait with the AC shield, the HP block, a rule, the six
  // attributes, a rule, then whatever the page hangs underneath.
  // ════════════════════════════════════════════════════════════════════════
  if (!isMobile) {
    return (
      <>
        <div className="vitals-portrait">
          <AvatarUpload
            characterId={characterId}
            portraitUrl={portraitUrl}
            fluid
            onUpload={onAvatarUpload}
          />
          <ArmorShield ac={ac} />
        </div>

        {/* HP (the Figma's HP bar, 250:1017): the heart, the points left over
            the maximum, and the way into damage / heal / XP. */}
        <div
          className="flex shrink-0 items-center justify-between gap-1.5 border-2 border-[var(--border-frame)] bg-[var(--bg-raised)] px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <HugeiconsIcon icon={FavouriteIcon} size={32} strokeWidth={1.5} className="shrink-0 fill-[var(--ember)] text-[var(--ember)]" />
            <span className="type-display-xl text-foreground" style={{ lineHeight: 1.2 }}>
              <span
                key={`flash-${flash ?? 'idle'}`}
                className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''}
                style={{ display: 'inline-block' }}
              >{hpCurrent}</span>
            </span>
            <span className="type-display-md text-muted-foreground">/{hpMax}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            title={open ? 'Recolher controles' : 'Dano / Cura / XP'}
            aria-label={`Pontos de vida: ${hpCurrent} de ${hpMax}. Abrir dano, cura e XP.`}
            className="bg-muted text-foreground size-10 min-h-10 shrink-0 border-2 border-[var(--foreground)] p-0 [&_svg]:size-6"
          >
            <HugeiconsIcon icon={MinusPlus02Icon} size={24} strokeWidth={1.5} />
          </Button>
        </div>

        <Divider />

        {stats && (
          <div className="vitals-stats">
            {STAT_KEYS.map(key => (
              <AttributeTile
                key={key}
                stat={key}
                score={stats[key]}
                onRoll={onRoll ? mode => rollStat(key, mode) : undefined}
              />
            ))}
          </div>
        )}

        <Divider />

        {footer}

        {/* HP / XP overlay */}
        {hpOverlay}
      </>
    )
  }

  // ════════════════════════════════════════════════════════════════════════
  // MOBILE — inline card at top of sheet content, same visual language as desktop
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Character heading */}
      <div style={{ paddingTop: 12 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, color: 'var(--muted-foreground)', letterSpacing: '0.07em', lineHeight: 1.4 }}>
          {className} · {ancestryName}
        </p>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 28, color: 'var(--foreground)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          <div style={{ position: 'absolute', top: 5, right: 5, width: 44, height: 42, background: 'var(--secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, zIndex: 5, pointerEvents: 'none' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--secondary-foreground)', lineHeight: 1 }}>AC</span>
            <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 18, color: 'var(--secondary-foreground)', lineHeight: 1 }}>{ac}</span>
          </div>

          {/* HP bar — bottom */}
          <div
            style={{ position: 'absolute', bottom: 5, left: 5, right: 5, height: 32, overflow: 'hidden', cursor: 'pointer', zIndex: 5 }}
            onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
            title={open ? 'Recolher controles' : 'Dano / Cura / XP'}
          >
            <div style={{ position: 'absolute', inset: 0, background: 'var(--chart-2)' }} />
            <div key={flash ?? 'idle'} style={{ position: 'absolute', inset: 0, right: `${100 - hpPercent}%`, background: 'var(--primary)', transition: 'right 400ms cubic-bezier(0.4,0,0.2,1)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 6px', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 8, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--primary-foreground)', lineHeight: 1 }}>PV</span>
              <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 17, color: 'var(--primary-foreground)', lineHeight: 1 }}>
                <span key={`f-${flash ?? 'idle'}`} className={flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''} style={{ display: 'inline' }}>{hpCurrent}</span>
                <span style={{ color: 'var(--primary-foreground)' }}>/{hpMax}</span>
              </span>
              <span style={{ fontSize: 10, color: 'var(--primary-foreground)', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 200ms', marginLeft: 1 }}>+</span>
            </div>
          </div>
        </div>

        {/* Stats 2×3 grid — fills the space beside the portrait, matching its
            height. The --input fill is the grid's, the tiles only rule it. */}
        {stats && (
          <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', background: 'var(--input)' }}>
            {STAT_KEYS.map(key => (
              <RollModeMenu
                key={key}
                label={`Rolar ${STAT_FULL[key]}`}
                disabled={!onRoll}
                onRoll={mode => rollStat(key, mode)}
              >
              <span
                title={`Rolar ${STAT_FULL[key]}`}
                className={cn(
                  buttonVariants({ variant: 'secondary' }),
                  'h-full w-full flex-col items-center justify-center gap-0 px-[3px] py-1 transition-colors duration-150',
                  'border-input-border hover:border-ring bg-transparent',
                  onRoll ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: 'var(--muted-foreground)', letterSpacing: '1.2px', textTransform: 'uppercase', lineHeight: '15px' }}>{STAT_LABELS[key]}</span>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 24, color: 'var(--muted-foreground)', lineHeight: '26px', paddingTop: 2 }}>{modifierStr(stats[key])}</span>
                <span style={{ fontFamily: 'var(--font-stat)', fontSize: 10, color: 'var(--muted-foreground)', lineHeight: '15px', paddingTop: 2 }}>{stats[key]}</span>
              </span>
              </RollModeMenu>
            ))}
          </div>
        )}
      </div>

      {/* LV + EDITAR — full-width row, mirroring the desktop control row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ background: 'var(--secondary)', border: '1px solid var(--border)', padding: '4px 13px', display: 'flex', alignItems: 'center', gap: 4, height: 32, boxSizing: 'border-box' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 9, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--secondary-foreground)', lineHeight: 1 }}>LV</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 24, color: 'var(--secondary-foreground)', lineHeight: 1 }}>{level}</span>
        </div>
        <Link
          href={editHref}
          onClick={e => e.stopPropagation()}
          style={{ fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--card-foreground)', textDecoration: 'underline', textUnderlineOffset: '2px', minHeight: 44, display: 'flex', alignItems: 'center' }}
        >
          Editar
        </Link>
      </div>

      {/* Luck bar — phones keep it inside the vitals block, since there is no
          second column to give it a row of its own. */}
      <FortuneBar luckTokens={luckTokens} onLuckChange={onLuckChange} />

      {/* HP / XP overlay */}
      {hpOverlay}
    </div>
  )
}
