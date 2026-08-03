'use client'

import { useState } from 'react'
import { classes } from '@/data/classes/index'
import type { ClassTechnique } from '@/types/class.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface Props {
  classId: string
  onChange: (id: string) => void
}

const CLASS_FLAVOR: Record<string, string> = {
  warrior:    'Aço e determinação — o guerreiro dobra o mundo pela força.',
  thief:      'Nas sombras, nas frestas — o ladino toma o que os outros negligenciam.',
  wizard:     'O grimório guarda segredos que podem custar a sanidade.',
  priest:     'A divindade fala; o sacerdote obedece — e às vezes questiona.',
  ranger:     'A floresta sussurra; o patrulheiro é o único que escuta.',
  bard:       'Canções que encantam, palavras que ferem — a arte como arma.',
  monk:       'O corpo é o templo; a mente, o sacerdote.',
  paladin:    'A fé forjada em lâmina. A misericórdia é escolha; a justiça, dever.',
  psionicist: 'A mente tocada pelo além — poder sem feitiços, sanidade sem certeza.',
}

const TECH_KIND_LABEL: Record<string, string> = {
  passive:     'Passivo',
  choice:      'Escolha',
  limited_use: 'Usos/Dia',
  spell_like:  'Ativação',
}

const CHIP_CLASS =
  'rounded-[1px] border-[var(--border)] bg-black/25 px-2 py-0.5 text-[10px] text-muted-foreground italic'

export function StepClass({ classId, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(classId)

  function handleSelect(id: string) {
    onChange(id)
    setExpanded(id)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {classes.map(c => {
        const active = c.id === classId
        const open = expanded === c.id
        const techniques = (c.techniques ?? []).filter((t): t is ClassTechnique => t !== null)

        return (
          <Card
            key={c.id}
            className={cn(
              'gap-0 overflow-hidden rounded-sm border py-0 ring-0 transition-colors duration-[250ms]',
              active
                ? 'border-[var(--primary)] bg-[var(--border)]'
                : 'border-[var(--border)] bg-[var(--card)]',
            )}
          >
            <Collapsible open={open} onOpenChange={() => handleSelect(c.id)}>
              {/* Class header row */}
              <CollapsibleTrigger
                render={
                  <Button
                    variant="ghost"
                    className="h-auto w-full justify-between gap-3 px-4 py-3 normal-case hover:bg-transparent"
                  />
                }
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div
                    className={cn(
                      'size-2 shrink-0 rounded-full border transition-all duration-200',
                      active
                        ? 'border-[var(--candle-amber)] bg-[var(--candle-amber)] shadow-[var(--glow-candle)]'
                        : 'border-[var(--border)] bg-[var(--border)]',
                    )}
                  />
                  <span
                    className={cn(
                      'font-heading text-left text-[15px] tracking-[0.04em]',
                      active ? 'text-[var(--parchment-pale)]' : 'text-[var(--parchment-light)]',
                    )}
                  >
                    {c.name}
                  </span>
                  {c.spellcasting && (
                    <Badge
                      variant="outline"
                      className="font-mono shrink-0 rounded-[1px] border-[var(--chart-4)] bg-[var(--muted)] px-[5px] py-px text-[7px] tracking-[0.08em] text-[var(--mist-bright)]"
                    >
                      ARCANO
                    </Badge>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-muted-foreground text-[9px] tracking-[0.06em]">
                    d{c.hitDie} HD
                  </span>
                  <span className="font-mono text-muted-foreground text-[10px] leading-none">
                    {open ? '▲' : '▼'}
                  </span>
                </div>
              </CollapsibleTrigger>

              {/* Expanded detail */}
              <CollapsibleContent className="flex flex-col gap-3 border-t border-[var(--border)] px-4 pt-3 pb-3.5">
                {CLASS_FLAVOR[c.id] && (
                  <p className="text-muted-foreground border-l-2 border-[var(--border)] pl-2.5 text-[11px] leading-relaxed italic">
                    {CLASS_FLAVOR[c.id]}
                  </p>
                )}

                {/* Proficiencies */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={CHIP_CLASS}>{c.armorProficiency}</Badge>
                  <Badge variant="outline" className={CHIP_CLASS}>{c.weaponProficiency}</Badge>
                </div>

                {/* Techniques */}
                {techniques.length > 0 && (
                  <div>
                    <div className="font-heading mb-1.5 text-[7px] tracking-[0.18em] text-[var(--candle-amber)]/70 uppercase">
                      Técnicas
                    </div>
                    <div className="flex flex-col gap-1">
                      {techniques.map(t => (
                        <div
                          key={t.id}
                          className="flex items-start gap-2 rounded-[1px] bg-black/20 px-2.5 py-1.5"
                        >
                          <Badge
                            variant="outline"
                            className="font-mono mt-px shrink-0 rounded-[1px] border-0 bg-[var(--border)] px-[5px] py-0.5 text-[7px] tracking-[0.06em] text-[var(--gold-oxidized)]"
                          >
                            {TECH_KIND_LABEL[t.kind ?? 'passive']}
                          </Badge>
                          <div>
                            <span className="font-heading text-[11px] tracking-[0.03em] text-[var(--parchment-light)]">
                              {t.name}
                            </span>
                            {t.spellLike && (
                              <span className="font-mono ml-1.5 text-[7px] text-[var(--mist-bright)]">
                                {t.spellLike.abilities.length} habilidades
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )
      })}
    </div>
  )
}
