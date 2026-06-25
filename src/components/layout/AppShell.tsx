'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { useIsMobile } from '@/hooks/useIsMobile'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  children: React.ReactNode
  playerName?: string
  playerRole?: string
  breadcrumbs?: BreadcrumbItem[]
  navSlot?: React.ReactNode
}

// Simple decorative ornament SVGs for the nav pill flanks
function OrnamentLeft() {
  return (
    <svg width="37" height="42" viewBox="0 0 37 42" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M30 21 L10 7 L10 35 Z" fill="rgba(196,32,32,0.55)" />
      <path d="M22 21 L6 10 L6 32 Z" fill="rgba(196,32,32,0.3)" />
      <line x1="34" y1="6" x2="34" y2="36" stroke="rgba(200,184,144,0.3)" strokeWidth="1" />
    </svg>
  )
}
function OrnamentRight() {
  return (
    <svg width="37" height="42" viewBox="0 0 37 42" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <path d="M7 21 L27 7 L27 35 Z" fill="rgba(196,32,32,0.55)" />
      <path d="M15 21 L31 10 L31 32 Z" fill="rgba(196,32,32,0.3)" />
      <line x1="3" y1="6" x2="3" y2="36" stroke="rgba(200,184,144,0.3)" strokeWidth="1" />
    </svg>
  )
}

const PILL_BASE: React.CSSProperties = {
  background: '#0a0805',
  border: '2px solid rgba(200,184,144,0.25)',
  borderRadius: 80,
  padding: 6,
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 6px 6px rgba(0,0,0,0.2)',
}

export function AppShell({ children, playerName, playerRole, breadcrumbs = [], navSlot }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleCrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs

  // ── Mobile: 2-pill header ─────────────────────────────────────────────────
  if (isMobile) {
    const lastCrumb = visibleCrumbs[visibleCrumbs.length - 1]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'radial-gradient(ellipse at 50% 0%, rgba(196,32,32,0.07) 0%, transparent 55%), #080604' }}>
        <div style={{
          height: 64,
          flexShrink: 0,
          background: '#18140c',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          zIndex: 20,
        }}>
          {/* Left pill: logo + breadcrumb */}
          <div style={{ flex: '1 0 0', display: 'flex', minWidth: 0 }}>
            <div style={{ ...PILL_BASE, gap: 4, padding: 6, minWidth: 0, overflow: 'hidden' }}>
              <button
                onClick={() => router.push('/home')}
                style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 999, flexShrink: 0, minHeight: 44 }}
              >
                <Image src="/skull-icon.png" alt="Torchlight" width={26} height={26} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(196,32,32,0.55))' }} />
              </button>
              {lastCrumb && (
                <>
                  <span style={{ color: '#ff444c', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>›</span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8b890', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 6 }}>
                    {lastCrumb.label}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right pill: SAIR */}
          <div style={{ background: '#150a07', border: '2px solid rgba(255,68,76,0.25)', borderRadius: 80, padding: '6px 14px', display: 'flex', alignItems: 'center', flexShrink: 0, boxShadow: '0 4px 3px rgba(0,0,0,0.2)' }}>
            <button
              onClick={handleLogout}
              title="Sair"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '2.5px', textTransform: 'uppercase', color: '#ff444c', textDecoration: 'underline', textUnderlineOffset: '2px', minHeight: 44, display: 'flex', alignItems: 'center' }}
            >
              Sair
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    )
  }

  // ── Desktop: 3-pill header ────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(196,32,32,0.07) 0%, transparent 55%), #080604',
    }}>
      {/* Header area — 80px, 3 floating pills */}
      <div style={{
        height: 80,
        flexShrink: 0,
        background: '#18140c',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 24px',
        zIndex: 60,
      }}>
        {/* Left pill — breadcrumb */}
        <div style={{ flex: '1 0 0', display: 'flex', alignItems: 'center' }}>
          <div style={{ ...PILL_BASE, gap: 9 }}>
            {/* Logo */}
            <button
              onClick={() => router.push('/home')}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', minHeight: 44, borderRadius: 999 }}
            >
              <Image src="/skull-icon.png" alt="Torchlight" width={30} height={30} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(196,32,32,0.55))' }} />
            </button>

            {/* Breadcrumbs */}
            {visibleCrumbs.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '0.11em', textTransform: 'uppercase', overflow: 'hidden', paddingRight: 8, height: 44 }}>
                {visibleCrumbs.map((crumb, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                    {i > 0 && <span style={{ color: '#ff444c', flexShrink: 0, fontWeight: 700 }}>›</span>}
                    {crumb.href ? (
                      <button type="button" onClick={() => router.push(crumb.href!)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', color: 'rgba(200,184,144,0.5)', textDecoration: 'underline', textUnderlineOffset: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180, minHeight: 44, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--bone-dim)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,184,144,0.5)' }}
                      >{crumb.label}</button>
                    ) : (
                      <span style={{ color: i === visibleCrumbs.length - 1 ? '#c8b890' : 'rgba(200,184,144,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{crumb.label}</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center pill — nav / tabs */}
        {navSlot && (
          <div style={{ ...PILL_BASE, gap: 4, flexShrink: 0 }}>
            <OrnamentLeft />
            {navSlot}
            <OrnamentRight />
          </div>
        )}

        {/* Right pill — auth */}
        <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ background: '#150a07', border: '2px solid rgba(255,68,76,0.25)', borderRadius: 80, padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 4, boxShadow: '0 6px 6px rgba(0,0,0,0.2)' }}>
            {playerName && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 80 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#eee9dd', lineHeight: 1 }}>{playerName}</span>
                {playerRole && <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: '#ff444c', letterSpacing: '0.06em', lineHeight: 1 }}>{playerRole.split('·')[1]?.trim() ?? playerRole}</span>}
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sair"
              style={{ background: 'none', border: 'none', padding: '9px 19px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', color: '#ff444c', textDecoration: 'underline', textUnderlineOffset: '2px', minHeight: 44, transition: 'opacity 200ms', whiteSpace: 'nowrap' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}
