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
}

/**
 * Desktop: renders tab buttons inline (for embedding in AppShell's center pill).
 * Mobile: renders a fixed bottom floating bar.
 */
export function TabBar<K extends string>({ tabs, active, onChange }: Props<K>) {
  const isMobile = useIsMobile()

  const tabBtn = (isActive: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-heading)',
    fontSize: isMobile ? 11 : 16,
    letterSpacing: isMobile ? '0.04em' : '0.14em',
    color: isActive ? '#c8b890' : 'rgba(200,184,144,0.5)',
    background: isActive ? '#ff444c' : 'none',
    border: `1px solid ${isActive ? '#c8b890' : 'rgba(200,184,144,0)'}`,
    cursor: 'pointer',
    padding: isMobile ? '10px 6px' : '9px 19px',
    height: 44,
    minHeight: 44,
    whiteSpace: 'nowrap',
    transition: 'color 250ms, background 250ms, border-color 250ms',
    WebkitTapHighlightColor: 'transparent',
  })

  // ── Mobile: fixed bottom floating bar ──────────────────────────────────────
  if (isMobile) {
    return (
      <nav
        style={{
          position: 'fixed',
          zIndex: 60,
          left: 8,
          right: 8,
          bottom: 0,
          padding: 'calc(5px + var(--safe-bottom)) 5px 5px',
          display: 'flex',
          alignItems: 'stretch',
          gap: 4,
          background: 'linear-gradient(180deg, rgba(28,20,8,0.97) 0%, rgba(18,13,4,0.98) 100%)',
          border: '1px solid rgba(196,32,32,0.42)',
          borderTop: '1px solid rgba(196,32,32,0.55)',
          borderBottom: 'none',
          borderRadius: '6px 6px 0 0',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label="Navegação da ficha"
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
              style={{ ...tabBtn(isActive), flex: 1, borderRadius: 4 }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-dim)' }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,184,144,0.5)' }}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
    )
  }

  // ── Desktop: inline buttons (embedded in AppShell center pill) ─────────────
  return (
    <>
      {tabs.map(t => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="tactile"
            aria-current={isActive ? 'page' : undefined}
            style={tabBtn(isActive)}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#c8b890' }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,184,144,0.5)' }}
          >
            {t.label}
          </button>
        )
      })}
    </>
  )
}
