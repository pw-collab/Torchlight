'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PlayerCard } from './PlayerCard'
import { StatBlock } from '@/components/sheet/StatBlock'
import { Equipment } from '@/components/sheet/Equipment'
import { Spells } from '@/components/sheet/Spells'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'

interface Props {
  sessionId: string
}

export function SessionPanel({ sessionId }: Props) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('characters')
      .select('*')
      .eq('session_id', sessionId)
      .then(({ data }) => {
        if (data) setCharacters((data as CharacterRow[]).map(rowToCharacter))
      })

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'characters', filter: `session_id=eq.${sessionId}` },
        payload => {
          const updated = rowToCharacter(payload.new as CharacterRow)
          setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c))
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  const expanded = expandedId ? characters.find(c => c.id === expandedId) : null

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map(c => (
          <PlayerCard
            key={c.id}
            character={c}
            expanded={expandedId === c.id}
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
          />
        ))}
        {characters.length === 0 && (
          <p className="text-zinc-500 text-sm col-span-full">No characters in this session.</p>
        )}
      </div>
      {expanded && (
        <div className="rounded border border-amber-700 bg-zinc-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-400">{expanded.name}</h2>
            <button onClick={() => setExpandedId(null)} className="text-zinc-400 hover:text-white">✕</button>
          </div>
          <StatBlock stats={expanded.stats} />
          <Equipment equipment={expanded.equipment} />
          {expanded.spells.length > 0 && <Spells classId={expanded.classId} equippedSpells={expanded.spells} />}
        </div>
      )}
    </div>
  )
}
