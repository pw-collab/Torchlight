'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { DieGlyph } from '@/components/dice/DieGlyph'
import { DICE_SPRING } from '@/lib/diceMotion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const SMALL_DICE = [4, 6, 8, 10, 12]
type RollMode = 'normal' | 'advantage' | 'disadvantage'

interface Props {
  onRoll?: (result: RollResult) => void
}

// Shared micro-interaction for every dice button: lift on hover,
// squash on press — spring-driven so release snaps back with life.
const diceTap = {
  whileHover: { scale: 1.05, y: -2 },
  whileTap: { scale: 0.9, y: 1 },
  transition: DICE_SPRING.tap,
}

// Shared label treatment for the popover's form rows.
const LABEL_CLASS =
  'font-heading text-[11px] font-bold tracking-[0.16em] whitespace-nowrap text-[var(--muted-foreground)] uppercase'
const FIELD_CLASS =
  'font-[var(--font-numeral)] h-11 flex-1 border-border bg-secondary text-center text-base text-secondary-foreground'

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dice roller as the trailing FAB of the bottom navigation bar (see TabBar).
 * A single squared d20 button that toggles a compact popover anchored just
 * above it — never a fullscreen overlay. Identical on desktop and mobile.
 */
export function DiceRoller({ onRoll }: Props) {
  const [mod, setMod] = useState(0)
  const [dc,  setDc]  = useState(14)
  const [open, setOpen] = useState(false)

  function roll(sides: number, mode: RollMode = 'normal') {
    const result = rollDie(`d${sides}`, `d${sides}`, undefined, mod, mode === 'advantage', mode === 'disadvantage')
    if (sides === 20) { result.isCritical = result.result === 20; result.isFumble = result.result === 1 }
    setOpen(false)
    onRoll?.(result)
  }

  const d20Modes = [
    { mode: 'normal'       as RollMode, label: '✦ Normal',      color: 'var(--muted-foreground)'  },
    { mode: 'advantage'    as RollMode, label: '↑ Vantagem',    color: 'var(--chart-2)'  },
    { mode: 'disadvantage' as RollMode, label: '↓ Desvantagem', color: 'var(--destructive)'  },
  ] as const

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* FAB — the last button in the bottom navigation bar */}
      <PopoverTrigger
        render={
          <Button
            type="button"
            title="Rolar dados"
            aria-label="Abrir painel de dados"
            variant="hollow"
            render={
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.9 }}
                transition={DICE_SPRING.tap}
              />
            }
            className="bg-secondary data-popup-open:bg-destructive h-12 min-h-12 w-14 px-0 transition-colors duration-[250ms]"
          />
        }
      >
        <DieGlyph
          className="animate-die-idle"
          sides={20}
          size={30}
          shapeColor={open ? 'var(--background)' : 'var(--destructive)'}
          numberColor={open ? 'var(--destructive)' : 'var(--background)'}
        />
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        aria-label="Rolar dados"
        className={cn(
          'bg-background border-border z-70 flex w-[min(320px,calc(100vw-32px))] flex-col gap-3',
          'max-h-[calc(100dvh-150px)] overflow-y-auto border-2 px-3 pt-3.5 pb-4',
          'shadow-[0_-6px_32px_rgba(0,0,0,0.85)]',
        )}
      >
        <PopoverHeader className="p-0">
          <PopoverTitle className="font-heading text-secondary-foreground text-sm font-extrabold tracking-[0.14em] uppercase">
            Rolar Dados
          </PopoverTitle>
        </PopoverHeader>

        {/* d4–d12 grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {SMALL_DICE.map(d => (
            <Button
              key={d}
              type="button"
              onClick={() => roll(d)}
              render={<motion.button {...diceTap} />}
              title={`d${d}`}
              aria-label={`Rolar d${d}`}
              variant="hollow"
              className="bg-secondary h-[54px] min-w-0 px-0 hover:border-[var(--destructive)] hover:bg-[var(--accent)]"
            >
              <DieGlyph sides={d} size={28} shapeColor="var(--destructive)" numberColor="var(--background)" />
            </Button>
          ))}
        </div>

        {/* Modifier */}
        <div className="flex items-center gap-2.5">
          <Label htmlFor="dice-mod" className={LABEL_CLASS}>Modificador</Label>
          <Input
            id="dice-mod"
            type="text"
            inputMode="numeric"
            value={mod}
            onChange={e => setMod(Number(e.target.value))}
            className={FIELD_CLASS}
          />
        </div>

        <Separator className="bg-[var(--border)]" />

        {/* d20 section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Label htmlFor="dice-dc" className={LABEL_CLASS}>DC Alvo</Label>
            <Input
              id="dice-dc"
              type="text"
              inputMode="numeric"
              value={dc}
              onChange={e => setDc(Number(e.target.value))}
              className={FIELD_CLASS}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {d20Modes.map(({ mode, label, color }) => (
              <Button
                key={mode}
                type="button"
                onClick={() => roll(20, mode)}
                render={<motion.button {...diceTap} />}
                variant="outline"
                style={{ color }}
                className={cn(
                  'font-heading bg-secondary border-border h-auto min-h-16 flex-col gap-1.5 px-1 py-2.5',
                  'text-[11px] font-bold tracking-[0.04em] normal-case',
                  'hover:border-[var(--border)] hover:bg-[var(--accent)]',
                )}
              >
                <DieGlyph sides={20} size={26} shapeColor="var(--destructive)" numberColor="var(--background)" />
                <span>{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
