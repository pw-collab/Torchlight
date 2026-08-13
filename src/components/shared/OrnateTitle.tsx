'use client'

import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  color?: string
  fontSize?: number
  /** Extra classes for the wrapper (e.g. "flex-1") */
  className?: string
}

/**
 * Section title flanked by mirrored floral flourishes — the ornamental
 * framing used across the sheet's panel headers.
 */
export function OrnateTitle({
  children,
  color = 'var(--muted-foreground)',
  fontSize = 8.5,
  className,
}: Props) {
  const flourish: CSSProperties = { fontSize: fontSize + 3, color }

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-[7px]', className)}>
      <span
        aria-hidden
        className="shrink-0 -scale-x-100 leading-none opacity-50 select-none"
        style={flourish}
      >
        ❧
      </span>
      <span
        className="font-heading truncate tracking-[0.2em] uppercase"
        style={{ fontSize, color }}
      >
        {children}
      </span>
      <span aria-hidden className="shrink-0 leading-none opacity-50 select-none" style={flourish}>
        ❧
      </span>
    </span>
  )
}
