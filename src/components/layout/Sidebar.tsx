'use client'

import { useState } from 'react'
import Image from 'next/image'

const MAIN_NAV = [
  { id: 'sheet',              icon: '✦', label: 'Ficha do Personagem' },
  { id: 'character-creator',  icon: '⚗', label: 'Criar Personagem' },
  { id: 'gm',                 icon: '☽', label: 'Painel do Mestre' },
]

const SYS_NAV = [
  { id: 'settings', icon: '❧', label: 'Configurações' },
]

const ICON_COLOR: Record<string, string> = {
  sheet: '#C4A96A',
  'character-creator': '#C9A84C',
  gm: '#6B4E8A',
  settings: '#6A5A3A',
}

interface Props {
  currentPath: string
  onNavigate: (path: string) => void
  playerName?: string
  playerRole?: string
}

export function Sidebar({ currentPath, onNavigate, playerName = 'Arquivista', playerRole = 'AVENTUREIRO' }: Props) {
  const [hov, setHov] = useState<string | null>(null)

  const navBtn = (id: string) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: 10,
    width: '100%',
    padding: '9px 14px',
    background: currentPath === id
      ? 'rgba(139,21,21,0.13)'
      : hov === id
        ? 'rgba(139,112,48,0.07)'
        : 'transparent',
    border: 'none',
    borderLeft: `2px solid ${currentPath === id ? '#8B1515' : hov === id ? 'rgba(139,112,48,0.25)' : 'transparent'}`,
    color: currentPath === id ? '#D4C9A0' : hov === id ? '#C4A96A' : '#6A5A3A',
    fontFamily: 'var(--font-heading)',
    fontSize: 11,
    letterSpacing: '0.05em',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all 350ms cubic-bezier(0.4,0,0.2,1)',
  })

  const sectionLabel = {
    fontFamily: 'var(--font-heading)',
    fontSize: 7.5,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: '#3A2E18',
    padding: '6px 14px 5px',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const sectionLine = { flex: 1, height: 1, background: 'rgba(139,112,48,0.18)' }

  return (
    <div
      className="panel-surface"
      style={{
        width: 240, minWidth: 240,
        display: 'flex', flexDirection: 'column', height: '100vh',
        boxShadow: '3px 0 16px rgba(0,0,0,0.6)',
        position: 'relative', zIndex: 10,
      }}
    >
      {/* Logo */}
      <div style={{
        padding: '18px 14px 14px',
        borderBottom: '1px solid rgba(139,112,48,0.2)',
        display: 'flex', alignItems: 'center', gap: 11,
        background: '#0D0A05',
      }}>
        <Image
          src="/skull-icon.png"
          alt="Torchlight"
          width={42} height={42}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 7px rgba(196,32,32,0.5))', flexShrink: 0 }}
        />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, fontWeight: 700, color: '#E8D9A8', letterSpacing: '0.04em', lineHeight: 1.2 }}>
            Torchlight
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7.5, color: '#4A3520', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 3 }}>
            Shadowdark VTT
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(139,112,48,0.14)' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#4A3520', fontSize: 9, pointerEvents: 'none', fontFamily: 'var(--font-heading)' }}>✦</span>
          <input
            type="text"
            placeholder="Buscar no arquivo..."
            style={{
              width: '100%',
              background: 'linear-gradient(144deg, rgba(58,42,20,.18) 0%, rgba(28,21,8,0) 50%, rgba(8,5,1,.12) 100%), #1C1508',
              border: '1px solid rgba(139,112,48,0.28)',
              color: '#C4A96A',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 11.5,
              padding: '7px 10px 7px 27px',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
              borderRadius: 1,
            }}
          />
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        <div style={sectionLabel}>
          <span style={sectionLine} /><span>Navegação</span><span style={sectionLine} />
        </div>
        {MAIN_NAV.map(n => (
          <button
            key={n.id}
            style={navBtn(n.id)}
            onClick={() => onNavigate(n.id)}
            onMouseEnter={() => setHov(n.id)}
            onMouseLeave={() => setHov(null)}
          >
            <span style={{ fontSize: 12, width: 17, textAlign: 'center', flexShrink: 0, color: ICON_COLOR[n.id] || '#C4A96A', opacity: 0.85 }}>
              {n.icon}
            </span>
            <span>{n.label}</span>
          </button>
        ))}
        <div style={{ ...sectionLabel, marginTop: 8 }}>
          <span style={sectionLine} /><span>Sistema</span><span style={sectionLine} />
        </div>
        {SYS_NAV.map(n => (
          <button
            key={n.id}
            style={navBtn(n.id)}
            onMouseEnter={() => setHov(n.id)}
            onMouseLeave={() => setHov(null)}
          >
            <span style={{ fontSize: 12, width: 17, textAlign: 'center', flexShrink: 0, color: ICON_COLOR[n.id] || '#6A5A3A', opacity: 0.85 }}>
              {n.icon}
            </span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      {/* User */}
      <div style={{ borderTop: '1px solid rgba(139,112,48,0.18)', padding: '6px 0 10px' }}>
        <div className="worn-border" style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 13px', margin: '4px 10px 0',
          background: 'rgba(42,34,16,0.35)',
          cursor: 'pointer',
          border: '1px solid rgba(139,112,48,0.18)',
        }}>
          <Image
            src="/skull-icon.png"
            alt=""
            width={28} height={28}
            style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 3px rgba(196,32,32,0.25))', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 9.5, letterSpacing: '0.06em', color: '#A89870' }}>
              {playerName}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: '#4A3520', marginTop: 1 }}>
              {playerRole}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
