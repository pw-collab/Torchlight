'use client'

import { useIsMobile } from '@/hooks/useIsMobile'

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
 */
export function TabBar<K extends string>({ tabs, active, onChange, trailing }: Props<K>) {
  const isMobile = useIsMobile()

  const tabBtn = (isActive: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-heading)',
    fontWeight: 800,
    fontSize: isMobile ? 11 : 15,
    letterSpacing: isMobile ? '0.04em' : '0.12em',
    color: isActive ? '#c8b890' : 'rgba(200,184,144,0.5)',
    background: isActive ? '#ff444c' : 'none',
    border: `1px solid ${isActive ? '#c8b890' : 'rgba(200,184,144,0)'}`,
    borderRadius: 0,
    cursor: 'pointer',
    padding: isMobile ? '10px 6px' : '8px 20px',
    height: 48,
    minHeight: 48,
    whiteSpace: 'nowrap',
    transition: 'color 250ms, background 250ms, border-color 250ms',
    WebkitTapHighlightColor: 'transparent',
  })

  return (
    <nav
      style={{
        position: 'fixed',
        zIndex: 60,
        left: 0,
        right: 0,
        bottom: 0,
        padding: `6px ${isMobile ? 8 : 24}px calc(6px + var(--safe-bottom))`,
        display: 'flex',
        justifyContent: 'center',
        background: '#0a0805',
        borderTop: '2px solid rgba(200,184,144,0.25)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.7)',
        WebkitTapHighlightColor: 'transparent',
      }}
      aria-label="Navegação da ficha"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: isMobile ? 4 : 8,
          width: isMobile ? '100%' : 'auto',
          maxWidth: 760,
        }}
      >
        {tabs.map(t => {
          const isActive = t.key === active
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className="tactile"
              aria-current={isActive ? 'page' : undefined}
              style={{ ...tabBtn(isActive), flex: isMobile ? 1 : '0 0 auto' }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-dim)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,184,144,0.5)' }}
            >
              {t.label}
            </button>
          )
        })}

        {trailing && (
          <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, marginLeft: isMobile ? 2 : 6 }}>
            {trailing}
          </div>
        )}
      </div>
    </nav>
  )
}
