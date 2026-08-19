import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { CharacterSheetClient } from '../CharacterSheetClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SheetByIdPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // RLS handles access control: players see own chars (characters_select_own),
  // GMs see all (characters_select_gm_all). No app-layer user_id filter needed.
  const { data: character } = await supabase
    .from('characters')
    .select('id, user_id, player_name')
    .eq('id', id)
    .single()

  if (!character) notFound()

  const viewerName = user.user_metadata?.full_name ?? 'Player'
  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub
  const isOwner = character.user_id === discordId

  // Characters forged before the wizard started writing `player_name` carry a
  // null one, and that null is what the roster card reads. The owner opening
  // their own sheet is the one moment the right name is at hand — a single
  // idempotent write per legacy character, and never for a visiting GM, whose
  // name is not the answer.
  if (!character.player_name && isOwner) {
    await supabase
      .from('characters')
      .update({ player_name: viewerName })
      .eq('id', character.id)
  }

  return (
    <CharacterSheetClient
      characterId={character.id}
      playerName={character.player_name ?? viewerName}
      isOwner={isOwner}
    />
  )
}
