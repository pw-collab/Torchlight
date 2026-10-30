'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { CornerDownRightIcon } from '@hugeicons/core-free-icons'
import { doubledDice, type RollResult } from '@/lib/dice'
import { useNow } from '@/hooks/useNow'
import { ROLL_FRESH_MS, offersDamage } from '@/components/sheet/RollCard'
import { ResultCard } from '@/components/sheet/ResultCard'

interface Props {
  /** Newest first, as the sheet keeps them. */
  rolls: RollResult[]
  /** Fortuna disponível — sem token, a oferta de rerrolar nem aparece. */
  fortuneLeft?: number
  /** Gasta um token e rola de novo (§5.2). */
  onSpendFortune?: (roll: RollResult) => void
  /** Rola o dano que o ataque carrega. */
  onRollDamage?: (attack: RollResult) => void
  /** Os ataques cujo dano já foi rolado — a oferta some deles. */
  damageRolled?: ReadonlySet<string>
}

const OFFER_CLASS =
  'flex h-full min-w-0 flex-1 items-center justify-center gap-1.5 border-2 px-2 font-mono text-[10px] font-semibold tracking-[0.12em] uppercase' +
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]'

/**
 * The rolls in the desktop dock's first two columns. Only the latest shows: an
 * attack on the top row with its damage chained under it (the Figma's `↳`),
 * or, until the damage is rolled, the offer to roll it, and the Fortuna
 * reroll while the roll is fresh. The older rolls rise over the panels as
 * balloons while the pointer (or focus) is on the stack, newest nearest,
 * scrolling once they pass half the screen. They float on their own: no box
 * behind them.
 */
export function RollHistory({ rolls, fortuneLeft = 0, onSpendFortune, onRollDamage, damageRolled }: Props) {
  const now = useNow(1000)

  if (rolls.length === 0) {
    return (
      <p className="font-body m-0 flex flex-1 items-end text-[11px] leading-snug text-[var(--muted-foreground)] italic">
        Nenhuma rolagem ainda.
      </p>
    )
  }

  // Damage rolled off the attack just before it reads as one roll: the attack
  // on top, its damage chained under it.
  const chained = rolls[0].isDamage && rolls[1]?.damage ? rolls[0] : null
  const main = chained ? rolls[1] : rolls[0]
  const older = rolls.slice(chained ? 2 : 1)

  const latest = rolls[0]
  const canReroll = fortuneLeft > 0 && Boolean(onSpendFortune) && now - latest.timestamp < ROLL_FRESH_MS
  const canDamage = !chained && Boolean(onRollDamage) && offersDamage(main) && !damageRolled?.has(main.id)
  const crit = main.isCritical === true
  const damageFormula = main.damage ? (crit ? doubledDice(main.damage.formula) : main.damage.formula) : null

  return (
    <div className="roll-stack" tabIndex={older.length > 0 ? 0 : undefined} aria-label="Últimas rolagens">
      {older.length > 0 && (
        <ol className="roll-stack__older" aria-label="Rolagens anteriores">
          {older.map(roll => (
            <li key={roll.id}>
              <ResultCard roll={roll} className="shadow-[var(--shadow-md)]" />
            </li>
          ))}
        </ol>
      )}

      <ResultCard roll={main} />

      <div className="flex min-h-0 min-w-0 gap-1.5">
        {chained ? (
          <>
            <HugeiconsIcon icon={CornerDownRightIcon} size={24} strokeWidth={1.5} className="text-foreground ml-2 shrink-0" />
            <ResultCard roll={chained} className="min-w-0 flex-1" />
          </>
        ) : (
          <>
            {canDamage && damageFormula && (
              <button
                type="button"
                onClick={() => onRollDamage?.(main)}
                title={crit ? 'Crítico: os dados de dano da arma dobram' : 'Acertou? Role o dano da arma'}
                className={`${OFFER_CLASS} border-[var(--border-frame)] bg-[var(--ember)] text-[var(--ember-foreground)] hover:bg-[var(--ember)]/85`}
              >
                <span>{crit ? '✦ Dano crítico' : '⚔ Dano'}</span>
                <span className="tracking-normal normal-case">{damageFormula}</span>
              </button>
            )}
            {canReroll && (
              <button
                type="button"
                onClick={() => onSpendFortune?.(latest)}
                title={`Gastar um token de Fortuna e rolar de novo (${fortuneLeft} restante${fortuneLeft === 1 ? '' : 's'})`}
                className={`${OFFER_CLASS} border-[var(--chart-1)] bg-[color-mix(in_oklch,var(--chart-1),transparent_88%)] text-[var(--chart-1)]`}
              >
                ✦ Fortuna
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
