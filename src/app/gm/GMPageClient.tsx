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

        {/* Page header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '22px 0 18px',
            borderBottom: '1px solid rgba(139,112,48,0.22)',
            marginBottom: 22,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--parchment-pale)',
                letterSpacing: '0.05em',
                marginBottom: 4,
                lineHeight: 1.1,
              }}
            >
              Painel do Mestre
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 12,
                color: '#6A5A3A',
              }}
            >
              Visão geral dos aventureiros e do estado da campanha
            </p>
          </div>

          {session && (
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 7.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--verdigris-light)',
                background: 'rgba(42,80,69,0.15)',
                border: '1px solid rgba(42,80,69,0.35)',
                padding: '4px 12px',
                borderRadius: 1,
                alignSelf: 'flex-start',
                marginTop: 4,
              }}
            >
              ✦ Sessão Ativa
            </span>
          )}
        </div>

        {!session ? (
          /* Create session form */
          <div
            className="worn-border card-surface animate-mist-rise"
            style={{ padding: '24px 28px', maxWidth: 480 }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--bone-white)',
                letterSpacing: '0.05em',
                marginBottom: 6,
              }}
            >
              Iniciar Nova Sessão
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--bone-muted)',
                marginBottom: 18,
                lineHeight: 1.65,
              }}
            >
              Registrai o título desta sessão nos anais do arquivo antes de invocar os aventureiros.
            </p>

            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createSession()}
              placeholder="Nome da sessão..."
              style={{
                width: '100%',
                background: 'var(--ink-deep)',
                border: '1px solid rgba(139,112,48,0.28)',
                color: 'var(--parchment-light)',
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 13,
                padding: '9px 12px',
                outline: 'none',
                borderRadius: 1,
                boxSizing: 'border-box',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                marginBottom: 14,
                transition: `border-color var(--duration-base) var(--ease-ritual)`,
              }}
            />

            <div
              style={{
                borderTop: '1px solid rgba(139,112,48,0.15)',
                marginBottom: 14,
              }}
            />

            <button
              onClick={createSession}
              disabled={creating || !sessionName.trim()}
              style={{
                background: creating ? 'var(--parchment-mid)' : 'var(--blood-mid)',
                border: `1px solid ${creating ? 'rgba(139,112,48,0.22)' : 'var(--blood-bright)'}`,
                color: 'var(--parchment-pale)',
                fontFamily: 'var(--font-heading)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: '9px 22px',
                cursor: creating || !sessionName.trim() ? 'not-allowed' : 'pointer',
                borderRadius: 1,
                opacity: !sessionName.trim() ? 0.45 : 1,
                boxShadow: creating ? 'none' : '0 2px 8px rgba(0,0,0,0.5)',
                transition: `all var(--duration-base) var(--ease-ritual)`,
              }}
            >
              {creating ? '⧖ Registrando...' : '⚔ Iniciar Sessão'}
            </button>
          </div>
        ) : (
          /* Active session view */
          <div className="animate-ink-spread">
            {/* Session title bar */}
            <div
              className="worn-border"
              style={{
                background: 'rgba(28,21,8,0.6)',
                border: '1px solid rgba(139,112,48,0.22)',
                padding: '12px 18px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--verdigris-light)',
                  boxShadow: '0 0 6px rgba(61,112,96,0.6)',
                  flexShrink: 0,
                }}
              />
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--bone-white)',
                  letterSpacing: '0.04em',
                  lineHeight: 1.2,
                }}
              >
                {session.name}
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 7.5,
                  color: '#3A2E18',
                  letterSpacing: '0.1em',
                  marginLeft: 'auto',
                }}
              >
                ID: {session.id.slice(0, 8).toUpperCase()}
              </span>
            </div>

            <SessionPanel sessionId={session.id} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
