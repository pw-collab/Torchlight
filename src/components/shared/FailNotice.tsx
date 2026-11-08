'use client'

import { useCallback, useState } from 'react'

export interface Failure {
  /** What went wrong and what the person can do about it. */
  message: string
  /** Changes on every report, so the same failure twice is shown and read twice. */
  id: number
}

/**
 * A write the database refused, said out loud.
 *
 * Every save here is optimistic or fire-and-forget, so a refused write used to
 * look exactly like one that landed: the row vanished from the list, the wizard
 * moved on, the sheet quietly snapped back. This is the one place those
 * failures surface. It stays until closed or replaced, because a lost change is
 * worth more than the half-second a fading toast would get.
 */
export function useFailNotice() {
  const [failure, setFailure] = useState<Failure | null>(null)
  const report = useCallback((message: string) => setFailure({ message, id: Date.now() }), [])
  const clear = useCallback(() => setFailure(null), [])
  return { failure, report, clear }
}

export function FailNotice({ failure, onClose }: { failure: Failure | null; onClose: () => void }) {
  return (
    // Always mounted so the alert is heard the moment its text lands.
    <div role="alert" aria-atomic="true">
      {failure && (
        <div
          key={failure.id}
          className="animate-mist-rise fixed inset-x-4 z-[200] mx-auto flex max-w-[480px] items-start gap-3 border border-[var(--destructive)] bg-[var(--card)] px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
          style={{ bottom: 'calc(88px + var(--safe-bottom))' }}
        >
          <span aria-hidden className="font-mono pt-px text-[12px] text-[var(--destructive)]">✖</span>
          <p className="font-body min-w-0 flex-1 text-[13px] leading-snug text-[var(--card-foreground)]">
            {failure.message}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="font-mono -my-2 -mr-2 min-h-11 shrink-0 px-2 text-[10px] font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase outline-none hover:text-[var(--foreground)] focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  )
}

/** The usual sentence for a refused write: what was lost, and the likely cause. */
export function failMessage(what: string): string {
  return `${what} Confira a conexão e tente de novo.`
}
