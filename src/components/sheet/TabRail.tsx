'use client'

import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { cn } from '@/lib/utils'

export interface TabRailItem<K extends string> {
  key: K
  label: string
  icon: IconSvgElement
}

interface Props<K extends string> {
  tabs: TabRailItem<K>[]
  active: K
  onChange: (key: K) => void
  className?: string
}

/**
 * Desktop sheet navigation, drawn as page markers (Figma 353:3235): a row of
 * square icon tabs hanging off the foot of the right half, as if the panel
 * were a book with its bookmarks sticking out. Where they sit is the page's
 * business (see .sheet-tabs in globals.css). Mobile keeps the labelled bottom
 * bar instead (see TabBar).
 *
 * The Figma's states: the open page sits on --muted inside a 3px
 * --border-control rule with its icon dimmed, as if pressed into the book;
 * the others stand on the panel colour inside the 2px panel rule, icon lit.
 * Every marker casts the same short shadow down onto the page behind.
 *
 * Plain buttons rather than the Tabs primitive: the panels live in the page
 * body, and each square is really a view switch, so there is no tablist
 * relationship to model here.
 */
export function TabRail<K extends string>({ tabs, active, onChange, className }: Props<K>) {
  return (
    <nav aria-label="Navegação da ficha" className={cn('flex items-start gap-2', className)}>
      {tabs.map(t => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            title={t.label}
            aria-label={t.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'tactile flex size-16 shrink-0 cursor-pointer items-center justify-center',
              'drop-shadow-[0_8px_3px_rgba(0,0,0,0.25)] transition-colors duration-150',
              'outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              isActive
                ? 'bg-muted text-muted-foreground border-[3px] border-[var(--border-control)]'
                : 'border-2 border-[var(--border-outline)] bg-[var(--bg-base)] text-foreground hover:border-[var(--border-control)]',
            )}
          >
            <HugeiconsIcon icon={t.icon} size={32} strokeWidth={1.5} />
          </button>
        )
      })}
    </nav>
  )
}
