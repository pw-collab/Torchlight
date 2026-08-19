'use client'

import { useState } from 'react'
import type { ActiveCondition } from '@/types/character.types'
import { CONDITIONS } from '@/data/conditions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface Props {
  active: ActiveCondition[]
  onToggle: (condition: ActiveCondition) => void
  disabled?: boolean
}

/**
 * O Mestre marca o que está em vigor.
 *
 * O catálogo cobre o que se repete; o campo livre cobre o resto, porque a
 * lista do livro não fecha o que pode acontecer numa mesa. Marcar de novo uma
 * condição já ativa a remove — é o mesmo gesto nos dois sentidos.
 */
export function ConditionPicker({ active, onToggle, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState('')

  const activeIds = new Set(active.map(c => c.id))

  function addCustom() {
    const label = custom.trim()
    if (!label) return
    onToggle({ id: `livre-${label.toLowerCase().replace(/\s+/g, '-')}`, label })
    setCustom('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            title="Aplicar ou remover condições"
            className="font-heading h-8 min-h-8 w-9 rounded-[1px] px-0 text-[8.5px] tracking-[0.1em] uppercase"
          >
            ⚑
          </Button>
        }
      />

      <PopoverContent align="end" className="w-[260px]">
        <PopoverHeader>
          <PopoverTitle>Condições</PopoverTitle>
        </PopoverHeader>

        <div className="flex flex-col gap-2.5 p-3.5 pt-0">
          <div className="flex flex-wrap gap-1">
            {CONDITIONS.map(condition => {
              const on = activeIds.has(condition.id)
              return (
                <Button
                  key={condition.id}
                  type="button"
                  variant="outline"
                  title={condition.description}
                  onClick={() => onToggle({ id: condition.id, label: condition.label })}
                  className={cn(
                    'font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase',
                    on
                      ? 'border-[var(--destructive)] bg-[color-mix(in_oklch,var(--destructive),transparent_85%)] text-[var(--destructive)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
                  )}
                >
                  {condition.label}
                  {condition.disadvantage && <span aria-hidden className="ml-1 opacity-60">↓</span>}
                </Button>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5 border-t border-[var(--border)] pt-2.5">
            <Input
              value={custom}
              onChange={e => setCustom(e.target.value.slice(0, 24))}
              onKeyDown={e => { if (e.key === 'Enter') addCustom() }}
              placeholder="outra coisa…"
              aria-label="Condição escrita à mão"
              className="font-body border-border bg-secondary h-8 flex-1 text-[11px] italic"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustom}
              disabled={custom.trim().length === 0}
              className="font-heading h-8 min-h-8 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase disabled:opacity-30"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
