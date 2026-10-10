'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHIP, parseAmount } from './ui'
import { cn } from '@/lib/utils'

export interface PadAction {
  label: string
  tone: 'danger' | 'heal' | 'primary'
  onApply: (amount: number) => void
}

const TONE: Record<PadAction['tone'], string> = {
  danger: 'border-[var(--destructive)] text-[var(--destructive)]',
  heal: 'border-[var(--chart-2)] text-[var(--chart-2)]',
  primary: 'border-[var(--primary)] text-[var(--foreground)]',
}

/**
 * O teclado de número da mesa: dano, cura, XP, o dano de uma bola de fogo.
 * Digita-se ou toca-se um atalho; Enter faz a primeira ação, que é a de
 * sempre (dano, no caso da vida).
 */
export function AmountPad({
  actions, presets = [1, 2, 3, 4, 6, 8, 10], initial = '',
}: {
  actions: PadAction[]
  presets?: number[]
  initial?: string
}) {
  const [text, setText] = useState(initial)
  const amount = parseAmount(text)

  function apply(action: PadAction) {
    if (amount <= 0) return
    action.onApply(amount)
    setText('')
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        autoFocus
        type="text"
        inputMode="numeric"
        value={text}
        onChange={e => setText(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
        onKeyDown={e => { if (e.key === 'Enter' && actions[0]) apply(actions[0]) }}
        placeholder="0"
        aria-label="Quantidade"
        className="font-[var(--font-numeral)] border-border bg-secondary h-12 text-center text-2xl"
      />
      <div className="flex flex-wrap gap-1">
        {presets.map(n => (
          <Button
            key={n}
            type="button"
            variant="outline"
            onClick={() => setText(String(n))}
            className={cn(CHIP, 'min-w-9 font-mono')}
          >
            {n}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        {actions.map(action => (
          <Button
            key={action.label}
            type="button"
            variant="outline"
            onClick={() => apply(action)}
            disabled={amount <= 0}
            className={cn(
              'font-heading h-11 min-h-11 flex-1 rounded-[1px] text-[10px] font-bold tracking-[0.14em] uppercase disabled:opacity-30',
              TONE[action.tone],
            )}
          >
            {action.label}{amount > 0 ? ` ${amount}` : ''}
          </Button>
        ))}
      </div>
    </div>
  )
}
