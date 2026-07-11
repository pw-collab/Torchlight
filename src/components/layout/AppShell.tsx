'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'
import { buttonStyle } from '@/components/shared/buttonStyles'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  children: React.ReactNode
  playerName?: string
  playerRole?: string
  breadcrumbs?: BreadcrumbItem[]
}

// Squared header bar shell — the old rounded "pill" flanks and ornaments are
// gone; every corner is now 0-radius to match the design system's square buttons.
const BAR_BASE: React.CSSProperties = {
  background: '#0a0805',
  border: '2px solid rgba(200,184,144,0.25)',
  borderRadius: 0,
  padding: 6,
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 6px 6px rgba(0,0,0,0.2)',
}

/**
 * The skull logo now doubles as the account/navigation menu. Clicking it opens
 * a small squared dropdown that condenses what used to live in the right-hand
 * auth pill: a Home shortcut, the player identity, and the logout ("Sair")
 * action. Closes on outside click / touch.
 */
function LogoMenu({
  playerName,
  playerRole,
  onLogout,
  isMobile,
}: {
  playerName?: string
  playerRole?: string
  onLogout: () => void
  isMobile: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const logoSize = isMobile ? 26 : 30

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  const menuItem: React.CSSProperties = {
    ...buttonStyle('dark'),
    width: '100%',
    textAlign: 'left',
    fontSize: 13,
  }

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Abrir menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 6px',
          minHeight: 44,
          borderRadius: 0,
        }}
      >
        <Image
          src="/skull-icon.png"
          alt="Torchlight"
          width={logoSize}
          height={logoSize}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(196,32,32,0.55))' }}
        />
        <span
          style={{
            color: '#c8b890',
            fontSize: 10,
            lineHeight: 1,
            transform: open ? 'scaleY(-1)' : 'none',
            transition: 'transform 200ms',
            display: 'inline-block',
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="animate-drop-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            minWidth: 194,
            background: '#18140C',
            border: '2px solid rgba(200,184,144,0.25)',
            boxShadow: '0 8px 28px rgba(0,0,0,0.75)',
            borderRadius: 0,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 80,
          }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); router.push('/home') }}
            style={menuItem}
            onMouseEnter={e => { e.currentTarget.style.background = '#1a140a'; e.currentTarget.style.borderColor = '#c8b890' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0a0805'; e.currentTarget.style.borderColor = '#c8b890' }}
          >
            Meus arquivos
          </button>

          {playerName && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                padding: '6px 10px',
                borderTop: '1px solid rgba(200,184,144,0.18)',
                borderBottom: '1px solid rgba(200,184,144,0.18)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: '#eee9dd', lineHeight: 1.15 }}>{playerName}</span>
              {playerRole && (
                <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: '#ff444c', letterSpacing: '0.06em', lineHeight: 1.2 }}>
                  {playerRole}
                </span>
              )}
            </div>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onLogout() }}
            title="Sair"
            style={{ ...menuItem, background: 'transparent', border: '1px solid #ff444c', color: '#ff444c' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,76,0.12)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children, playerName, playerRole, breadcrumbs = [] }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Mobile keeps only the trailing crumb; desktop shows the full trail.
  const visibleCrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs
  const barHeight = isMobile ? 64 : 80

  return (
    <div style={{ height: '100dvh', background: '#18140C' }}>
      {/* Condensed top bar — logo menu + breadcrumb only. Nav tabs and the dice
          roller now live in the bottom bar (see TabBar / DiceRoller). */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: barHeight,
          display: 'flex',
          alignItems: 'center',
          padding: isMobile ? '0 12px' : '0 24px',
          zIndex: 60,
        }}
      >
        <div
          style={{
            ...BAR_BASE,
            gap: isMobile ? 4 : 9,
            minWidth: 0,
            maxWidth: '100%',
          }}
        >
          <LogoMenu playerName={playerName} playerRole={playerRole} onLogout={handleLogout} isMobile={isMobile} />

          {visibleCrumbs.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                letterSpacing: '0.11em',
                textTransform: 'uppercase',
                minWidth: 0,
                overflow: 'hidden',
                paddingRight: 8,
                height: 44,
              }}
            >
              {visibleCrumbs.map((crumb, i) => {
                const isLast = i === visibleCrumbs.length - 1
                return (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
                    {(i > 0 || isMobile) && <span style={{ color: '#ff444c', flexShrink: 0, fontWeight: 700 }}>›</span>}
                    {crumb.href ? (
                      <button
                        type="button"
                        onClick={() => router.push(crumb.href!)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: 'inherit',
                          letterSpacing: 'inherit',
                          textTransform: 'inherit',
                          color: 'rgba(200,184,144,0.5)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '2px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 180,
                          minHeight: 44,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--bone-dim)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,184,144,0.5)' }}
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span style={{ color: isLast ? '#c8b890' : 'rgba(200,184,144,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ height: '100dvh', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}
