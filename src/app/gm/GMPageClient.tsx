'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { sendToDiscord } from '@/lib/discord'
import { SessionPanel } from '@/components/gm/SessionPanel'
import { AppShell } from '@/components/layout/AppShell'

interface Props {
  gmName: string
  session: { id: string; name: string } | null
}

export function GMPageClient({ gmName, session: initialSession }: Props) {
  const [session, setSession] = useState(initialSession)
  const [sessionName, setSessionName] = useState('')
  const [creating, setCreating] = useState(false)

  async function createSession() {
    if (!sessionName.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const discordId = user?.user_metadata?.provider_id ?? user?.user_metadata?.sub
    const { data } = await supabase
      .from('sessions')
      .insert({ gm_id: discordId, name: sessionName, active: true })
      .select('*')
      .single()
    if (data) {
      setSession(data)
      await sendToDiscord({ type: 'session_start', gm: gmName })
    }
    setCreating(false)
  }

  return (
    <AppShell
      breadcrumbs={['Painel do Mestre']}
      playerName={gmName}
      playerRole="MESTRE · CAMPANHA ATIVA"
    >
      <div style={{ padding: '0 24px 32px' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: '22px 0 18px', borderBottom: '1px solid rgba(139,112,48,0.22)', marginBottom: 18,
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: '#E8D9A8', letterSpacing: '0.05em', marginBottom: 4 }}>
              Painel do Mestre
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: '#6A5A3A' }}>
              Visão geral dos aventureiros — {gmName}
            </p>
          </div>
          {session && (
            <span style={{
              fontFamily: 'var(--font-heading)', fontSize: 7.5, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#3D7060',
              background: 'rgba(42,80,69,0.15)', border: '1px solid rgba(42,80,69,0.35)',
              padding: '3px 10px', borderRadius: 1,
            }}>
              ✦ Sessão Ativa
            </span>
          )}
        </div>

        {!session ? (
          <div
            className="worn-border"
            style={{
              background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), #2E2210',
              border: '1px solid rgba(139,112,48,0.33)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              padding: '24px', maxWidth: 480,
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: '#D4C9A0', letterSpacing: '0.05em', marginBottom: 16 }}>
              Iniciar Nova Sessão
            </h2>
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Nome da sessão..."
              style={{
                width: '100%', background: '#130E07',
                border: '1px solid rgba(139,112,48,0.28)',
                color: '#C4A96A', fontFamily: 'var(--font-body)',
                fontStyle: 'italic', fontSize: 13,
                padding: '8px 12px', outline: 'none', borderRadius: 1,
                boxSizing: 'border-box', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                marginBottom: 14,
              }}
            />
            <button
              onClick={createSession}
              disabled={creating || !sessionName.trim()}
              style={{
                background: '#8B1515', border: '1px solid #C42020',
                color: '#E8D9A8', fontFamily: 'var(--font-heading)', fontSize: 10,
                letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
                padding: '9px 20px', cursor: creating ? 'not-allowed' : 'pointer',
                borderRadius: 1, opacity: (creating || !sessionName.trim()) ? 0.5 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)', transition: 'all 350ms',
              }}
            >
              {creating ? 'Registrando...' : '⚔ Iniciar Sessão'}
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#D4C9A0', letterSpacing: '0.04em', marginBottom: 16 }}>
              {session.name}
            </h2>
            <SessionPanel sessionId={session.id} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
