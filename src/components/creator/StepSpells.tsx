'use client'

import { useMemo, useState } from 'react'
import { getLearnableSpells, getSpell, maxSpellTier } from '@/data/spells/index'
import { getClass } from '@/data/classes/index'
import { TRADITION_LABEL, type SpellTradition } from '@/types/class.types'
import { GlyphCard, POPOVER_BODY } from '@/components/shared/GlyphCard'
import { StepProse } from '@/components/creator/StepSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  classId: string
  selectedSpells: string[]
  onChange: (spells: string[]) => void
  /** Caps the tier on offer and the number of spells known. Defaults to 1. */
  level?: number
}

const TRADITIONS: SpellTradition[] = ['Arcane', 'Divine', 'Primal', 'Witchcraft']

/** Known spells wear the sheet's verdigris; the rest keep the spell accent. */
const SPELL_ACCENT = 'var(--chart-1)'
const KNOWN_ACCENT = 'var(--chart-2)'

export function StepSpells({ classId, selectedSpells, onChange, level = 1 }: Props) {
  const cls = getClass(classId)
  const casting = cls?.spellcasting
  const classTradition = casting?.tradition ?? 'Arcane'

  const [tradition, setTradition] = useState<SpellTradition>(classTradition)
  const [openId, setOpenId] = useState<string | null>(null)

  const tierCap = maxSpellTier(level)
  const known = (casting?.spellsKnown ?? casting?.spellsPerDay ?? [])[level - 1] ?? 0
  const atLimit = known > 0 && selectedSpells.length >= known

  const available = useMemo(
    () => getLearnableSpells({ tradition, maxTier: tierCap }),
    [tradition, tierCap],
  )

  function toggle(id: string) {
    if (selectedSpells.includes(id)) {
      onChange(selectedSpells.filter(s => s !== id))
    } else if (!atLimit) {
      onChange([...selectedSpells, id])
    }
  }

  if (!casting) {
    return (
      <p className="text-muted-foreground text-[11px] italic">
        Esta classe não conjura feitiços.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <StepProse>
        Algumas classes ganham acesso a feitiços mágicos. A quantidade de magias que você conhece é
        definida pela tabela da página Lançando Feitiços. As listas são separadas por tipo — Arcano,
        Divino, Primal e Bruxaria — e a sua classe conjura da lista{' '}
        {TRADITION_LABEL[classTradition]}.
      </StepProse>

      {/* Tradition filter + counter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {TRADITIONS.map(t => (
            <Button
              key={t}
              variant="outline"
              onClick={() => setTradition(t)}
              aria-pressed={tradition === t}
              className={cn(
                'h-auto rounded-sm px-2.5 py-1.5 text-[9px] tracking-[0.12em] transition-colors duration-150',
                tradition === t
                  ? 'border-[var(--chart-4)] bg-[var(--muted)] text-[var(--foreground)]'
                  : 'text-muted-foreground border-[var(--border)] bg-[var(--card)]',
              )}
            >
              {TRADITION_LABEL[t]}
              {t === classTradition && (
                <span className="ml-1 text-[7px] text-[var(--muted-foreground)]">classe</span>
              )}
            </Button>
          ))}
        </div>

        <span
          className={cn(
            'font-mono text-[10px]',
            atLimit ? 'text-[var(--chart-2)]' : 'text-[var(--foreground)]',
          )}
        >
          {selectedSpells.length}/{known || '—'} magias
        </span>
      </div>

      {/* Chosen spells, including any picked from another list */}
      {selectedSpells.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSpells.map(id => {
            const spell = getSpell(id)
            return (
              <Badge
                key={id}
                variant="outline"
                render={
                  <button type="button" onClick={() => toggle(id)} aria-label={`Remover ${spell?.name ?? id}`} />
                }
                className="cursor-pointer rounded-[10px] border-[var(--chart-2)] bg-[var(--muted)] px-2.5 py-[3px] text-[11px] text-[var(--foreground)]"
              >
                {spell?.name ?? id} ×
              </Badge>
            )
          })}
        </div>
      )}

      {atLimit && (
        <p className="text-[10px] text-[var(--chart-2)] italic">
          Você já conhece todas as magias permitidas no {level}º nível. Remova uma para trocar.
        </p>
      )}

      {/* Spell deck — the same card the sheet's grimoire uses */}
      <div className="grid-6-cards">
        {available.map(spell => {
          const learned = selectedSpells.includes(spell.id)
          const accent = learned ? KNOWN_ACCENT : SPELL_ACCENT

          return (
            <GlyphCard
              key={spell.id}
              glyph={String(spell.tier)}
              title={spell.name}
              caption={spell.school || spell.type}
              accent={accent}
              description={spell.description}
              status={learned ? { text: '✓', color: accent } : null}
              open={openId === spell.id}
              onOpenChange={open => setOpenId(open ? spell.id : null)}
              footer={
                <Button
                  variant={learned ? 'hollow' : 'secondary'}
                  onClick={() => toggle(spell.id)}
                  disabled={!learned && atLimit}
                  className="tactile flex-1"
                  style={learned ? { borderColor: accent, color: accent } : undefined}
                >
                  {learned ? '✓ Conhecida' : '✦ Aprender'}
                </Button>
              }
            >
              <div className="mb-2 flex flex-wrap gap-1">
                <Badge variant="outline" className={SPELL_CHIP_CLASS}>Nível {spell.tier}</Badge>
                {spell.castingTime && (
                  <Badge variant="outline" className={SPELL_CHIP_CLASS}>{spell.castingTime}</Badge>
                )}
                {spell.range && (
                  <Badge variant="outline" className={SPELL_CHIP_CLASS}>{spell.range}</Badge>
                )}
                {spell.duration && (
                  <Badge variant="outline" className={SPELL_CHIP_CLASS}>{spell.duration}</Badge>
                )}
              </div>
              <p style={POPOVER_BODY}>{spell.description}</p>
              <p className="font-mono text-muted-foreground mt-2 text-[8px] tracking-[0.08em] uppercase">
                {spell.classes.join(' · ')}
              </p>
            </GlyphCard>
          )
        })}
      </div>

      {available.length === 0 && (
        <p className="text-muted-foreground text-[11px] italic">
          Nenhuma magia de {TRADITION_LABEL[tradition]} disponível até o círculo {tierCap}.
        </p>
      )}
    </div>
  )
}

const SPELL_CHIP_CLASS =
  'font-mono rounded-[1px] border-[var(--border)] bg-[var(--input)] px-1.5 py-0.5 text-[7px] tracking-[0.06em] text-muted-foreground'
