'use client'

import { createClient } from '@/lib/supabase'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

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
      className="flex min-h-screen flex-col items-center justify-center p-8"
      style={{
        background: `
          radial-gradient(ellipse at 12% 85%, rgba(42,26,58,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 88% 12%, rgba(139,21,21,0.12) 0%, transparent 40%),
          var(--ink-black)
        `,
      }}
    >
      {/* Logo mark */}
      <div className="mb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/skull-icon.png"
          alt="Torchlight"
          className="animate-flicker size-18 object-contain drop-shadow-[0_0_16px_rgba(196,32,32,0.6)]"
        />
      </div>

      {/* Title */}
      <h1 className="font-heading mb-1.5 text-center text-[32px] leading-none font-bold tracking-[0.05em] text-[var(--parchment-pale)]">
        Torchlight
      </h1>
      <p className="font-heading mb-8 text-[9px] tracking-[0.22em] text-[var(--parchment-warm)] uppercase">
        Ferramentas para Shadowdark RPG
      </p>

      {/* Error message */}
      {error && (
        <Alert
          variant="destructive"
          className="worn-border animate-ink-spread mb-5 w-full max-w-[360px] border-[rgba(139,21,21,0.5)] bg-[rgba(61,6,6,0.45)] px-5 py-2.5 text-center"
        >
          <AlertDescription className="text-[12px] leading-relaxed text-[var(--blood-bright)] italic">
            {ERROR_MESSAGES[error] ?? 'Erro desconhecido. Tentai novamente.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Login card */}
      <Card className="worn-border card-surface animate-mist-rise w-full max-w-[360px] gap-0 px-8 py-7">
        <CardHeader className="px-0">
          {/* Decorative rule */}
          <div className="font-mono mb-4.5 text-center text-[8px] tracking-[0.18em] text-[var(--gold-oxidized)]">
            ✦ ─── ARCHIVUM TORCHLIGHT ─── ✦
          </div>
          <p className="text-muted-foreground mb-5.5 text-center text-[13px] leading-[1.75] italic">
            O arquivo exige identificação antes de revelar seus segredos. Autenticai-vos através do
            Discord para prosseguir.
          </p>
        </CardHeader>

        <CardContent className="px-0">
          <Button
            onClick={handleDiscordLogin}
            className="h-auto w-full gap-2.5 rounded-[1px] border-[var(--blood-bright)] bg-[var(--blood-mid)] px-5 py-3 text-[11px] font-semibold tracking-[0.14em] text-[var(--parchment-pale)] shadow-[var(--glow-blood),0_2px_8px_rgba(0,0,0,0.5)] transition-all duration-[var(--duration-base)] ease-[var(--ease-ritual)] hover:bg-[var(--blood-bright)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.079.11 18.1.128 18.113a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
            </svg>
            Entrar com Discord
          </Button>
        </CardContent>

        <CardFooter className="mt-4.5 justify-center border-t border-[rgba(139,112,48,0.18)] px-0 pt-3.5">
          <p className="font-heading text-center text-[7.5px] tracking-[0.14em] text-[#3A2E18] uppercase">
            Acesso restrito — apenas aventureiros autorizados
          </p>
        </CardFooter>
      </Card>
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
