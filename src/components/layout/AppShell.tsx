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

  // On mobile show only the last breadcrumb
  const visibleCrumbs = isMobile ? breadcrumbs.slice(-1) : breadcrumbs

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100dvh',
      background: `
        radial-gradient(ellipse at 12% 85%, rgba(42,26,58,0.16) 0%, transparent 50%),
        radial-gradient(ellipse at 88% 12%, rgba(139,21,21,0.09) 0%, transparent 40%),
        radial-gradient(ellipse at 50% 50%, rgba(50,38,18,0.35) 0%, transparent 70%),
        #0D0A05
      `,
    }}>
      {/* Top bar */}
      <div style={{
        height: 50,
        flexShrink: 0,
        background: '#0D0A05',
        borderBottom: '1px solid rgba(139,112,48,0.2)',
        display: 'flex',
        alignItems: 'center',
        padding: isMobile ? '0 12px' : '0 20px',
        gap: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
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
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 5px rgba(196,32,32,0.45))' }}
          />
          {!isMobile && (
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              fontWeight: 700,
              color: '#C4A96A',
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
            <span style={{ width: 1, height: 18, background: 'rgba(139,112,48,0.2)', flexShrink: 0, marginRight: isMobile ? 10 : 14 }} />
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
                  {i > 0 && <span style={{ color: '#3A2E18', flexShrink: 0 }}>›</span>}
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
                        color: '#6A5A3A',
                        transition: 'color 200ms',
                        minHeight: 44,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: isMobile ? 140 : 'none',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#A89870' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#6A5A3A' }}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span style={{
                      color: i === visibleCrumbs.length - 1 ? '#8B7030' : '#6A5A3A',
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
              background: 'rgba(42,34,16,0.4)',
              border: '1px solid rgba(139,112,48,0.18)',
              borderRadius: 1,
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 11,
                  color: '#A89870',
                  lineHeight: 1.2,
                }}>
                  {playerName}
                </div>
                {playerRole && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 7,
                    color: '#4A3520',
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
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 3px rgba(196,32,32,0.2))', flexShrink: 0 }}
              />
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Sair"
            style={{
              background: 'none',
              border: '1px solid rgba(139,112,48,0.2)',
              color: '#6A5A3A',
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
              e.currentTarget.style.borderColor = 'rgba(196,32,32,0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = '#6A5A3A'
              e.currentTarget.style.borderColor = 'rgba(139,112,48,0.2)'
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
