'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import { MagicWand01Icon } from '@hugeicons/core-free-icons'
import { getSpell, getSpellsForClass, tierNumeral } from '@/data/spells/index'
import type { Spell } from '@/data/spells/index'
import { rollWithMode, modifier, withDc } from '@/lib/dice'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import type { RollMode, RollResult } from '@/lib/dice'
import { NumInput } from '@/components/sheet/NumInput'
import { GlyphCard, DETAIL_BODY } from '@/components/shared/GlyphCard'
import { CardIcon } from '@/components/shared/CardOrigin'
import { RollableText } from '@/components/shared/RollableText'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Item } from '@/components/ui/item'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'

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
              {tierNumeral(t)}
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
                {tierNumeral(spell.tier)}
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

// ─── Spell Card ───────────────────────────────────────────────────────────────

const SPELL_STYLE = {
  normal: 'var(--chart-1)',
  failed: 'var(--destructive)',
}

/**
 * A spell in the grimoire, on the same card the techniques and talents use.
 * The masthead symbol marks it as spellcraft; the label under the rule carries
 * its school and circle, and the counter beside it the DC it takes to land.
 */
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

  const name    = spell?.name ?? id
  const tier    = spell ? tierNumeral(spell.tier) : '·'
  const dc      = spell ? 10 + spell.tier : null
  const school  = spell?.school ?? 'Arcano'

  function cast(mode: RollMode = 'normal') {
    if (!spell || !onRoll || !stats) return
    const castMod  = modifier(stats[castingAttr] ?? 10) + spellcastingBonus
    const spellDC  = 10 + spell.tier
    const rolled   = rollWithMode('d20', `Conjurar: ${spell.name}`, `DC ${spellDC}`, castMod, mode)
    rolled.isCritical = rolled.result === 20
    rolled.isFumble   = rolled.result === 1
    const result   = withDc(rolled, spellDC)
    onRoll(result)
    // The spell is lost on the same verdict the toast reports — a natural 20
    // keeps it even when the total falls short.
    if (!result.success) onFail()
  }

  const castable = spell && onRoll && stats && !isFailed
  // A read-only grimoire (no roller, nothing to forget with) has no actions at
  // all — and an empty popover under the card would be worse than none.
  const hasActions = Boolean(castable || isFailed || onForget)

  return (
    <GlyphCard
      glyph={<CardIcon icon={MagicWand01Icon} />}
      title={name}
      caption={`${school} ${tier}`}
      accent={color}
      // A spell is always something cast, so it carries the filled treatment
      // the sheet gives every activation.
      tone="activation"
      description={spell?.description ?? ''}
      status={{ text: isFailed ? 'FALHOU' : dc != null ? `DC ${dc}` : '', color }}
      className={isFailed ? 'opacity-70' : undefined}
      footer={hasActions && (
        <>
          {castable && (
            <RollModeMenu label={`Conjurar ${spell.name}`} onRoll={cast} className="flex-1">
              <Button
                render={<span />}
                className="tactile w-full border-[var(--background)] text-[var(--background)]"
                style={{ background: color }}
              >
                Conjurar
              </Button>
            </RollModeMenu>
          )}
          {isFailed && (
            <Button
              onClick={onRecover}
              variant="hollow"
              className="tactile flex-1 border-[var(--chart-2)] text-[var(--chart-2)] hover:bg-[var(--chart-2)]/10"
            >
              Recuperar
            </Button>
          )}
          {onForget && (
            <Button onClick={onForget} variant="hollow" className="tactile flex-1">
              Esquecer
            </Button>
          )}
        </>
      )}
    >
      {isFailed && (
        <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: 'var(--destructive)', background: 'color-mix(in oklch, var(--destructive), transparent 85%)', border: '1px solid var(--destructive)', padding: '2px 7px', letterSpacing: '0.1em', marginBottom: 8 }}>
          FALHOU
        </span>
      )}
      {spell && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
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
        <p style={{ ...DETAIL_BODY, whiteSpace: 'pre-line' }}>
          <RollableText text={spell.description} label={spell.name} onRoll={onRoll} />
        </p>
      )}
    </GlyphCard>
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
