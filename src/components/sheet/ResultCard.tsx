'use client'

import type { RollResult } from '@/lib/dice'
import { DieGlyph } from '@/components/dice/DieGlyph'
import { cn } from '@/lib/utils'

/** A small solid tag riding the card's top edge: the Figma's Character Tag. */
function EdgeTag({ tone, children }: { tone: 'class' | 'spirit' | 'destructive' | 'crit'; children: string }) {
  const fill = {
    class: 'bg-[var(--class)] text-[var(--class-foreground)]',
    spirit: 'bg-[var(--spirit)] text-[var(--spirit-foreground)]',
    destructive: 'bg-[var(--destructive)] text-[var(--class-foreground)]',
    crit: 'bg-[var(--chart-1)] text-[var(--ember-foreground)]',
  }[tone]
  return (
    <span className={cn('border border-[var(--border-frame)] px-1 font-mono text-[10px] leading-[14px] font-semibold tracking-[0.06em] uppercase', fill)}>
      {children}
    </span>
  )
}

/**
 * One roll as the Figma's Result card (251:914): the die, the name over how
 * it was rolled, and the total, with the advantage pair stacked beside it.
 * Damage that follows an attack drops the name (the attack above it carries
 * it), as the `Dano` variant does.
 *
 * Off the Figma on contrast: its secondary text (`muted-foreground`) and the
 * kept die (`ember`) sit under 3:1 on this fill, so both read in the fill's own
 * foreground here, and the verdict, the critical and the advantage ride as
 * solid tags on the top edge instead of coloured text.
 */
export function ResultCard({ roll, className }: { roll: RollResult; className?: string }) {
  const damage = roll.isDamage === true
  const sides = roll.sides ?? roll.dice?.[0]?.sides ?? 20
  const formula = `${roll.die}${roll.modifier ? (roll.modifier > 0 ? `+${roll.modifier}` : roll.modifier) : ''}`
  const pair = roll.advantage && roll.rolls && roll.rolls.length > 1 ? roll.rolls : null
  const kept = pair ? roll.result : null
  const dropped = pair ? (pair[0] === kept ? pair[1] : pair[0]) : null

  const left = [
    roll.dc !== undefined && <EdgeTag key="dc" tone={roll.success ? 'spirit' : 'destructive'}>{roll.success ? `Sucesso · CD ${roll.dc}` : `Falha · CD ${roll.dc}`}</EdgeTag>,
    roll.isCritical && <EdgeTag key="crit" tone="crit">Crítico</EdgeTag>,
    roll.isFumble && <EdgeTag key="fumble" tone="destructive">Falha crítica</EdgeTag>,
  ].filter(Boolean)

  return (
    <div
      className={cn(
        'relative flex min-w-0 items-center gap-2 border-2 bg-[var(--accent)] px-2 py-1.5',
        roll.isCritical ? 'border-[var(--chart-1)]' : roll.isFumble ? 'border-[var(--destructive)]' : 'border-[var(--border-frame)]',
        className,
      )}
    >
      {(left.length > 0 || roll.advantage) && (
        <span className="pointer-events-none absolute inset-x-2 -top-2 flex justify-between gap-1">
          <span className="flex gap-1">{left}</span>
          {roll.advantage && (
            <EdgeTag tone={roll.advantage === 'advantage' ? 'class' : 'destructive'}>
              {roll.advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}
            </EdgeTag>
          )}
        </span>
      )}

      {/* The flat ember die of the Figma, not the painted art: at 16px only the shape reads. */}
      <DieGlyph sides={sides} size={16} shapeColor="var(--ember)" numberColor="var(--ember)" className="shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {!damage && (
          <span className="type-title text-foreground truncate" style={{ lineHeight: 1 }}>
            {roll.label}
          </span>
        )}
        <span className="flex min-w-0 gap-1 text-[10px] leading-[1.2] text-[var(--accent-foreground)]">
          {!damage && roll.subLabel && roll.subLabel.toLowerCase() !== roll.die.toLowerCase() && <span className="truncate font-body font-medium italic">{roll.subLabel}</span>}
          <span className="shrink-0 font-body">{damage ? `Dano: ${formula}` : formula}</span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {pair && (
          <span className="flex flex-col items-center leading-none" style={{ fontFamily: 'var(--font-numeral)' }}>
            <span className="text-foreground text-[12px]">{kept}</span>
            <span className="text-[8px] text-[var(--accent-foreground)] line-through opacity-80">{dropped}</span>
          </span>
        )}
        <span className="type-display-lg text-foreground" style={{ lineHeight: 1 }}>{roll.total}</span>
      </div>
    </div>
  )
}
