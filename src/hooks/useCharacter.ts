'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'

export function useCharacter(characterId: string) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()
      .then(({ data }) => {
        if (data) setCharacter(rowToCharacter(data as CharacterRow))
        setLoading(false)
      })

    const channel = supabase
      .channel(`character:${characterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` },
        payload => {
          setCharacter(rowToCharacter(payload.new as CharacterRow))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [characterId])

  const supabase = createClient()

  async function updateCharacter(updates: Partial<CharacterRow>) {
    await supabase.from('characters').update(updates).eq('id', characterId)
  }

  return { character, loading, updateCharacter }
}
