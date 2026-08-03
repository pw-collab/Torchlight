'use client'

import { useIsMobile } from '@/hooks/useIsMobile'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface TabItem<K extends string> {
  key: K
  label: string
}

interface Props<K extends string> {
  tabs: TabItem<K>[]
  active: K
  onChange: (key: K) => void
  /** Rendered as the last item in the bar — e.g. the dice roller FAB. */
  trailing?: React.ReactNode
}

/**
 * Unified bottom navigation bar for both desktop and mobile. Fixed to the
 * bottom of the viewport, full-bleed, squared corners, no ornaments. Renders
 * the tab buttons followed by an optional `trailing` slot (the dice FAB) so the
 * roller sits as the final button in the same row on every screen size.
 *
 * The panels live in the page body rather than under this nav, so only the tab
 * list is mounted here.
 */
export function TabBar<K extends string>({ tabs, active, onChange, trailing }: Props<K>) {
  const isMobile = useIsMobile()

  return (
    <nav
      aria-label="Navegação da ficha"
      className={cn(
        'bg-secondary fixed inset-x-0 bottom-0 z-60 flex justify-center',
        'border-border border-t-2 shadow-[0_-4px_24px_rgba(0,0,0,0.7)]',
        'pt-1.5 pb-[calc(6px+var(--safe-bottom))]',
        isMobile ? 'px-2' : 'px-6',
      )}
    >
      <div
        className={cn(
          'flex max-w-[760px] items-stretch',
          isMobile ? 'w-full gap-1' : 'w-auto gap-2',
        )}
      >
        <Tabs
          value={active}
          onValueChange={value => onChange(value as K)}
          className={isMobile ? 'flex-1' : ''}
        >
          <TabsList
            variant="line"
            className={cn(
              'h-12 items-stretch bg-transparent',
              isMobile ? 'w-full gap-1' : 'gap-2',
            )}
          >
            {tabs.map(t => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={cn(
                  'tactile font-heading h-12 border border-transparent font-extrabold whitespace-nowrap',
                  'text-[rgba(200,184,144,0.5)] hover:text-[var(--bone-dim)]',
                  'data-active:bg-primary data-active:text-secondary-foreground data-active:border-[var(--bone-dim)]',
                  isMobile
                    ? 'flex-1 px-1.5 text-[11px] tracking-[0.04em]'
                    : 'flex-none px-5 text-[15px] tracking-[0.12em]',
                )}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {trailing && (
          <div className={cn('flex shrink-0 items-stretch', isMobile ? 'ml-0.5' : 'ml-1.5')}>
            {trailing}
          </div>
        )}
      </div>
    </nav>
  )
}
