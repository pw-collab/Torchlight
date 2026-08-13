'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The prose that opens a step or a sub-section — the setting text that tells
 * the player what the choice means in Ravenloft before they make it.
 */
export function StepProse({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        'text-muted-foreground border-l-2 border-[var(--border)] pl-3 text-[11.5px] leading-relaxed italic',
        className,
      )}
    >
      {children}
    </p>
  )
}

interface SectionProps {
  /** Numbering from the creation chapter, e.g. "2.1". Optional. */
  index?: string
  title: string
  children: ReactNode
  className?: string
}

/**
 * A titled sub-section inside a step — "Domínio natal", "Religião", and so on.
 * Steps that hold more than one choice stack these.
 */
export function StepSection({ index, title, children, className }: SectionProps) {
  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-baseline gap-2 border-b border-[var(--border)] pb-2">
        {index && (
          <span className="font-mono text-[9px] tracking-[0.16em] text-[var(--muted-foreground)]">
            {index}
          </span>
        )}
        <h3 className="font-heading text-card-foreground text-[17px] leading-none font-semibold">
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

/** Small uppercase label above a control group. */
export function StepLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'font-heading text-[8px] tracking-[0.22em] text-[var(--muted-foreground)] uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}
