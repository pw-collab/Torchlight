import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { GMPageClient } from './GMPageClient'

export default async function GMPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('gm_id', discordId)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return <GMPageClient gmName={user.user_metadata?.full_name ?? 'GM'} session={session} />
}
