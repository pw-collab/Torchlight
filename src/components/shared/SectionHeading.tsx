'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Optional content pinned to the right of the heading (buttons, links, etc.). */
  trailing?: ReactNode
  /** Extra classes merged onto the heading wrapper (e.g. "mb-3"). */
  className?: string
}

/**
 * Main panel heading — gold display title with a 2px gold bottom rule.
 * Matches the `Talentos & Habilidades` panel headers.
 */
export function SectionHeading({ children, trailing, className }: Props) {
  return (
    <div
      className={cn(
        'border-border flex items-center justify-between gap-3 border-b-2 pb-2',
        className,
      )}
    >
      <span className="font-heading text-card-foreground min-w-0 truncate text-2xl leading-none font-semibold">
        {children}
      </span>
      {trailing}
    </div>
  )
}

/**
 * Subsection heading — gold display title with a 1px gold bottom rule.
 * Matches the `Técnicas` subheaders.
 */
export function SectionSubheading({ children, trailing, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b border-[var(--border)] pb-[7px]',
        className,
      )}
    >
      <span className="font-heading text-card-foreground min-w-0 truncate text-[17px] leading-none font-semibold">
        {children}
      </span>
      {trailing}
    </div>
  )
}
