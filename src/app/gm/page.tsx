import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { GMPageClient } from './GMPageClient'
import { discordIdOf } from '@/lib/discordId'

export default async function GMPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const discordId = discordIdOf(user)
  if (!discordId) redirect('/login?error=no_discord_id')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('gm_id', discordId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return <GMPageClient gmName={user.user_metadata?.full_name ?? 'GM'} gmId={discordId} session={session} />
}
