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
    .select('id, player_name')
    .eq('id', id)
    .single()

  if (!character) notFound()

  return (
    <CharacterSheetClient
      characterId={character.id}
      playerName={character.player_name ?? user.user_metadata?.full_name ?? 'Player'}
    />
  )
}
