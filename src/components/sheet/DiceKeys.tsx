'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { rollPool } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { DICE_TAP } from '@/lib/diceMotion'
import { MAX_DICE } from '@/lib/diceEngine'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** The tray's order (Figma 353:4434): the percentile first, then the polyhedra. */
export const TRAY_DICE = [100, 4, 6, 8, 10, 12] as const

const ONE = 1

/**
 * One key per die (the Figma's Outline label buttons, light rule on --muted).
 * Each key holds a count and shows it (`D6`, `2D6`): the right button adds a
 * die, the left button rolls what it shows and the count drops back to one.
 * Past one, an × on the key's corner puts it back without rolling. The keyboard
 * gets the same through + and − (or the arrows) on a focused key.
 *
 * A key only ever rolls its own shape; mixed handfuls stay on the phone's
 * dice panel. The d20 is not here: it is the ember key beside these, which
 * opens the modes, the DC and the modifier (see DiceTray).
 *
 * Renders the keys bare, one element each, so the parent grid places them.
 */
export function DiceKeys({ onRoll, sides: keys = TRAY_DICE, className }: {
  onRoll?: (result: RollResult) => void
  sides?: readonly number[]
  /** Extra classes on each key's button. */
  className?: string
}) {
  const [counts, setCounts] = useState<Record<number, number>>({})

  const countOf = (sides: number) => counts[sides] ?? ONE
  const setCount = (sides: number, next: number) =>
    setCounts(c => ({ ...c, [sides]: Math.min(MAX_DICE, Math.max(ONE, next)) }))

  function roll(sides: number) {
    const count = countOf(sides)
    onRoll?.(rollPool(Array(count).fill(sides), `${count > 1 ? count : ''}d${sides}`))
    setCount(sides, ONE)
  }

  return (
    <>
      {keys.map(sides => {
        const count = countOf(sides)
        const label = `${count > 1 ? count : ''}D${sides}`
        return (
          <div key={sides} className="relative min-w-0">
            <Button
              type="button"
              variant="outline"
              render={<motion.button {...DICE_TAP} />}
              onClick={() => roll(sides)}
              onContextMenu={e => { e.preventDefault(); setCount(sides, count + 1) }}
              onKeyDown={e => {
                if (e.key === '+' || e.key === 'ArrowUp') { e.preventDefault(); setCount(sides, count + 1) }
                if (e.key === '-' || e.key === 'ArrowDown') { e.preventDefault(); setCount(sides, count - 1) }
              }}
              title={`Rolar ${label} · botão direito soma um d${sides}`}
              aria-label={`Rolar ${count} d${sides}. Botão direito ou mais soma um dado.`}
              className={cn(
                'size-full min-h-0 min-w-0 px-0 transition-colors duration-[250ms]',
                'bg-muted text-foreground border-2 border-[var(--foreground)] hover:bg-[var(--bg-raised)]',
                'font-mono text-[14px] leading-[1.2] font-bold tracking-normal',
                className,
              )}
            >
              {label}
            </Button>
            {count > 1 && (
              <button
                type="button"
                onClick={() => setCount(sides, ONE)}
                title={`Voltar a um d${sides}`}
                aria-label={`Voltar a um d${sides}`}
                className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center border border-[var(--border-frame)] font-mono text-[11px] leading-none font-bold outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
