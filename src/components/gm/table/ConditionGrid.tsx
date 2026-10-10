'use client'

import { useState } from 'react'
import type { ActiveCondition } from '@/types/character.types'
import { PICKABLE_CONDITIONS } from '@/data/conditions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHIP } from './ui'
import { cn } from '@/lib/utils'

/**
 * As condições, abertas no menu: o catálogo como chips de liga-desliga e um
 * campo para o que a cena inventar. Serve ao PC e ao monstro — `extra` traz o
 * que só um deles tem (o "Fugindo" do teste de moral).
 */
export function ConditionGrid({
  active, onToggle, extra = [],
}: {
  active: ActiveCondition[]
  onToggle: (condition: ActiveCondition) => void
  extra?: { id: string; label: string; description: string }[]
}) {
  const [custom, setCustom] = useState('')
  const on = new Set(active.map(c => c.id))
  const catalog = [...extra, ...PICKABLE_CONDITIONS]
  // O que foi escrito à mão também aparece, para poder ser tirado daqui.
  const handmade = active.filter(c => !catalog.some(k => k.id === c.id) && c.id.startsWith('livre-'))

  function addCustom() {
    const label = custom.trim()
    if (!label) return
    onToggle({ id: `livre-${label.toLowerCase().replace(/\s+/g, '-')}`, label })
    setCustom('')
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-1">
        {[...catalog, ...handmade.map(c => ({ id: c.id, label: c.label, description: c.note ?? '' }))].map(c => (
          <Button
            key={c.id}
            type="button"
            variant="outline"
            aria-pressed={on.has(c.id)}
            title={c.description}
            onClick={() => onToggle({ id: c.id, label: c.label })}
            className={cn(
              CHIP,
              on.has(c.id)
                ? 'border-[var(--destructive)] bg-[color-mix(in_oklch,var(--destructive),transparent_85%)] text-[var(--destructive)]'
                : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
            )}
          >
            {on.has(c.id) ? '✓ ' : ''}{c.label}
          </Button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
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
          className={cn(CHIP, 'h-8 disabled:opacity-30')}
        >
          Aplicar
        </Button>
      </div>
    </div>
  )
}
