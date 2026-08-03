'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PlayerCard } from './PlayerCard'
import { StatBlock } from '@/components/sheet/StatBlock'
import { Spells } from '@/components/sheet/Spells'
import type { Character, CharacterRow } from '@/types/character.types'
import { rowToCharacter } from '@/types/character.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
        {characters.map(c => (
          <PlayerCard
            key={c.id}
            character={c}
            expanded={expandedId === c.id}
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
          />
        ))}
        {characters.length === 0 && (
          <p className="col-span-full text-xs text-[#3A2E18] italic">
            Nenhum aventureiro nesta sessão.
          </p>
        )}
      </div>

      {expanded && (
        <Card className="worn-border animate-ink-spread gap-3.5 border-t-2 border-t-[#7A6030] bg-[#2E2210] px-5 py-4.5 shadow-[0_4px_20px_rgba(0,0,0,0.7)]">
          <CardHeader className="flex-row items-center justify-between px-0">
            <CardTitle className="font-heading text-lg font-bold tracking-[0.04em] text-[#E8D9A8]">
              {expanded.name}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setExpandedId(null)}
              aria-label="Fechar detalhes"
              className="font-mono text-xs text-[#4A3520]"
            >
              ✕
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3.5 px-0">
            <StatBlock stats={expanded.stats} />
            {expanded.spells.length > 0 && (
              <Spells classId={expanded.classId} equippedSpells={expanded.spells} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
