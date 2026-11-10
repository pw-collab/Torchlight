'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { getClass } from '@/data/classes/index'
import { getSpell, getSpellsForClass, psionicStat, tierNumeral } from '@/data/spells/index'
import { STAT_LABELS } from '@/data/stats'
import type { Stat } from '@/types/class.types'
import type { Spell } from '@/data/spells/index'
import { rollWithMode, modifier, withDc } from '@/lib/dice'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import type { RollMode, RollResult } from '@/lib/dice'
import { NumInput } from '@/components/sheet/NumInput'
import { GlyphCard, faceText } from '@/components/shared/GlyphCard'
import { SpellDetail, SpellTagIcon, spellCaption, spellFootnote } from '@/components/shared/SpellDetail'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { SectionHeading, SectionSubheading } from '@/components/shared/SectionHeading'
import { SpellcastingCard } from '@/components/sheet/ClassPanel'
import { BonusTile } from '@/components/sheet/BonusTile'
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
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--muted-foreground)', letterSpacing: '0.03em', marginBottom: 2 }}>
                  {spell.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted-foreground)' }}>
                  {spell.school && `${spell.school} · `}DC {10 + spell.tier}
                  {psionicStat(spell) && ` · ${STAT_LABELS[psionicStat(spell)!]}`}
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
 * A spell in the grimoire, on the technique deck's compact card: the name, a
 * violet tag with its school and circle, the DC it takes to land, and one line
 * on what it does. The full text is on the far side.
 *
 * A spell is something cast, so it carries the lighter mat the deck gives
 * every activation. Once a casting fails it is lost until the next rest, and
 * drops to the dark mat with the counter reading FALHOU.
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
  /** Ausente numa leitura de fora (o painel do Mestre): só o dono recupera. */
  onRecover?: () => void
}) {
  const color = isFailed ? SPELL_STYLE.failed : SPELL_STYLE.normal

  const name = spell?.name ?? id
  const dc   = spell ? 10 + spell.tier : null
  // A Science rolls the attribute its title names, not the sheet's casting
  // attribute: that is what is left of the old Power Score.
  const psiStat: Stat | undefined = spell ? psionicStat(spell) : undefined
  const verb = psiStat ? 'Manifestar' : 'Conjurar'
  const dcText = dc != null ? `DC ${dc}${psiStat ? ` · ${STAT_LABELS[psiStat]}` : ''}` : ''

  function cast(mode: RollMode = 'normal') {
    if (!spell || !onRoll || !stats) return
    const castMod  = modifier(stats[psiStat ?? castingAttr] ?? 10) + spellcastingBonus
    const spellDC  = 10 + spell.tier
    const rolled   = rollWithMode('d20', `${verb}: ${spell.name}`, dcText, castMod, mode)
    rolled.isCritical = rolled.result === 20
    rolled.isFumble   = rolled.result === 1
    // A Science's text carries what a natural 20 and a natural 1 do; the
    // roll names which one fired so nobody has to look it up mid-fight.
    if (psiStat && rolled.isCritical) rolled.subLabel = `${dcText} · Efeito de Poder`
    if (psiStat && rolled.isFumble)   rolled.subLabel = `${dcText} · Falha Crítica`
    const result   = withDc(rolled, spellDC)
    onRoll(result)
    // The spell is lost on the same verdict the toast reports — a natural 20
    // keeps it even when the total falls short.
    if (!result.success) onFail()
  }

  const castable = spell && onRoll && stats && !isFailed
  // A read-only grimoire (no roller, nothing to forget with) has no actions at
  // all — and an empty popover under the card would be worse than none.
  const hasActions = Boolean(castable || (isFailed && onRecover) || onForget)

  return (
    <GlyphCard
      face="compact"
      origin="spell"
      glyph={<SpellTagIcon />}
      title={name}
      caption={spellCaption(spell)}
      accent={color}
      tone={isFailed ? 'passive' : 'activation'}
      description={spell ? faceText(spell.summary, spell.description) : ''}
      footnote={spellFootnote(spell)}
      status={{ text: isFailed ? (psiStat ? 'ESGOTADA' : 'FALHOU') : dcText, color }}
      footer={hasActions && (
        <>
          {castable && (
            <RollModeMenu label={`${verb} ${spell.name}`} onRoll={cast} className="flex-1">
              <Button
                render={<span />}
                className="tactile w-full border-[var(--background)] text-[var(--background)]"
                style={{ background: color }}
              >
                {verb}
              </Button>
            </RollModeMenu>
          )}
          {isFailed && onRecover && (
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
      {spell ? (
        <SpellDetail
          spell={spell}
          onRoll={onRoll}
          notice={isFailed && (
            <span style={{ alignSelf: 'flex-start', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--destructive)', border: '1px solid var(--destructive)', padding: '1px 6px', letterSpacing: '0.08em' }}>
              {psiStat ? 'ESGOTADA · ATÉ DESCANSAR' : 'FALHOU · PERDIDA ATÉ DESCANSAR'}
            </span>
          )}
        />
      ) : (
        <p style={{ margin: 0 }}>Magia desconhecida.</p>
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
  /**
   * As magias perdidas, guardadas na ficha (ver `lib/rest`). Uma conjuração
   * que falha perde a magia até o próximo descanso — e isso tem de sobreviver
   * ao refresh. Sem esta prop o grimório lembra só enquanto estiver aberto.
   */
  lostSpells?: string[]
  onLostSpellsChange?: (ids: string[]) => void
  /**
   * The character card's second column on the desktop sheet. When given, the
   * casting (the class's Spellcasting card, "+ Aprender" and the bonuses) is
   * drawn there (Figma 353:1046) and the panel keeps the deck alone; without
   * it (the phone, the Mestre's read) the controls ride the deck's heading.
   */
  castingTarget?: HTMLElement | null
}

export function Spells({
  classId, equippedSpells,
  spellcastingBonus = 0, castingAttr = 'int',
  stats, onUpdate, onRoll, onSpellsChange,
  lostSpells, onLostSpellsChange, castingTarget,
}: Props) {
  const available  = getSpellsForClass(classId)
  const [showPicker,   setShowPicker]   = useState(false)
  const [localFailed,  setLocalFailed]  = useState<string[]>([])
  const failedSpells = lostSpells ?? localFailed
  // Lida de fora sem quem a escreva, a lista é só leitura.
  const canEditFailed = Boolean(onLostSpellsChange) || lostSpells === undefined

  function setFailed(next: string[]) {
    if (onLostSpellsChange) onLostSpellsChange(next)
    else if (lostSpells === undefined) setLocalFailed(next)
  }

  function learnSpell(id: string) {
    if (!onSpellsChange || equippedSpells.includes(id)) return
    onSpellsChange([...equippedSpells, id])
  }

  function forgetSpell(id: string) {
    if (!onSpellsChange) return
    onSpellsChange(equippedSpells.filter(s => s !== id))
  }

  const classData = getClass(classId)

  // The casting column (Figma 353:1046): the class's rule for casting, the
  // way to learn more, then the bonuses the checks take.
  const casting = castingTarget && (
    <div className="flex flex-col gap-3">
      <SectionSubheading>Conjuração</SectionSubheading>
      {classData && stats && (
        <SpellcastingCard
          classData={classData}
          stats={stats}
          onRoll={onRoll}
          className="aspect-auto h-[240px] min-h-0"
        />
      )}
      {onSpellsChange && (
        <Button
          className="type-button tactile h-auto w-full border-2 border-[var(--border-frame)] bg-spell px-5 py-2.5 text-[var(--ember-foreground)] hover:bg-spell/85"
          onClick={() => setShowPicker(true)}
        >
          + Aprender
        </Button>
      )}
      {onUpdate && (
        <>
          <SectionSubheading className="mt-1.5">Bônus</SectionSubheading>
          <label className="flex items-center gap-2">
            <span className="type-label text-muted-foreground shrink-0 tracking-[0.08em]">Atributo</span>
            <NativeSelect
              size="sm"
              value={castingAttr}
              onChange={e => onUpdate({ castingAttr: e.target.value })}
              aria-label="Atributo de conjuração"
              className="font-mono h-[30px] w-full min-w-0 cursor-pointer border border-[var(--border-control)] bg-muted text-[12px] font-semibold text-[var(--foreground)]"
            >
              {STAT_OPTIONS.map(o => (
                <NativeSelectOption key={o.value} value={o.value}>{o.label}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <BonusTile
            label="Conjuração"
            value={spellcastingBonus}
            onCommit={n => onUpdate({ spellcastingBonus: n })}
          />
        </>
      )}
    </div>
  )

  return (
    // Same container as the technique and talent decks: a card surface on a
    // three-column grid, heading row first, then one spell card per column.
    <section className="panel-grid">
      {castingTarget && casting && createPortal(casting, castingTarget)}

      {/* ── Header ── */}
      <SectionHeading
        // Alone in its row, the title keeps the Figma's 42px row (353:2401).
        className={cn('panel-grid__row', castingTarget && 'min-h-[42px]')}
        trailing={castingTarget ? undefined : (
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
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
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
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
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
        )}
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
              onFail={() => { if (!failedSpells.includes(id)) setFailed([...failedSpells, id]) }}
              onRecover={canEditFailed ? () => setFailed(failedSpells.filter(s => s !== id)) : undefined}
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
