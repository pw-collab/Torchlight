import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function LandingPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-amber-400 mb-2">🕯️ Torchlight</h1>
      <p className="text-zinc-400 mb-8">Shadowdark RPG Companion</p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/login"
          className="rounded bg-amber-700 px-6 py-3 text-center font-bold text-white hover:bg-amber-600"
        >
          Login com Discord
        </Link>
      </div>
    </main>
  )
}
