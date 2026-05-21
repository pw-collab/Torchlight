'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { sendToDiscord } from '@/lib/discord'
import { SessionPanel } from '@/components/gm/SessionPanel'

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
    <main className="mx-auto max-w-4xl p-4 space-y-4">
      <header className="rounded border border-amber-800 bg-zinc-800 p-4">
        <h1 className="text-2xl font-bold text-amber-400">⚔️ GM Panel</h1>
        <p className="text-sm text-zinc-400">{gmName}</p>
      </header>

      {!session ? (
        <div className="rounded border border-zinc-700 bg-zinc-800 p-4 space-y-3">
          <h2 className="font-bold text-white">Iniciar Sessão</h2>
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            placeholder="Nome da sessão..."
            className="w-full rounded bg-zinc-700 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-600"
          />
          <button
            onClick={createSession}
            disabled={creating || !sessionName.trim()}
            className="rounded bg-amber-700 px-4 py-2 font-bold text-white hover:bg-amber-600 disabled:opacity-40"
          >
            {creating ? 'Criando...' : '⚔️ Iniciar Sessão'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-white">{session.name}</h2>
            <span className="rounded bg-green-900 px-2 py-0.5 text-xs text-green-400 font-bold">ATIVA</span>
          </div>
          <SessionPanel sessionId={session.id} />
        </div>
      )}
    </main>
  )
}
