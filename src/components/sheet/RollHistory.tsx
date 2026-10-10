'use client'

import type { RollResult } from '@/lib/dice'
import { useNow } from '@/hooks/useNow'
import { RollCard, ROLL_FRESH_MS, offersDamage, rollTone } from '@/components/sheet/RollCard'

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

/**
 * The rolls made from this sheet since it opened, filling the dock above the
 * roll buttons — on the desktop sheet they take the toasts' place, with the
 * same card for each roll (see RollCard). The newest sits at the bottom,
 * right against the buttons that made it, and the list keeps itself scrolled
 * there: a `column-reverse` box starts at its end, so nothing has to chase
 * the scroll position.
 *
 * The newest roll carries the Fortuna offer for as long as it is fresh, the
 * same window the toast gives it.
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

  return (
    <ol
      aria-label="Últimas rolagens"
      className="m-0 flex min-h-0 flex-1 list-none flex-col-reverse gap-1.5 overflow-y-auto p-0"
    >
      {rolls.map((roll, index) => {
        const canReroll =
          index === 0 && fortuneLeft > 0 && Boolean(onSpendFortune) && now - roll.timestamp < ROLL_FRESH_MS
        const tone = rollTone(roll)
        // The dock keeps its history, so the damage stays on offer until it is
        // rolled — the Mestre may take a while to say whether it hit.
        const canDamage = Boolean(onRollDamage) && offersDamage(roll) && !damageRolled?.has(roll.id)

        return (
          <li
            key={roll.id}
            className="shrink-0 px-2.5 py-2"
            style={{ background: tone.background, border: `1px solid ${tone.border}` }}
          >
            <RollCard
              roll={roll}
              compact
              fortuneLeft={fortuneLeft}
              onSpendFortune={canReroll ? () => onSpendFortune?.(roll) : undefined}
              onRollDamage={canDamage ? () => onRollDamage?.(roll) : undefined}
            />
          </li>
        )
      })}
    </ol>
  )
}
