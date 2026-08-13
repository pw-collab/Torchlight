import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { CampaignRosterClient } from './CampaignRosterClient'
import type { RosterCharacter } from './roster.types'

interface RosterRow {
  id: string
  name: string
  concept: string | null
  portrait_url: string | null
  owner_name: string | null
  is_own: boolean
}

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

  // The whole cast, viewer's own first, limited to the columns the cards
  // render — RLS alone can't do this, so the ordering and the column list
  // live in campaign_roster() (migration 013).
  const { data: rows, error } = await supabase.rpc('campaign_roster')

  let characters: RosterCharacter[] = ((rows ?? []) as RosterRow[]).map(row => ({
    id: row.id,
    name: row.name,
    concept: row.concept,
    portraitUrl: row.portrait_url,
    ownerName: row.owner_name,
    isOwn: row.is_own,
  }))

  if (error) {
    // Migrations are applied by hand against Supabase (see DEPLOY.md), so this
    // deploy can land before 013 does. Until it's applied, fall back to what
    // RLS grants directly: own characters, or every character for a GM.
    const query = supabase
      .from('characters')
      .select('id, name, background_details, portrait_url, user_id, player_name')
      .order('created_at', { ascending: false })

    if (!isGm) query.eq('user_id', discordId)

    const { data: fallbackRows } = await query

    characters = (fallbackRows ?? [])
      .map(row => ({
        id: row.id,
        name: row.name,
        concept: (row.background_details as { concept?: string } | null)?.concept?.trim() || null,
        portraitUrl: row.portrait_url,
        ownerName: row.player_name,
        isOwn: row.user_id === discordId,
      }))
      .sort((a, b) => Number(b.isOwn) - Number(a.isOwn))
  }

  return (
    <CampaignRosterClient
      characters={characters}
      playerName={user.user_metadata?.full_name ?? 'Aventureiro'}
      isGm={isGm}
    />
  )
}
