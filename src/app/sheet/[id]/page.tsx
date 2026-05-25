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

  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub
  const { data: character } = await supabase
    .from('characters')
    .select('id')
    .eq('id', id)
    .eq('user_id', discordId)
    .single()

  if (!character) notFound()

  return (
    <CharacterSheetClient
      characterId={character.id}
      playerName={user.user_metadata?.full_name ?? 'Player'}
    />
  )
}
