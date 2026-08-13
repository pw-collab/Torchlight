'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  luckTokens: number
  onLuckChange: (next: number) => void
  /**
   * `row` is the design's own container — a card-surfaced strip that fills the
   * two vitals columns on its own row of the page grid. `stacked` is the
   * phone variant, where the label trails the tokens instead of leading them.
   */
  variant?: 'row' | 'stacked'
}

/**
 * Fortuna: the luck tokens the character can spend. Clicking a lit token spends
 * it, clicking a dark one grants it back — five is the floor the strip always
 * draws, so the row never collapses when the character is out.
 */
export function FortuneBar({ luckTokens, onLuckChange, variant = 'row' }: Props) {
  const tokens = Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
    <Button
      key={i}
      variant="ghost"
      onClick={() => onLuckChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
      title={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
      aria-label={i < luckTokens ? 'Remover token de fortuna' : 'Adicionar token de fortuna'}
      className={cn(
        'font-sans w-auto min-w-0 transition-colors duration-300 hover:bg-transparent',
        variant === 'row'
          ? 'h-6 px-1 text-xl leading-6'
          : 'h-auto min-h-[30px] px-0.5 text-[22px] leading-5',
        i < luckTokens ? 'text-accent' : 'text-[var(--input)]',
      )}
    >
      ✦
    </Button>
  ))

  const label = (
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 9,
        letterSpacing: '2.16px',
        textTransform: 'uppercase',
        color: 'var(--card-foreground)',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      Fortuna
    </span>
  )

  if (variant === 'stacked') {
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', width: '100%', boxShadow: '0 3px 8px rgba(0,0,0,0.5)', padding: 6, display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' }}>
        <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'space-between' }}>{tokens}</div>
        <div style={{ flexShrink: 0, paddingLeft: 6, paddingRight: 2, display: 'flex', alignItems: 'center', minWidth: 60 }}>
          {label}
        </div>
      </div>
    )
  }

  // The strip is sized by two grid columns, which fall below the width of
  // "FORTUNA + five tokens" on mid-size screens — so both the row and the
  // token run wrap rather than spilling past the container's rule.
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '2px 8px', background: 'var(--card)', border: '1px solid var(--border)', padding: '4px 8px', boxSizing: 'border-box' }}>
      {label}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 2, minWidth: 0 }}>{tokens}</div>
    </div>
  )
}
