'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  children: React.ReactNode
  playerName?: string
  playerRole?: string
  breadcrumbs?: BreadcrumbItem[]
  topbarTitle?: string
}

export function AppShell({ children, playerName, playerRole, breadcrumbs = [], topbarTitle }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const currentPath = pathname.replace('/', '')

  function handleNavigate(path: string) {
    router.push(`/${path}`)
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: `
        radial-gradient(ellipse at 12% 85%, rgba(42,26,58,0.16) 0%, transparent 50%),
        radial-gradient(ellipse at 88% 12%, rgba(139,21,21,0.09) 0%, transparent 40%),
        radial-gradient(ellipse at 50% 50%, rgba(50,38,18,0.35) 0%, transparent 70%),
        #0D0A05
      `,
    }}>
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        playerName={playerName}
        playerRole={playerRole}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          height: 50, flexShrink: 0,
          background: '#1C1508',
          borderBottom: '1px solid rgba(139,112,48,0.22)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 9, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#4A3520',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>Torchlight</span>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#3A2E18' }}>›</span>
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
                      color: i === breadcrumbs.length - 1 ? '#8B7030' : '#6A5A3A',
                    }}
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span style={i === breadcrumbs.length - 1 ? { color: '#8B7030' } : {}}>{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={{
              background: 'transparent',
              border: '1px solid rgba(139,112,48,0.28)',
              color: '#7A6030',
              fontFamily: 'var(--font-heading)',
              fontSize: 8.5, letterSpacing: '0.16em',
              textTransform: 'uppercase',
              padding: '5px 12px', cursor: 'pointer',
              borderRadius: 1, transition: 'all 350ms',
            }}>
              ⚗ Dados
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
