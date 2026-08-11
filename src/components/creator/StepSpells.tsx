'use client'

import { useMemo, useState } from 'react'
import { getLearnableSpells, getSpell, maxSpellTier } from '@/data/spells/index'
import { getClass } from '@/data/classes/index'
import { TRADITION_LABEL, type SpellTradition } from '@/types/class.types'
import { TarotCard, roman } from '@/components/shared/TarotCard'
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

const TRADITION_GLYPH: Record<SpellTradition, string> = {
  Arcane: '✶',
  Divine: '✚',
  Primal: '❧',
  Witchcraft: '☾',
}

export function StepSpells({ classId, selectedSpells, onChange, level = 1 }: Props) {
  const cls = getClass(classId)
  const casting = cls?.spellcasting
  const classTradition = casting?.tradition ?? 'Arcane'

  const [tradition, setTradition] = useState<SpellTradition>(classTradition)
  const [flipped, setFlipped] = useState<string | null>(null)

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

      {/* Counter + tradition filter */}
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
                  ? 'border-[var(--chart-4)] bg-[var(--muted)] text-[var(--parchment-light)]'
                  : 'text-muted-foreground border-[var(--border)] bg-[var(--card)]',
              )}
            >
              {TRADITION_GLYPH[t]} {TRADITION_LABEL[t]}
              {t === classTradition && (
                <span className="ml-1 text-[7px] text-[var(--gold-oxidized)]">classe</span>
              )}
            </Button>
          ))}
        </div>

        <span
          className={cn(
            'font-mono text-[10px]',
            atLimit ? 'text-[var(--verdigris-light)]' : 'text-[var(--parchment-light)]',
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
                className="cursor-pointer rounded-[10px] border-[var(--chart-4)] bg-[var(--muted)] px-2.5 py-[3px] text-[11px] text-[var(--parchment-light)]"
              >
                {spell?.name ?? id} ×
              </Badge>
            )
          })}
        </div>
      )}

      {atLimit && (
        <p className="text-[10px] text-[var(--verdigris-light)] italic">
          Você já conhece todas as magias permitidas no {level}º nível. Remova uma para trocar.
        </p>
      )}

      {/* Spell deck — the card flips to reveal the full entry */}
      <div className="tarot-grid tarot-grid--flip">
        {available.map(spell => {
          const learned = selectedSpells.includes(spell.id)
          return (
            <TarotCard
              key={spell.id}
              flip
              numeral={roman(spell.tier)}
              glyph={TRADITION_GLYPH[tradition]}
              title={spell.name}
              subtitle={spell.school || spell.type}
              accent="var(--candle-amber)"
              accentSoft="var(--border)"
              expanded={flipped === spell.id}
              onToggle={() => setFlipped(flipped === spell.id ? null : spell.id)}
              corner={learned ? <span className="text-[10px] text-[var(--verdigris-light)]">✦</span> : undefined}
              badges={
                <Button
                  variant="outline"
                  onClick={() => toggle(spell.id)}
                  disabled={!learned && atLimit}
                  className={cn(
                    'h-auto rounded-sm px-2.5 py-1 text-[8px] tracking-[0.12em] transition-colors duration-150',
                    learned
                      ? 'border-[var(--chart-2)] bg-[var(--chart-2)]/15 text-[var(--verdigris-light)]'
                      : atLimit
                        ? 'text-muted-foreground cursor-not-allowed border-[var(--border)] bg-transparent'
                        : 'border-[var(--chart-4)] bg-[var(--muted)] text-[var(--parchment-light)]',
                  )}
                >
                  {learned ? '✓ Conhecida' : '+ Aprender'}
                </Button>
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className={SPELL_CHIP_CLASS}>
                    Nível {spell.tier}
                  </Badge>
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
                <p className="text-[11px] leading-relaxed text-[var(--parchment-light)]">
                  {spell.description}
                </p>
                <p className="font-mono text-muted-foreground text-[8px] tracking-[0.08em] uppercase">
                  {spell.classes.join(' · ')}
                </p>
              </div>
            </TarotCard>
          )
        })}
      </div>

      {available.length === 0 && (
        <p className="text-muted-foreground text-[11px] italic">
          Nenhuma magia de {TRADITION_LABEL[tradition]} disponível até o nível {tierCap} de círculo.
        </p>
      )}
    </div>
  )
}

const SPELL_CHIP_CLASS =
  'font-mono rounded-[1px] border-[var(--border)] bg-black/25 px-1.5 py-0.5 text-[7px] tracking-[0.06em] text-muted-foreground'
