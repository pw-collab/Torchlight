import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { MyFilesClient } from './MyFilesClient'
import type { CharacterSummary } from './MyFilesClient'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub

  // Check GM role
  const { data: roleRow } = await supabase
    .from('allowed_discord_ids')
    .select('role')
    .eq('discord_id', discordId)
    .single()

  const isGm = roleRow?.role === 'gm'

  // GMs fetch all characters; players fetch only their own
  const query = supabase
    .from('characters')
    .select('id, name, class_id, ancestry_id, level, hp_current, hp_max, user_id, player_name')
    .order('created_at', { ascending: false })

  if (!isGm) query.eq('user_id', discordId)

  const { data: rows } = await query

  const characters: CharacterSummary[] = (rows ?? []).map(row => ({
    id: row.id,
    name: row.name,
    classId: row.class_id,
    ancestryId: row.ancestry_id,
    level: row.level,
    hpCurrent: row.hp_current,
    hpMax: row.hp_max,
    ownerName: isGm ? (row.player_name ?? row.user_id.slice(0, 8)) : undefined,
    isOwnCharacter: isGm ? row.user_id === discordId : undefined,
  }))

  return (
    <MyFilesClient
      characters={characters}
      playerName={user.user_metadata?.full_name ?? 'Aventureiro'}
      isGm={isGm}
    />
  )
}
