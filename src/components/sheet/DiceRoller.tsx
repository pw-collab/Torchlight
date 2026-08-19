'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { rollDie, rollPool, withDc } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { DieIcon } from '@/components/dice/DieIcon'
import { DICE_SPRING, DICE_TAP } from '@/lib/diceMotion'
import { MAX_DICE } from '@/lib/diceEngine'
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

const POOL_DICE = [4, 6, 8, 10, 12, 20]
type RollMode = 'normal' | 'advantage' | 'disadvantage'

interface Props {
  onRoll?: (result: RollResult) => void
  /** Anchors the button to the bottom-right of the viewport (desktop layout). */
  floating?: boolean
}

// Shared label treatment for the popover's form rows.
const LABEL_CLASS =
  'font-heading text-[11px] font-bold tracking-[0.16em] whitespace-nowrap text-[var(--muted-foreground)] uppercase'
const FIELD_CLASS =
  'font-[var(--font-numeral)] h-11 flex-1 border-border bg-secondary text-center text-base text-secondary-foreground'
const CAPTION_CLASS =
  'font-body text-muted-foreground text-[10px] leading-tight italic'

/** Groups a pool into `{sides, count}`, smallest die first. */
function grouped(pool: number[]): { sides: number; count: number }[] {
  const counts = new Map<number, number>()
  for (const s of pool) counts.set(s, (counts.get(s) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sides, count]) => ({ sides, count }))
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dice roller: a single squared d20 button that toggles a compact popover
 * anchored just above it — never a fullscreen overlay. `floating` pins it to
 * the bottom-right of the screen (desktop); otherwise it renders inline as the
 * trailing button of the mobile bottom bar (see TabBar).
 *
 * Two ways to roll, kept visually apart because they behave differently:
 *
 * the handful — tapping a die adds it to a pool that can mix shapes, and
 *   "Rolar" throws the lot as one roll. Right-click on a die, or a tap on its
 *   chip, takes one back; "Limpar" empties the tray.
 *
 * the d20 row — rolls one d20 the moment it's pressed. Advantage and
 *   disadvantage are single-die mechanics (throw two, keep one), so pooling
 *   them would mean nothing; "Normal" stays here too so the commonest roll in
 *   the game is still one tap away.
 */
