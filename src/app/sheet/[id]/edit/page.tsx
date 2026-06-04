import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { rowToCharacter } from '@/types/character.types'
import type { CharacterRow } from '@/types/character.types'
import { CharacterEditWizard } from './CharacterEditWizard'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CharacterEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub

  const { data: row } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single()

  if (!row) notFound()

  const { data: gmRow } = await supabase
    .from('allowed_discord_ids')
    .select('role')
    .eq('discord_id', discordId)
    .single()

  const isGM = gmRow?.role === 'gm'
  if ((row as CharacterRow).user_id !== discordId && !isGM) redirect('/home')

  return <CharacterEditWizard character={rowToCharacter(row as CharacterRow)} />
}
