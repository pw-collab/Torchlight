'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Leading marker glyph (rendered in red). Defaults to the ⪧ used on the sheet's main panels. */
  marker?: string
  /** Optional content pinned to the right of the heading (buttons, links, etc.). */
  trailing?: ReactNode
  /** Extra classes merged onto the heading wrapper (e.g. "mb-3"). */
  className?: string
}

/**
 * Main panel heading — red marker glyph + gold display title with a 2px gold
 * bottom rule. Matches the `⪧ Talentos & Habilidades` panel headers.
 */
export function SectionHeading({ children, marker = '⪧', trailing, className }: Props) {
  return (
    <div
      className={cn(
        'border-border flex items-center justify-between gap-3 border-b-2 pb-2',
        className,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <span aria-hidden className="font-heading text-destructive shrink-0 text-2xl leading-none">
          {marker}
        </span>
        <span className="font-heading text-secondary-foreground truncate text-2xl leading-none font-semibold">
          {children}
        </span>
      </span>
      {trailing}
    </div>
  )
}

/**
 * Subsection heading — red marker glyph + gold display title with a 1px gold
 * bottom rule. Matches the `⁕ Técnicas` subheaders.
 */
export function SectionSubheading({ children, marker = '⁕', trailing, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-[var(--border)] pb-[7px]',
        className,
      )}
    >
      <span className="inline-flex min-w-0 items-center gap-2">
        <span aria-hidden className="font-heading text-destructive shrink-0 text-base leading-none">
          {marker}
        </span>
        <span className="font-heading text-secondary-foreground text-[17px] leading-none font-semibold">
          {children}
        </span>
      </span>
      {trailing}
    </div>
  )
}