export function DiceRoller({ onRoll, floating = false }: Props) {
  const [pool, setPool] = useState<number[]>([])
  const [mod, setMod] = useState(0)
  const [dc,  setDc]  = useState(14)
  const [open, setOpen] = useState(false)

  const addDie    = (sides: number) => setPool(p => (p.length >= MAX_DICE ? p : [...p, sides]))
  const removeDie = (sides: number) => setPool(p => {
    const at = p.lastIndexOf(sides)
    return at === -1 ? p : [...p.slice(0, at), ...p.slice(at + 1)]
  })

  function rollHandful() {
    if (pool.length === 0) return
    const notation = grouped(pool).map(g => `${g.count > 1 ? g.count : ''}d${g.sides}`).join(' + ')
    const result = rollPool(pool, notation, mod)
    setPool([])
    setOpen(false)
    onRoll?.(result)
  }

  function rollD20(mode: RollMode) {
    const result = rollDie('d20', 'd20', undefined, mod, mode === 'advantage', mode === 'disadvantage')
    result.isCritical = result.result === 20
    result.isFumble = result.result === 1
    setOpen(false)
    // The target number rides along with the result, so the toast and the
    // Discord relay say SUCESSO/FALHA instead of leaving the player to compare.
    onRoll?.(withDc(result, dc))
  }

  const d20Modes = [
    { mode: 'normal'       as RollMode, label: '✦ Normal',      color: 'var(--muted-foreground)'  },
    { mode: 'advantage'    as RollMode, label: '↑ Vantagem',    color: 'var(--chart-2)'  },
    { mode: 'disadvantage' as RollMode, label: '↓ Desvantagem', color: 'var(--destructive)'  },
  ] as const

  const full = pool.length >= MAX_DICE

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Square d20 button — floating bottom-right on desktop, trailing button
          of the bottom bar on mobile */}
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
            className={cn(
              'bg-input border-input data-popup-open:bg-primary data-popup-open:border-primary px-0 transition-colors duration-[250ms]',
              floating
                ? 'fixed right-6 bottom-6 z-60 size-14 min-h-14 shadow-[0_6px_24px_rgba(0,0,0,0.75)]'
                : 'h-12 min-h-12 w-14',
            )}
          />
        }
      >
        <DieIcon
          className="animate-die-idle"
          sides={20}
          size={30}
          shapeColor={open ? 'var(--primary-foreground)' : 'var(--primary)'}
          numberColor={open ? 'var(--primary)' : 'var(--primary-foreground)'}
        />
        {/* Badge so a pool built and left behind isn't invisible once closed. */}
        {pool.length > 0 && (
          <span
            aria-hidden
            className={cn(
              'bg-primary text-primary-foreground font-heading absolute -top-1 -right-1',
              'flex size-5 items-center justify-center text-[10px] font-bold',
            )}
          >
            {pool.length}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        aria-label="Rolar dados"
        className={cn(
          'bg-popover border-border z-70 flex w-[min(320px,calc(100vw-32px))] flex-col gap-3',
          'max-h-[calc(100dvh-150px)] overflow-y-auto border-2 px-3 pt-3.5 pb-4',
          'shadow-[0_-6px_32px_rgba(0,0,0,0.85)]',
        )}
      >
        <PopoverHeader className="p-0">
          <PopoverTitle className="font-heading text-popover-foreground text-sm font-extrabold tracking-[0.14em] uppercase">
            Rolar Dados
          </PopoverTitle>
        </PopoverHeader>

        {/* ── The handful ────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <p className={CAPTION_CLASS}>
            Toque para somar ao punhado · botão direito remove
          </p>

          <div className="grid grid-cols-6 gap-1.5">
            {POOL_DICE.map(d => {
              const count = pool.filter(s => s === d).length
              return (
                <Button
                  key={d}
                  type="button"
                  onClick={() => addDie(d)}
                  onContextMenu={e => { e.preventDefault(); removeDie(d) }}
                  disabled={full}
                  render={<motion.button {...DICE_TAP} />}
                  title={`Adicionar d${d}${count ? ` (${count} no punhado)` : ''}`}
                  aria-label={`Adicionar d${d} ao punhado`}
                  variant="hollow"
                  className={cn(
                    'bg-input border-input relative h-[50px] min-w-0 px-0',
                    'hover:border-primary hover:bg-accent',
                    'disabled:opacity-40',
                    count > 0 && 'border-primary',
                  )}
                >
                  <DieIcon sides={d} size={26} shapeColor="var(--primary)" numberColor="var(--primary-foreground)" />
                  {count > 0 && (
                    <span
                      aria-hidden
                      className="bg-primary text-primary-foreground font-heading absolute -top-1 -right-1 flex size-4 items-center justify-center text-[9px] font-bold"
                    >
                      {count}
                    </span>
                  )}
                </Button>
              )
            })}
          </div>

          {/* Tray — chips double as the touch-friendly way to take a die back,
              since there is no right-click on a phone. */}
          <div className="border-border bg-input flex min-h-11 flex-wrap items-center gap-1.5 border p-1.5">
            {pool.length === 0 ? (
              <span className={cn(CAPTION_CLASS, 'px-1')}>Punhado vazio</span>
            ) : (
              grouped(pool).map(({ sides, count }) => (
                <button
                  key={sides}
                  type="button"
                  onClick={() => removeDie(sides)}
                  title={`Remover um d${sides}`}
                  aria-label={`Remover um d${sides} do punhado`}
                  className={cn(
                    'border-input bg-secondary font-mono text-secondary-foreground border px-2 py-1 text-[11px]',
                    'hover:border-primary hover:text-foreground',
                  )}
                >
                  {count > 1 ? count : ''}d{sides} <span aria-hidden className="opacity-50">×</span>
                </button>
              ))
            )}
          </div>

          <div className="flex gap-1.5">
            <Button
              type="button"
              onClick={rollHandful}
              disabled={pool.length === 0}
              render={<motion.button {...DICE_TAP} />}
              variant="hollow"
              className={cn(
                'font-heading bg-primary text-primary-foreground h-11 flex-1 text-[12px] font-bold tracking-[0.14em] uppercase',
                'hover:bg-primary/80 disabled:opacity-35',
              )}
            >
              Rolar{pool.length > 0 ? ` ${pool.length}` : ''}
            </Button>
            <Button
              type="button"
              onClick={() => setPool([])}
              disabled={pool.length === 0}
              render={<motion.button {...DICE_TAP} />}
              variant="outline"
              className={cn(
                'font-heading bg-input border-input h-11 px-3 text-[11px] font-bold tracking-[0.12em] uppercase',
                'hover:border-primary disabled:opacity-35',
              )}
            >
              Limpar
            </Button>
          </div>
          {full && (
            <p className={cn(CAPTION_CLASS, 'text-[var(--destructive)]')}>
              Limite de {MAX_DICE} dados por rolagem.
            </p>
          )}
        </div>

        {/* Modifier — added once to the whole roll, handful or d20. */}
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

        <Separator />

        {/* ── The d20 row — rolls on press, no pooling ────────────────────── */}
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

          <p className={CAPTION_CLASS}>Rola na hora, um d20 só</p>

          <div className="grid grid-cols-3 gap-1.5">
            {d20Modes.map(({ mode, label, color }) => (
              <Button
                key={mode}
                type="button"
                onClick={() => rollD20(mode)}
                render={<motion.button {...DICE_TAP} />}
                variant="outline"
                style={{ color }}
                className={cn(
                  'font-heading bg-input border-input h-auto min-h-16 flex-col gap-1.5 px-1 py-2.5',
                  'text-[11px] font-bold tracking-[0.04em] normal-case',
                  'hover:border-primary hover:bg-accent',
                )}
              >
                <DieIcon sides={20} size={26} shapeColor="var(--primary)" numberColor="var(--primary-foreground)" />
                <span>{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
