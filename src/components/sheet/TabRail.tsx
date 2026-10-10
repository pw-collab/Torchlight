'use client'

import Link from 'next/link'
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
  /**
   * A page link set apart under a rule at the foot of the stack — the sheet's
   * edit page. It leaves the sheet rather than switching what it shows, so it
   * is drawn hollow next to the filled tab squares.
   */
  link?: { href: string; label: string; icon: IconSvgElement }
}

const SQUARE =
  'tactile flex size-16 shrink-0 items-center justify-center border transition-colors duration-150 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]'

/**
 * Desktop sheet navigation: square icon tabs stacked down the grid column
 * between the vitals and the panel. Mobile keeps the labelled bottom bar
 * instead (see TabBar), so this renders only on the desktop layout.
 *
 * Placement and the column's rule belong to `.sheet-rail`, which presses this
 * stack against the panel side of its column.
 *
 * Plain buttons rather than the Tabs primitive — the panels live in the page
 * body, and each square is really a view switch, so there is no tablist
 * relationship to model here.
 */
export function TabRail<K extends string>({ tabs, active, onChange, link }: Props<K>) {
  return (
    <nav aria-label="Navegação da ficha" className="flex w-16 flex-col items-end gap-2">
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
              SQUARE,
              'cursor-pointer',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-ring'
                : 'bg-input border-input-border text-foreground hover:border-sidebar-ring',
            )}
          >
            <HugeiconsIcon icon={t.icon} size={28} strokeWidth={1.5} />
          </button>
        )
      })}

      {link && (
        <>
          <span aria-hidden className="bg-sidebar-border h-px w-16 shrink-0" />
          <Link
            href={link.href}
            title={link.label}
            aria-label={link.label}
            className={cn(SQUARE, 'border-sidebar-accent text-foreground hover:border-sidebar-ring')}
          >
            <HugeiconsIcon icon={link.icon} size={28} strokeWidth={1.5} />
          </Link>
        </>
      )}
    </nav>
  )
}
