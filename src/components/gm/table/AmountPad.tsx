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

/** Dano no tom do erro, cura no contorno neutro, o resto no vermelho cheio da ação. */
const VARIANT: Record<PadAction['tone'], 'destructive' | 'outline' | 'default'> = {
  danger: 'destructive',
  heal: 'outline',
  primary: 'default',
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
        className="border-input-border bg-secondary text-secondary-foreground h-12 text-center font-[var(--font-numeral)] text-2xl"
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
            variant={VARIANT[action.tone]}
            onClick={() => apply(action)}
            disabled={amount <= 0}
            className="h-11 flex-1 text-[11px] tracking-[0.12em] disabled:opacity-40"
          >
            {action.label}{amount > 0 ? ` ${amount}` : ''}
          </Button>
        ))}
      </div>
    </div>
  )
}
