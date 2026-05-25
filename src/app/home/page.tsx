import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { MyFilesClient } from './MyFilesClient'
import type { CharacterSummary } from './MyFilesClient'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub
  const { data: rows } = await supabase
    .from('characters')
    .select('id, name, class_id, ancestry_id, level, hp_current, hp_max')
    .eq('user_id', discordId)
    .order('created_at', { ascending: false })

  const characters: CharacterSummary[] = (rows ?? []).map(row => ({
    id: row.id,
    name: row.name,
    classId: row.class_id,
    ancestryId: row.ancestry_id,
    level: row.level,
    hpCurrent: row.hp_current,
    hpMax: row.hp_max,
  }))

  return (
    <MyFilesClient
      characters={characters}
      playerName={user.user_metadata?.full_name ?? 'Aventureiro'}
    />
  )
}
