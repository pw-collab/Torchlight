'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { rollPool } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { DICE_TAP } from '@/lib/diceMotion'
import { MAX_DICE } from '@/lib/diceEngine'
import { DOCK_CELL_CLASS } from '@/components/sheet/dock'
import { Button } from '@/components/ui/button'

const KEYS = [4, 6, 8, 10, 12] as const
type Sides = (typeof KEYS)[number]

const ONE_EACH: Record<Sides, number> = { 4: 1, 6: 1, 8: 1, 10: 1, 12: 1 }

/**
 * One key per die on the desktop dock (the Figma's Outline label buttons).
 * Each key holds a count and shows it (`D6`, `2D6`): the right button adds a
 * die, the left button rolls what it shows and the count drops back to one.
 * Past one, an × on the key's corner puts it back without rolling. The keyboard
 * gets the same through + and − (or the arrows) on a focused key.
 *
 * A key only ever rolls its own shape; mixed handfuls stay on the phone's
 * dice panel. The d20 is not here: it is the ember button beside these, which
 * opens the panel with advantage, the DC and the modifier.
 */
export function DiceKeys({ onRoll }: { onRoll?: (result: RollResult) => void }) {
  const [counts, setCounts] = useState(ONE_EACH)

  const setCount = (sides: Sides, next: number) =>
    setCounts(c => ({ ...c, [sides]: Math.min(MAX_DICE, Math.max(1, next)) }))

  function roll(sides: Sides) {
    const count = counts[sides]
    onRoll?.(rollPool(Array(count).fill(sides), `${count > 1 ? count : ''}d${sides}`))
    setCount(sides, 1)
  }

  return (
    <>
      {KEYS.map(sides => {
        const count = counts[sides]
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
              className={`${DOCK_CELL_CLASS} type-button bg-muted text-foreground border-2 border-[var(--foreground)] hover:bg-[var(--bg-panel)]`}
            >
              {label}
            </Button>
            {count > 1 && (
              <button
                type="button"
                onClick={() => setCount(sides, 1)}
                title={`Voltar a um d${sides}`}
                aria-label={`Voltar a um d${sides}`}
                className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground absolute -top-2 -right-2 flex size-5 items-center justify-center border border-[var(--border-frame)] font-mono text-[11px] leading-none font-bold"
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
