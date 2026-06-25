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
 * Floating tab navigation styled after the DiceRoller container.
 * - Desktop: a centred "header" pill floating just below the top bar.
 * - Mobile: a bottom floating bar that stretches to fit the width, sitting
 *   just above the DiceRoller.
 */
export function TabBar<K extends string>({ tabs, active, onChange }: Props<K>) {
  const isMobile = useIsMobile()

  const container: React.CSSProperties = {
    position: 'fixed',
    zIndex: 60,
    display: 'flex',
    alignItems: 'stretch',
    gap: 4,
    background: 'linear-gradient(180deg, rgba(28,20,8,0.97) 0%, rgba(18,13,4,0.98) 100%)',
    border: '1px solid rgba(196,32,32,0.42)',
    borderTop: '1px solid rgba(196,32,32,0.55)',
    borderRadius: 6,
    WebkitTapHighlightColor: 'transparent',
    ...(isMobile
      ? {
          left: 8,
          right: 8,
          bottom: 0,
          padding: '5px 5px calc(5px + var(--safe-bottom))',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
        }
      : {
          top: 58,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '94vw',
          padding: '5px 6px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.7)',
        }),
  }

  const btn = (isActive: boolean): React.CSSProperties => ({
    flex: isMobile ? 1 : '0 0 auto',
    fontFamily: 'var(--font-heading)',
    fontSize: isMobile ? 11 : 14,
    letterSpacing: isMobile ? '0.04em' : '0.16em',
    textTransform: 'uppercase',
    color: isActive ? 'var(--bone-white)' : 'rgba(200,184,136,0.55)',
    background: isActive
      ? 'linear-gradient(180deg, var(--blood-mid) 0%, #6B0F0F 100%)'
      : 'none',
    border: `1px solid ${isActive ? 'rgba(196,32,32,0.5)' : 'transparent'}`,
    borderRadius: 4,
    cursor: 'pointer',
    padding: isMobile ? '10px 6px' : '8px 18px',
    minHeight: 44,
    textShadow: isActive ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
    transition: 'color 250ms, background 250ms, border-color 250ms',
    whiteSpace: 'nowrap',
    WebkitTapHighlightColor: 'transparent',
  })

  return (
    <nav style={container} aria-label="Navegação da ficha">
      {tabs.map(t => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="tactile"
            aria-current={isActive ? 'page' : undefined}
            style={btn(isActive)}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-dim)'
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,184,136,0.55)'
            }}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
