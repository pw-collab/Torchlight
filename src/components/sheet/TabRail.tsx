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
}

/**
 * Desktop sheet navigation: small square icon tabs stacked in the grid column
 * that hugs the main block's left edge. Mobile keeps the labelled bottom bar
 * instead (see TabBar), so this renders only on the desktop layout.
 *
 * Plain buttons rather than the Tabs primitive — the panels live in the page
 * body, and each square is really a view switch, so there is no tablist
 * relationship to model here.
 */
export function TabRail<K extends string>({ tabs, active, onChange }: Props<K>) {
  return (
    <nav aria-label="Navegação da ficha" className="flex flex-col gap-2 mt-2">
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
              'tactile flex size-14 cursor-pointer items-center justify-center border',
              'transition-colors duration-150 outline-none',
              'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              isActive
                ? 'bg-destructive text-background border-[var(--bone-dim)]'
                : 'bg-secondary border-border text-[var(--muted-foreground)] hover:border-[var(--bone-dim)] hover:text-[var(--bone-dim)]',
            )}
          >
            <HugeiconsIcon icon={t.icon} size={26} strokeWidth={1.6} />
          </button>
        )
      })}
    </nav>
  )
}
