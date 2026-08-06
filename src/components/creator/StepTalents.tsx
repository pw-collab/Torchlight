'use client'

import { useState } from 'react'
import type { Talent } from '@/types/talent.types'
import { rollClassTalent, getClass } from '@/data/classes/index'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface Props {
  classId: string
  talents: Talent[]
  onChange: (talents: Talent[]) => void
}

export function StepTalents({ classId, talents, onChange }: Props) {
  const classData = getClass(classId)
  const [lastRoll, setLastRoll] = useState<{ roll: number; die1: number; die2: number; effect: string } | null>(null)
  const [tableOpen, setTableOpen] = useState(false)

  const classTalents = talents.filter(t => t.origin === 'class')

  function rollAndAdd() {
    if (!classData) return
    const r = rollClassTalent(classData.id)
    if (!r) return
    setLastRoll({ roll: r.roll, die1: r.die1, die2: r.die2, effect: r.entry.effect })
    const newTalent: Talent = {
      id: Math.random().toString(36).substring(2, 9),
      name: r.entry.effect,
      origin: 'class',
      description: `Talento de classe — 2d6: ${r.roll} (${r.die1}+${r.die2}) — ${classData.name}`,
    }
    onChange([...talents, newTalent])
  }

  function remove(id: string) {
    onChange(talents.filter(t => t.id !== id))
  }

  if (!classData) {
    return <p className="text-muted-foreground text-xs italic">Classe não encontrada.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <Collapsible open={tableOpen} onOpenChange={setTableOpen} className="flex flex-col gap-4">
        {/* Roll controls */}
        <div className="flex items-center justify-between gap-2">
          <CollapsibleTrigger
            render={
              <Button
                variant="link"
                className="text-muted-foreground h-auto p-0 text-[8px] tracking-[0.12em] no-underline"
              />
            }
          >
            {tableOpen ? '▲ ocultar tabela' : '▼ ver tabela de talentos'}
          </CollapsibleTrigger>

          <Button
            onClick={rollAndAdd}
            variant="outline"
            size="sm"
            className="text-foreground rounded-[1px] border-[var(--primary)] bg-[var(--primary)]/15 text-[8px] tracking-[0.1em] transition-all duration-[220ms] hover:bg-[var(--primary)]"
          >
            ✦ Rolar 2d6 — {classData.name}
          </Button>
        </div>

        {/* Talent table */}
        <CollapsibleContent className="animate-ink-spread overflow-hidden rounded-[1px] border border-[var(--border)]">
          <Table>
            <TableHeader>
              <TableRow className="border-b-[var(--border)] bg-[var(--card)]">
                <TableHead className="font-heading text-muted-foreground w-12 border-r border-[var(--border)] px-2.5 py-[5px] text-[7px] tracking-[0.14em] uppercase">
                  2D6
                </TableHead>
                <TableHead className="font-heading text-muted-foreground px-2.5 py-[5px] text-[7px] tracking-[0.14em] uppercase">
                  Efeito
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classData.talentTable.map((entry, i) => {
                const isLast = lastRoll !== null && lastRoll.roll >= entry.min && lastRoll.roll <= entry.max
                return (
                  <TableRow
                    key={entry.roll}
                    data-state={isLast ? 'selected' : undefined}
                    className={cn(
                      'border-b-[var(--border)] transition-colors duration-200',
                      isLast
                        ? 'bg-[var(--primary)]/15'
                        : i % 2 === 0
                          ? 'bg-[var(--card)]'
                          : 'bg-transparent',
                    )}
                  >
                    <TableCell
                      className={cn(
                        'font-mono border-r border-[var(--border)] px-2.5 py-1.5 text-[10px] font-bold',
                        isLast ? 'text-[var(--candle-amber)]' : 'text-muted-foreground',
                      )}
                    >
                      {entry.roll}
                    </TableCell>
                    <TableCell
                      className={cn(
                        'px-2.5 py-1.5 text-[10.5px] leading-snug italic',
                        isLast ? 'text-[var(--parchment-light)]' : 'text-muted-foreground',
                      )}
                    >
                      {entry.effect}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CollapsibleContent>
      </Collapsible>

      {/* Last roll result */}
      {lastRoll && (
        <Item
          variant="outline"
          size="sm"
          className="worn-border animate-ink-spread items-start gap-2.5 border-[var(--border)] bg-[var(--primary)]/15 px-3 py-2"
        >
          <div className="shrink-0 text-center">
            <div className="font-heading text-[22px] leading-none font-bold text-[var(--candle-amber)]">
              {lastRoll.roll}
            </div>
            <div className="font-mono text-muted-foreground mt-px text-[7.5px]">
              ({lastRoll.die1}+{lastRoll.die2})
            </div>
          </div>
          <ItemContent className="gap-1">
            <ItemDescription className="mt-0.5 text-[11px] leading-normal text-[var(--parchment-light)] italic">
              {lastRoll.effect}
            </ItemDescription>
            <ItemDescription className="font-mono text-[8px] text-[var(--verdigris-light)]">
              ✦ Adicionado aos talentos de classe
            </ItemDescription>
          </ItemContent>
        </Item>
      )}

      {/* Acquired talents */}
      <div>
        <div className="font-heading text-muted-foreground mb-2 text-[7.5px] tracking-[0.14em] uppercase">
          Talentos de classe adquiridos ({classTalents.length})
        </div>

        {classTalents.length === 0 ? (
          <p className="text-muted-foreground text-[11px] italic">
            Nenhum talento de classe ainda. Use &quot;Rolar 2d6&quot; em cada nível ímpar.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {classTalents.map(talent => (
              <Item
                key={talent.id}
                variant="outline"
                size="sm"
                className="worn-border items-start gap-2 rounded-[1px] border-[var(--border)] bg-[var(--card)] px-2.5 py-[7px]"
              >
                <Badge
                  variant="outline"
                  className="font-heading mt-px shrink-0 rounded-[1px] border-[var(--primary)] bg-[var(--primary)]/15 px-[5px] py-px text-[7px] tracking-[0.12em] text-[var(--candle-amber)] uppercase"
                >
                  Classe
                </Badge>
                <ItemContent className="gap-0">
                  <ItemTitle className="font-heading text-[10.5px] leading-snug text-[var(--parchment-light)]">
                    {talent.name}
                  </ItemTitle>
                  {talent.description && (
                    <ItemDescription className="font-mono mt-0.5 text-[8px] text-[var(--muted-foreground)]">
                      {talent.description}
                    </ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(talent.id)}
                    aria-label={`Remover ${talent.name}`}
                    className="text-[var(--destructive)] transition-colors duration-[180ms] hover:text-[var(--blood-bright)]"
                  >
                    ✕
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
