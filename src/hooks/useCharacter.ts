'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'

function patchCharacter(character: Character, updates: Partial<CharacterRow>): Character {
  return {
    ...character,
    ...(updates.hp_current !== undefined && { hpCurrent: updates.hp_current }),
    ...(updates.luck_tokens !== undefined && { luckTokens: updates.luck_tokens }),
    ...('torch_end_at' in updates && { torchEndAt: updates.torch_end_at ?? null }),
    ...(updates.melee_bonus !== undefined && { meleeBonus: updates.melee_bonus }),
    ...(updates.ranged_bonus !== undefined && { rangedBonus: updates.ranged_bonus }),
    ...(updates.spellcasting_bonus !== undefined && { spellcastingBonus: updates.spellcasting_bonus }),
    ...(updates.casting_attr !== undefined && { castingAttr: updates.casting_attr }),
    ...(updates.gold !== undefined && { gold: updates.gold }),
    ...(updates.silver !== undefined && { silver: updates.silver }),
    ...(updates.copper !== undefined && { copper: updates.copper }),
    ...(updates.technique_states !== undefined && { techniqueStates: updates.technique_states }),
  }
}

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
    setCharacter(prev => (prev ? patchCharacter(prev, updates) : prev))

    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', characterId)
      .select()
      .single()

    if (error) {
      const { data: refetched } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single()
      if (refetched) setCharacter(rowToCharacter(refetched as CharacterRow))
      return
    }

    if (data) setCharacter(rowToCharacter(data as CharacterRow))
  }

  return { character, loading, updateCharacter }
}
