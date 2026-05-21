import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { CharacterSheetClient } from './CharacterSheetClient'

export default async function SheetPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub
  const { data: character } = await supabase
    .from('characters')
    .select('*')
    .eq('user_id', discordId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!character) {
    redirect('/character-creator')
  }

  return <CharacterSheetClient characterId={character.id} playerName={user.user_metadata?.full_name ?? 'Player'} />
}
