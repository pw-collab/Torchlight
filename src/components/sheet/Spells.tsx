'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { MagicWand01Icon } from '@hugeicons/core-free-icons'
import { getSpell, getSpellsForClass } from '@/data/spells/index'
import type { Spell } from '@/data/spells/index'
import { rollDie, modifier } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { NumInput } from '@/components/sheet/NumInput'
import { FACE_CLEARANCE, FACE_FADE, POPOVER_BODY } from '@/components/shared/GlyphCard'
import { RollableText } from '@/components/shared/RollableText'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Item } from '@/components/ui/item'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

const TIER_LABEL = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

const STAT_OPTIONS = [
  { value: 'str', label: 'Força' },
  { value: 'dex', label: 'Destreza' },
  { value: 'con', label: 'Constituição' },
  { value: 'int', label: 'Inteligência' },
  { value: 'wis', label: 'Sabedoria' },
  { value: 'cha', label: 'Carisma' },
]

// ─── Spell Picker Modal ───────────────────────────────────────────────────────

function SpellPickerModal({ available, learned, onLearn, onClose }: {
  available: Spell[]
  learned: string[]
  onLearn: (id: string) => void
  onClose: () => void
}) {
  const [query, setQuery]           = useState('')
  const [tierFilter, setTierFilter] = useState<number | null>(null)

  const tiers = [...new Set(available.map(s => s.tier))].sort((a, b) => a - b)

  const q = query.toLowerCase().trim()
  const filtered = available
    .filter(s => !learned.includes(s.id))
    .filter(s => tierFilter === null || s.tier === tierFilter)
    .filter(s => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))

  const tierPill = (active: boolean) =>
    cn(
      'font-mono h-auto shrink-0 rounded-sm border px-2.5 py-[3px] text-[11px] font-bold',
      'tracking-normal normal-case transition-all duration-[180ms]',
      active
        ? 'border-[var(--chart-4)] bg-[var(--chart-4)]/15 text-[var(--foreground)]'
        : 'border-[var(--chart-4)] bg-[var(--muted)] text-[var(--muted-foreground)]',
    )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="worn-border"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.85)',
          padding: '16px 16px',
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          gap: 10,
        }}
      >
        {/* Header */}
        <div>
          <p style={{ color: 'var(--chart-1)', fontSize: 10 }}>Aprender Magia</p>
        </div>

        {/* Search */}
        <Input
          autoFocus
          type="text"
          placeholder="Buscar por nome ou descrição..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Buscar magia"
          className="h-auto rounded-sm border-[var(--chart-4)] bg-[var(--card)] px-2.5 py-1.5 text-[11px] text-[var(--foreground)]"
        />

        {/* Tier filter pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => setTierFilter(null)} className={tierPill(tierFilter === null)}>
            Todas
          </Button>
          {tiers.map(t => (
            <Button
              key={t}
              variant="outline"
              onClick={() => setTierFilter(tierFilter === t ? null : t)}
              className={tierPill(tierFilter === t)}
            >
              {TIER_LABEL[t - 1] ?? t}
            </Button>
          ))}
        </div>

        {/* Count */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-foreground)', marginTop: -4 }}>
          {filtered.length} magia{filtered.length !== 1 ? 's' : ''} disponíve{filtered.length !== 1 ? 'is' : 'l'}
        </div>

        {/* Spell list */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filtered.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted-foreground)', padding: '8px 0' }}>
              Nenhuma magia encontrada.
            </p>
          )}
          {filtered.map(spell => (
            <Item
              key={spell.id}
              render={<button type="button" onClick={() => { onLearn(spell.id); onClose() }} />}
              variant="outline"
              size="sm"
              className={cn(
                'w-full cursor-pointer items-start gap-2 rounded-sm px-2.5 py-2 text-left',
                'border-[var(--chart-4)] bg-[var(--muted)] transition-all duration-[160ms]',
                'hover:border-[var(--chart-4)] hover:bg-[var(--chart-4)]',
              )}
            >
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                fontWeight: 700,
                color: 'var(--muted-foreground)',
                background: 'color-mix(in oklch, var(--chart-4), transparent 85%)',
                border: '1px solid var(--chart-4)',
                padding: '1px 5px',
                borderRadius: 1,
                flexShrink: 0,
                marginTop: 1,
              }}>
                {TIER_LABEL[spell.tier - 1] ?? spell.tier}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--muted-foreground)', letterSpacing: '0.03em', marginBottom: 2 }}>
                  {spell.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-foreground)' }}>
                  {spell.school && `${spell.school} · `}DC {10 + spell.tier}
                  {spell.range && ` · ${spell.range}`}
                  {spell.duration && ` · ${spell.duration}`}
                </div>
              </div>
            </Item>
          ))}
        </div>

        <Button
          variant="outline"
          onClick={onClose}
          className="h-auto w-full rounded-sm border-[var(--chart-4)] bg-[var(--muted)] py-[7px] text-[8px] tracking-[0.12em] text-[var(--muted-foreground)]"
        >
          Fechar
        </Button>
      </div>
    </div>
  )
}

