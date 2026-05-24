'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { PlayerCard } from './PlayerCard'
import { StatBlock } from '@/components/sheet/StatBlock'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {characters.map(c => (
          <PlayerCard
            key={c.id}
            character={c}
            expanded={expandedId === c.id}
            onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
          />
        ))}
        {characters.length === 0 && (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: '#3A2E18', gridColumn: '1 / -1' }}>
            Nenhum aventureiro nesta sessão.
          </p>
        )}
      </div>

      {expanded && (
        <div
          className="worn-border"
          style={{
            background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), #2E2210',
            border: '1px solid rgba(139,112,48,0.42)',
            borderTop: '2px solid #7A6030',
            boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
            padding: '18px 20px',
            display: 'flex', flexDirection: 'column', gap: 14,
            animation: 'inkSpread 400ms cubic-bezier(0.4,0,0.2,1) both',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: '#E8D9A8', letterSpacing: '0.04em' }}>
              {expanded.name}
            </h2>
            <button
              onClick={() => setExpandedId(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4A3520', fontFamily: 'var(--font-mono)', fontSize: 12,
                transition: 'color 300ms',
              }}
            >
              ✕
            </button>
          </div>
          <StatBlock stats={expanded.stats} />
          {expanded.spells.length > 0 && <Spells classId={expanded.classId} equippedSpells={expanded.spells} />}
        </div>
      )}
    </div>
  )
}
