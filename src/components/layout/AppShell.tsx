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
}

export function AppShell({ children, playerName, playerRole, breadcrumbs = [] }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const visibleCrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      // True black canvas — the CotL palette contrast foundation
      background: `
        radial-gradient(ellipse at 50% 0%, rgba(196,32,32,0.07) 0%, transparent 55%),
        #080604
      `,
    }}>
      {/* Top bar */}
      <div style={{
        height: 50,
        flexShrink: 0,
        background: '#060402',
        borderBottom: '1px solid rgba(196,32,32,0.18)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 20px',
        gap: 0,
        boxShadow: '0 2px 16px rgba(0,0,0,0.7)',
        zIndex: 20,
      }}>
        {/* Logo */}
        <button
          onClick={() => router.push('/home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: isMobile ? '0 10px 0 0' : '0 16px 0 0',
            flexShrink: 0,
            minHeight: 44,
          }}
        >
          <Image
            src="/skull-icon.png"
            alt="Torchlight"
            width={26}
            height={26}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(196,32,32,0.55))' }}
          />
          {!isMobile && (
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--parchment-pale)',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}>
              Torchlight
            </span>
          )}
        </button>

        {/* Separator + breadcrumbs */}
        {visibleCrumbs.length > 0 && (
          <>
            <span style={{ width: 1, height: 18, background: 'rgba(196,32,32,0.22)', flexShrink: 0, marginRight: isMobile ? 10 : 14 }} />
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-heading)',
              fontSize: isMobile ? 10 : 8.5,
              letterSpacing: isMobile ? '0.08em' : '0.16em',
              textTransform: 'uppercase',
              overflow: 'hidden',
            }}>
              {visibleCrumbs.map((crumb, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                  {i > 0 && <span style={{ color: 'rgba(196,32,32,0.4)', flexShrink: 0 }}>›</span>}
                  {crumb.href ? (
                    <button
                      type="button"
                      onClick={() => router.push(crumb.href!)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        font: 'inherit',
                        fontSize: 'inherit',
                        letterSpacing: 'inherit',
                        textTransform: 'inherit',
                        color: 'rgba(200,184,136,0.5)',
                        transition: 'color 200ms',
                        minHeight: 44,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: isMobile ? 140 : 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--bone-dim)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(200,184,136,0.5)' }}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span style={{
                      color: i === visibleCrumbs.length - 1 ? 'var(--bone-dim)' : 'rgba(200,184,136,0.5)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: isMobile ? 160 : 'none',
                    }}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </>
        )}

        {/* Right: user card + logout */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {playerName && !isMobile && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              background: 'rgba(196,32,32,0.06)',
              border: '1px solid rgba(196,32,32,0.18)',
              borderRadius: 1,
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: 'var(--bone-white)',
                  lineHeight: 1.2,
                }}>
                  {playerName}
                </div>
                {playerRole && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 7,
                    color: 'rgba(196,32,32,0.55)',
                    letterSpacing: '0.08em',
                    marginTop: 1,
                  }}>
                    {playerRole}
                  </div>
                )}
              </div>
              <Image
                src="/skull-icon.png"
                alt=""
                width={22}
                height={22}
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 3px rgba(196,32,32,0.3))', flexShrink: 0 }}
              />
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              background: 'none',
              border: '1px solid rgba(196,32,32,0.2)',
              color: 'rgba(200,184,136,0.55)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 11,
              padding: isMobile ? '10px 14px' : '5px 12px',
              cursor: 'pointer',
              borderRadius: 1,
              transition: 'all 200ms',
              whiteSpace: 'nowrap',
              minHeight: 44,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--blood-bright)'
              e.currentTarget.style.borderColor = 'rgba(196,32,32,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(200,184,136,0.55)'
              e.currentTarget.style.borderColor = 'rgba(196,32,32,0.2)'
            }}
          >
            Sair
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}
