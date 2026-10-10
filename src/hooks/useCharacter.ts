'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Character, CharacterRow } from '@/types/character.types'
import { normalizeRelations, rowToCharacter } from '@/types/character.types'
import { createCharacterSaver } from '@/lib/characterSaver'

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
    ...('portrait_url' in updates && { portraitUrl: updates.portrait_url ?? null }),
    ...(updates.gold !== undefined && { gold: updates.gold }),
    ...(updates.silver !== undefined && { silver: updates.silver }),
    ...(updates.copper !== undefined && { copper: updates.copper }),
    ...(updates.technique_states !== undefined && { techniqueStates: updates.technique_states }),
    ...(updates.talents !== undefined && { talents: updates.talents }),
    ...(updates.conditions !== undefined && { conditions: updates.conditions }),
    ...(updates.notes !== undefined && { notes: updates.notes ?? '' }),
    ...(updates.level !== undefined && { level: updates.level }),
    ...(updates.xp !== undefined && { xp: updates.xp }),
    ...(updates.hp_max !== undefined && { hpMax: updates.hp_max }),
    ...(updates.level_progress !== undefined && { levelProgress: updates.level_progress }),
    ...(updates.languages !== undefined && { languages: updates.languages }),
    ...(updates.knowledge_areas !== undefined && { knowledgeAreas: updates.knowledge_areas }),
    ...(updates.domain_id !== undefined && { domainId: updates.domain_id ?? '' }),
    ...(updates.faith !== undefined && { faith: updates.faith ?? '' }),
    ...(updates.background_details !== undefined && { backgroundDetails: updates.background_details }),
    ...(updates.relations !== undefined && { relations: normalizeRelations(updates.relations) }),
    ...(updates.impulses !== undefined && { impulses: updates.impulses }),
  }
}

export function useCharacter(characterId: string) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  /** Counts saves and misses; 0 means none yet. They key the sheet's save stamps. */
  const [savedAt, setSavedAt] = useState(0)
  const [conflictAt, setConflictAt] = useState(0)

  // Saves go through the saver so they can't overwrite a change someone else
  // just made (see lib/characterSaver).
  const saver = useMemo(() => {
    const supabase = createClient()
    return createCharacterSaver({
      write: async (updates, expected) => {
        let query = supabase.from('characters').update(updates).eq('id', characterId)
        if (expected !== undefined) query = query.eq('version', expected)
        const { data, error } = await query.select().maybeSingle()
        return { row: (data as CharacterRow | null) ?? null, error }
      },
      read: async () => {
        const { data } = await supabase.from('characters').select('*').eq('id', characterId).single()
        return (data as CharacterRow | null) ?? null
      },
      onRow: row => setCharacter(rowToCharacter(row)),
      onSaved: () => setSavedAt(n => n + 1),
      onConflict: () => setConflictAt(n => n + 1),
      onError: (updates, error) => console.error('[useCharacter] falha ao salvar', Object.keys(updates), error),
    })
  }, [characterId])

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single()
      .then(({ data }) => {
        if (data) {
          saver.loaded(data as CharacterRow)
          setCharacter(rowToCharacter(data as CharacterRow))
        }
        setLoading(false)
      })

    const channel = supabase
      .channel(`character:${characterId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` },
        payload => {
          saver.observed(payload.new as CharacterRow)
          setCharacter(rowToCharacter(payload.new as CharacterRow))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [characterId, saver])

  /**
   * Returns false when the write did not land: the sheet is reset to the
   * server row. A save that lost to someone else's also sets `conflictAt`, so
   * the sheet can say so instead of failing silently.
   */
  function updateCharacter(updates: Partial<CharacterRow>): Promise<boolean> {
    setCharacter(prev => (prev ? patchCharacter(prev, updates) : prev))
    return saver.save(updates)
  }

  return { character, loading, updateCharacter, savedAt, conflictAt }
}
