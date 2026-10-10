'use client'

interface Props {
  /** What to say. Null says nothing. */
  message: string | null
  /** Changes on every new thing to say, so the same text twice is read twice. */
  id?: string
}

/**
 * A screen reader announcement, read out without moving focus.
 *
 * The region is always mounted, empty or not: a live region that appears
 * together with its text is often missed, so this one is listening before the
 * first roll lands. The message sits in a span keyed by `id`, and a remounted
 * span is new content, which is what gets announced.
 */
export function LiveAnnouncer({ message, id }: Props) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message && <span key={id}>{message}</span>}
    </div>
  )
}