// ─── Spell Card (replicates ClassPanel's TechniqueCard grid + popover) ────────

const SPELL_STYLE = {
  normal: 'var(--chart-1)',
  failed: 'var(--destructive)',
}

function SpellCard({
  id, spell, isFailed, castingAttr, spellcastingBonus, stats, onRoll,
  onForget, onFail, onRecover,
}: {
  id: string
  spell: Spell | undefined
  isFailed: boolean
  castingAttr: string
  spellcastingBonus: number
  stats?: Record<string, number>
  onRoll?: (r: RollResult) => void
  onForget?: () => void
  onFail: () => void
  onRecover: () => void
}) {
  const color = isFailed ? SPELL_STYLE.failed : SPELL_STYLE.normal
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [open])

  const name    = spell?.name ?? id
  const tier    = spell ? (TIER_LABEL[spell.tier - 1] ?? String(spell.tier)) : '·'
  const dc      = spell ? 10 + spell.tier : null
  const school  = spell?.school ?? 'Arcano'

  function cast() {
    if (!spell || !onRoll || !stats) return
    const castMod  = modifier(stats[castingAttr] ?? 10) + spellcastingBonus
    const spellDC  = 10 + spell.tier
    const result   = rollDie('d20', `Conjurar: ${spell.name}`, `DC ${spellDC}`, castMod)
    result.isCritical = result.result === 20
    result.isFumble   = result.result === 1
    onRoll(result)
    if (result.total < spellDC) onFail()
  }

  const popover = open
    ? createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-ink-spread"
            style={{ position: 'absolute', inset: 0, margin: 'auto', background: 'var(--secondary)', border: '1px solid var(--border)', boxShadow: '0 4px 7px rgba(0,0,0,0.65)', padding: 4, width: 'min(340px, calc(100vw - 32px))', height: 'min(400px, calc(100dvh - 32px))', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ border: '1px solid var(--border)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 9px 12px' }}>
              {/* Heading */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
                <span style={{ width: 32, height: 32, flexShrink: 0, border: `1px solid ${color}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 13, color, lineHeight: 1 }}>
                  {tier}
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1 }}>
                    {isFailed ? 'Falhou' : `${school}${dc != null ? ` · DC ${dc}` : ''}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                  className="shrink-0 text-sm leading-none text-[var(--muted-foreground)] hover:bg-transparent hover:text-[var(--foreground)]"
                >
                  ✕
                </Button>
              </div>
              {/* Divider */}
              <div style={{ height: 1, background: color, flexShrink: 0 }} />
              {/* Scrollable content */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {spell && (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {([
                      { label: 'Alcance',    value: spell.range },
                      { label: 'Duração',    value: spell.duration },
                      { label: 'Conjuração', value: spell.castingTime },
                    ] as { label: string; value: string | null | undefined }[]).map(({ label, value }) => value ? (
                      <div key={label}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color, marginBottom: 1 }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--foreground)' }}>
                          {value}
                        </div>
                      </div>
                    ) : null)}
                  </div>
                )}
                {spell && (
                  <p style={{ ...POPOVER_BODY, whiteSpace: 'pre-line' }}>
                    <RollableText text={spell.description} label={spell.name} onRoll={onRoll} />
                  </p>
                )}
                {isFailed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: 'var(--destructive)', background: 'color-mix(in oklch, var(--destructive), transparent 85%)', border: '1px solid var(--destructive)', padding: '2px 7px', letterSpacing: '0.1em' }}>
                      FALHOU
                    </span>
                    <Button
                      onClick={onRecover}
                      variant="hollow"
                      className="tactile border-[var(--chart-2)] text-[var(--chart-2)] hover:bg-[var(--chart-2)]/10"
                    >
                      Recuperar
                    </Button>
                  </div>
                )}
              </div>
              {/* Actions */}
              {(onForget || (spell && onRoll && stats && !isFailed)) && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
                  {spell && onRoll && stats && !isFailed && (
                    <Button
                      onClick={cast}
                      className="tactile flex-1 border-[var(--background)] text-[var(--background)]"
                      style={{ background: color }}
                    >
                      Conjurar
                    </Button>
                  )}
                  {onForget && (
                    <Button onClick={onForget} variant="hollow" className="tactile flex-1">
                      Esquecer
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <Button
        onClick={() => setOpen(o => !o)}
        title={name}
        variant="secondary"
        aria-expanded={open}
        className={cn(
          // Same face as GlyphCard — a spell is a card in the same deck.
          'tactile card-lift aspect-[246/384] h-auto min-h-[224px] w-full flex-col p-1 shadow-[0_4px_7px_rgba(0,0,0,0.65)]',
          'transition-[border-color] duration-[250ms]',
          // Same as GlyphCard: the face is prose, not a button label.
          'whitespace-normal normal-case',
          isFailed && 'opacity-70',
        )}
        style={{ borderColor: open ? color : 'var(--border)' }}
      >
        <div style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {/* Corner marks + roll arrow */}
          <div aria-hidden style={{ position: 'absolute', inset: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 6, color: 'var(--muted-foreground)', lineHeight: '6px' }}>
              <span>✦</span><span>✦</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 6, color: 'var(--muted-foreground)', lineHeight: '6px' }}>
              <span>✦</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10, letterSpacing: '2.7px', color, lineHeight: 1 }}>↝</span>
              <span>✦</span>
            </div>
          </div>

          {/* Masthead — a spell is always something cast, so it carries the
              filled treatment the sheet gives every activation. */}
          <div className="bg-input [&>svg]:size-8" style={{
            width: '100%',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: 16,
            boxSizing: 'border-box',
            flexShrink: 0,
          }}>
            <HugeiconsIcon icon={MagicWand01Icon} size={32} strokeWidth={1.5} />

            {/* Title — wraps onto a second line, then clamps */}
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, color: 'var(--foreground)', textAlign: 'center', width: '100%', lineHeight: 1.15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', overflowWrap: 'anywhere', margin: 0 }}>
              {name}
            </p>

            {/* School, tier and the roll it takes to land it */}
            <div style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: 6, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 8, color: 'var(--primary-foreground)', letterSpacing: '1px', textTransform: 'uppercase', lineHeight: '11.429px', textAlign: 'center', margin: 0 }}>
                {school} {tier}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: isFailed ? 'var(--destructive)' : color, lineHeight: '11.429px', letterSpacing: '0.04em' }}>
                {isFailed ? 'FALHOU' : dc != null ? `DC ${dc}` : ''}
              </span>
            </div>
          </div>

          {/* Description — fills whatever the masthead left, fading at the cut */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden', paddingBottom: FACE_CLEARANCE, boxSizing: 'border-box', maskImage: FACE_FADE, WebkitMaskImage: FACE_FADE }}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 12, letterSpacing: 'normal', color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0, textAlign: 'left', overflowWrap: 'anywhere' }}>
              {spell?.description ?? ''}
            </p>
          </div>
        </div>
      </Button>
      {popover}
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  classId: string
  equippedSpells: string[]
  spellcastingBonus?: number
  castingAttr?: string
  stats?: Record<string, number>
  onUpdate?: (patch: { spellcastingBonus?: number; castingAttr?: string }) => void
  onRoll?: (result: RollResult) => void
  onSpellsChange?: (spells: string[]) => void
}

