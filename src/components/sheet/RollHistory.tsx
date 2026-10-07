'use client'

import type { RollResult } from '@/lib/dice'

interface Props {
  /** Newest first, as the sheet keeps them. */
  rolls: RollResult[]
}

/**
 * The rolls made from this sheet since it opened, filling the dock above the
 * roll buttons. The newest sits at the bottom, right against the buttons that
 * made it, and the list keeps itself scrolled there: a `column-reverse` box
 * starts at its end, so nothing has to chase the scroll position.
 *
 * The toasts still carry the moment — the crit, the verdict, the offer to
 * spend Fortuna. This is the record left behind once they fade.
 */
export function RollHistory({ rolls }: Props) {
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
      className="m-0 flex min-h-0 flex-1 list-none flex-col-reverse gap-1 overflow-y-auto p-0"
    >
      {rolls.map(roll => {
        const tone = roll.isCritical
          ? 'var(--chart-1)'
          : roll.isFumble
            ? 'var(--destructive)'
            : 'var(--foreground)'

        return (
          <li
            key={roll.id}
            className="bg-input flex shrink-0 items-center gap-2 border border-[var(--border)] px-2 py-1.5"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-heading truncate text-[9px] tracking-[0.12em] text-[var(--muted-foreground)] uppercase">
                {roll.label}
              </span>
              <span className="truncate font-mono text-[9px] text-[var(--muted-foreground)]">
                {roll.die}
                {roll.modifier ? (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`) : ''}
                {roll.dc !== undefined && (
                  <span style={{ color: roll.success ? 'var(--chart-2)' : 'var(--destructive)' }}>
                    {' · '}{roll.success ? '✔' : '✖'} DC {roll.dc}
                  </span>
                )}
              </span>
            </span>
            <span className="font-heading shrink-0 text-xl leading-none font-bold" style={{ color: tone }}>
              {roll.total}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
