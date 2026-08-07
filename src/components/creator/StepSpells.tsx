'use client'

import { getSpellsForClass } from '@/data/spells/index'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  classId: string
  selectedSpells: string[]
  onChange: (spells: string[]) => void
}

export function StepSpells({ classId, selectedSpells, onChange }: Props) {
  const available = getSpellsForClass(classId)

  function toggle(id: string) {
    if (selectedSpells.includes(id)) {
      onChange(selectedSpells.filter(s => s !== id))
    } else {
      onChange([...selectedSpells, id])
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground border-l-2 border-[var(--chart-4)] pl-3 text-[11px] leading-relaxed italic">
        O grimório começa com as magias que o mestre permitiu carregar.
        Cada palavra arcana tem um preço — escolha com cuidado.
      </p>

      <div className="flex flex-col gap-[5px]">
        {available.map(spell => {
          const selected = selectedSpells.includes(spell.id)
          return (
            <Card
              key={spell.id}
              render={
                <button type="button" onClick={() => toggle(spell.id)} aria-pressed={selected} />
              }
              size="sm"
              className={cn(
                'cursor-pointer gap-0 rounded-sm border px-3.5 py-2.5 text-left ring-0 transition-all duration-200',
                selected
                  ? 'border-[var(--chart-4)] bg-[var(--muted)] shadow-[0_0_10px_var(--chart-4)]'
                  : 'border-[var(--border)] bg-[var(--card)]',
              )}
            >
              <div className="flex items-start justify-between gap-2.5">
                <span
                  className={cn(
                    'font-heading text-[13px] tracking-[0.03em]',
                    selected ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
                  )}
                >
                  {spell.name}
                </span>
                <Badge
                  variant="outline"
                  className="font-mono mt-px shrink-0 rounded-[1px] border-[var(--chart-4)] bg-[var(--muted)] px-1.5 py-0.5 text-[7px] text-[var(--muted-foreground)]"
                >
                  NÍVEL {spell.tier}
                </Badge>
              </div>
              {spell.description && (
                <p className="text-muted-foreground mt-1 text-[10px] leading-snug italic">
                  {spell.description}
                </p>
              )}
            </Card>
          )
        })}
      </div>

      {selectedSpells.length > 0 && (
        <div className="rounded-sm border border-[var(--chart-4)] bg-[var(--muted)] px-3 py-2 text-[10px] text-[var(--muted-foreground)] italic">
          {selectedSpells.length} magia{selectedSpells.length !== 1 ? 's' : ''} selecionada{selectedSpells.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