export function Spells({
  classId, equippedSpells,
  spellcastingBonus = 0, castingAttr = 'int',
  stats, onUpdate, onRoll, onSpellsChange,
}: Props) {
  const available  = getSpellsForClass(classId)
  const [showPicker,   setShowPicker]   = useState(false)
  const [failedSpells, setFailedSpells] = useState<string[]>([])

  function learnSpell(id: string) {
    if (!onSpellsChange || equippedSpells.includes(id)) return
    onSpellsChange([...equippedSpells, id])
  }

  function forgetSpell(id: string) {
    if (!onSpellsChange) return
    onSpellsChange(equippedSpells.filter(s => s !== id))
  }

  return (
    // Same container as the technique and talent decks: a card surface on a
    // three-column grid, heading row first, then one spell card per column.
    <section className="panel-grid">
      {/* ── Header ── */}
      <SectionHeading
        className="panel-grid__row"
        trailing={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {/* Learn button */}
            {onSpellsChange && (
              <Button variant="secondary" className="tactile" onClick={() => setShowPicker(true)}>
                + Aprender
              </Button>
            )}

            {/* Casting controls */}
            {onUpdate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  Bônus
                </span>
                <NumInput
                  value={spellcastingBonus}
                  onCommit={n => onUpdate?.({ spellcastingBonus: n })}
                  className={cn(
                    'font-mono h-auto w-[46px] rounded-sm px-1 py-[3px] text-[13px] font-bold',
                    'border-[var(--chart-4)] bg-[var(--muted)]',
                    spellcastingBonus > 0
                      ? 'text-[var(--chart-2)]'
                      : spellcastingBonus < 0
                        ? 'text-[var(--destructive)]'
                        : 'text-[var(--foreground)]',
                  )}
                />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                  Atrib.
                </span>
                <NativeSelect
                  size="sm"
                  value={castingAttr}
                  onChange={e => onUpdate({ castingAttr: e.target.value })}
                  aria-label="Atributo de conjuração"
                  className="font-mono cursor-pointer rounded-sm border border-[var(--chart-4)] bg-[var(--muted)] text-[10px] font-bold text-[var(--foreground)]"
                >
                  {STAT_OPTIONS.map(o => (
                    <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
        }
      >
        Magias
      </SectionHeading>

      {/* ── Spell deck — replicates ClassPanel's technique card design ── */}
      {equippedSpells.length === 0 ? (
        <p className="panel-grid__row" style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Nenhuma magia aprendida.{onSpellsChange ? ' Use "+ Aprender" para adicionar.' : ''}
        </p>
      ) : (
        equippedSpells.map(id => {
          const spell = getSpell(id) ?? available.find(s => s.id === id)
          const isFailed = failedSpells.includes(id)
          return (
            <SpellCard
              key={id}
              id={id}
              spell={spell}
              isFailed={isFailed}
              castingAttr={castingAttr}
              spellcastingBonus={spellcastingBonus}
              stats={stats}
              onRoll={onRoll}
              onForget={onSpellsChange ? () => forgetSpell(id) : undefined}
              onFail={() => setFailedSpells(fs => [...fs, id])}
              onRecover={() => setFailedSpells(fs => fs.filter(s => s !== id))}
            />
          )
        })
      )}

      {/* Spell picker modal */}
      {showPicker && (
        <SpellPickerModal
          available={available}
          learned={equippedSpells}
          onLearn={learnSpell}
          onClose={() => setShowPicker(false)}
        />
      )}
    </section>
  )
}
