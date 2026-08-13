'use client'

import { motion } from 'framer-motion'
import { DICE_TAP } from '@/lib/diceMotion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  luckTokens: number
  onLuckChange: (next: number) => void
}

/**
 * Fortuna as a square tally, sitting beside the heading on the page grid.
 *
 * It counts the same way the dice buttons build a handful: a press adds one,
 * a right-click takes one back, and the running total rides the corner as a
 * badge. Arrow keys do the same job for anyone not using a pointer — a
 * right-click is not reachable from the keyboard.
 */
export function FortuneTile({ luckTokens, onLuckChange }: Props) {
  const add = () => onLuckChange(luckTokens + 1)
  const remove = () => onLuckChange(Math.max(0, luckTokens - 1))

  return (
    <Button
      type="button"
      onClick={e => (e.shiftKey ? remove() : add())}
      onContextMenu={e => { e.preventDefault(); remove() }}
      onKeyDown={e => {
        if (e.key === 'ArrowUp' || e.key === '+') { e.preventDefault(); add() }
        if (e.key === 'ArrowDown' || e.key === '-') { e.preventDefault(); remove() }
      }}
      render={<motion.button {...DICE_TAP} />}
      variant="hollow"
      title={`Fortuna: ${luckTokens} — clique adiciona, botão direito (ou shift+clique) remove`}
      aria-label={`Fortuna: ${luckTokens} tokens. Seta para cima adiciona, seta para baixo remove.`}
      className={cn(
        'bg-input border-input relative size-14 min-h-14 shrink-0 flex-col gap-1 px-0',
        'hover:border-primary hover:bg-accent',
        luckTokens > 0 && 'border-primary',
      )}
    >
      <span
        aria-hidden
        className={cn('leading-none', luckTokens > 0 ? 'text-accent' : 'text-[var(--input)]')}
        style={{ fontFamily: 'var(--font-body)', fontSize: 20 }}
      >
        ✦
      </span>
      <span
        aria-hidden
        className="font-heading text-muted-foreground text-[7px] leading-none tracking-[0.18em] uppercase"
      >
        Fortuna
      </span>
      {luckTokens > 0 && (
        <span
          aria-hidden
          className={cn(
            'bg-primary text-primary-foreground font-heading absolute -top-1 -right-1',
            'flex size-5 items-center justify-center text-[10px] font-bold',
          )}
        >
          {luckTokens}
        </span>
      )}
    </Button>
  )
}

/**
 * Fortuna as a run of tokens — the phone layout, which stacks in one column
 * and so has the width for the whole run. Tapping a lit token spends it,
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
