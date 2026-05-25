'use client'

import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const ERROR_MESSAGES: Record<string, string> = {
  not_allowed: 'Vosso pergaminho de acesso não consta no arquivo. Contactai o Mestre.',
  no_discord_id: 'Identidade Discord não reconhecida. Tentai novamente.',
}

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  async function handleDiscordLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px',
        background: `
          radial-gradient(ellipse at 12% 85%, rgba(42,26,58,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 88% 12%, rgba(139,21,21,0.12) 0%, transparent 40%),
          var(--ink-black)
        `,
      }}
    >
      {/* Logo mark */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <img
          src="/skull-icon.png"
          alt="Torchlight"
          className="animate-flicker"
          style={{
            width: 72,
            height: 72,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 16px rgba(196,32,32,0.6))',
          }}
        />
      </div>

      {/* Title */}
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--parchment-pale)',
          letterSpacing: '0.05em',
          textAlign: 'center',
          marginBottom: 6,
          lineHeight: 1.1,
        }}
      >
        Torchlight
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--parchment-warm)',
          marginBottom: 32,
        }}
      >
        Ferramentas para Shadowdark RPG
      </p>

      {/* Error message */}
      {error && (
        <div
          className="worn-border animate-ink-spread"
          style={{
            background: 'rgba(61,6,6,0.45)',
            border: '1px solid rgba(139,21,21,0.5)',
            padding: '10px 20px',
            marginBottom: 20,
            maxWidth: 360,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 12,
              color: 'var(--blood-bright)',
              lineHeight: 1.6,
            }}
          >
            {ERROR_MESSAGES[error] ?? 'Erro desconhecido. Tentai novamente.'}
          </p>
        </div>
      )}

      {/* Login card */}
      <div
        className="worn-border card-surface animate-mist-rise"
        style={{
          padding: '28px 32px',
          maxWidth: 360,
          width: '100%',
        }}
      >
        {/* Decorative rule */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 18,
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: '0.18em',
            color: 'var(--gold-oxidized)',
          }}
        >
          ✦ ─── ARCHIVUM TORCHLIGHT ─── ✦
        </div>

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            color: 'var(--bone-muted)',
            lineHeight: 1.75,
            textAlign: 'center',
            marginBottom: 22,
          }}
        >
          O arquivo exige identificação antes de revelar seus segredos. Autenticai-vos através do Discord para prosseguir.
        </p>

        <button
          onClick={handleDiscordLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            background: 'var(--blood-mid)',
            border: '1px solid var(--blood-bright)',
            color: 'var(--parchment-pale)',
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontWeight: 600,
            padding: '12px 20px',
            cursor: 'pointer',
            borderRadius: 1,
            boxShadow: 'var(--glow-blood), 0 2px 8px rgba(0,0,0,0.5)',
            transition: `all var(--duration-base) var(--ease-ritual)`,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.079.11 18.1.128 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Entrar com Discord
        </button>

        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(139,112,48,0.18)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 7.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#3A2E18',
            }}
          >
            Acesso restrito — apenas aventureiros autorizados
          </p>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
