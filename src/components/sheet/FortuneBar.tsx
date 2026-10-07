'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  luckTokens: number
  onLuckChange: (next: number) => void
}

/**
 * Fortuna as a run of tokens — on phones inside the vitals block, on the
 * desktop sheet at the foot of the dice panel. Tapping a lit token spends it,
 * tapping a dark one grants it back; five is the floor the strip always
 * draws, so the row never collapses when the character is out.
 */
export function FortuneBar({ luckTokens, onLuckChange }: Props) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', width: '100%', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', padding: 6, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
      <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'space-between' }}>
        {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
          <Button
            key={i}
            variant="ghost"
            onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
            title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
            aria-label={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
            className={cn(
              'font-sans h-auto min-h-[30px] w-auto min-w-0 px-0.5 text-[22px] leading-5',
              'transition-colors duration-300 hover:bg-transparent',
              i < luckTokens ? 'text-accent' : 'text-[var(--input)]',
            )}
          >
            ✦
          </Button>
        ))}
      </div>
      <div style={{ flexShrink: 0, paddingLeft: 6, paddingRight: 2, display: 'flex', alignItems: 'center', minWidth: 60 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: 'var(--card-foreground)', lineHeight: 1, flexShrink: 0 }}>
          Fortuna
        </span>
      </div>
    </div>
  )
}
