'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { CharacterEditModal } from '@/components/sheet/CharacterEditModal'
import { createClient } from '@/lib/supabase'
import { useCharacter } from '@/hooks/useCharacter'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import type { CharacterRow } from '@/types/character.types'

export interface CharacterSummary {
  id: string
  name: string
  classId: string
  ancestryId: string
  level: number
  hpCurrent: number
  hpMax: number
  ownerName?: string
  isOwnCharacter?: boolean
}

interface Props {
  characters: CharacterSummary[]
  playerName: string
  isGm?: boolean
}

function CharacterCard({
  char,
  onEdit,
  onDelete,
  isGm,
}: {
  char: CharacterSummary
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  isGm?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const cls = getClass(char.classId)
  const ancestry = getAncestry(char.ancestryId)

  return (
    <div
      className="worn-border card-surface"
      style={{ position: 'relative', minHeight: 160 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/sheet/${char.id}`}
        style={{
          display: 'block',
          padding: '20px 18px',
          textDecoration: 'none',
          color: 'inherit',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 7,
            letterSpacing: '0.12em',
            color: '#3A2E18',
            marginBottom: 10,
          }}
        >
          FICHA Nº {char.id.slice(0, 8).toUpperCase()}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--parchment-pale)',
            letterSpacing: '0.04em',
            marginBottom: 6,
            lineHeight: 1.2,
          }}
        >
          {char.name}
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            color: '#6A5A3A',
            marginBottom: isGm && char.ownerName ? 8 : 14,
            lineHeight: 1.5,
          }}
        >
          {cls?.name ?? char.classId} · {ancestry?.name ?? char.ancestryId}
        </p>
        {isGm && char.ownerName && (
          <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 7,
              letterSpacing: '0.1em',
              color: char.isOwnCharacter ? 'var(--verdigris-light)' : 'var(--candle-amber)',
              background: char.isOwnCharacter ? 'rgba(42,80,69,0.18)' : 'rgba(106,80,10,0.18)',
              border: `1px solid ${char.isOwnCharacter ? 'rgba(42,80,69,0.35)' : 'rgba(139,112,48,0.3)'}`,
              padding: '2px 6px',
              borderRadius: 1,
              textTransform: 'uppercase' as const,
            }}>
              {char.isOwnCharacter ? '● você' : char.ownerName}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--gold-oxidized)',
            }}
          >
            Nível {char.level}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--bone-muted)',
            }}
          >
            PV {char.hpCurrent}/{char.hpMax}
          </span>
        </div>
      </Link>

      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            display: 'flex',
            gap: 6,
            zIndex: 2,
          }}
        >
          <button
            type="button"
            title="Editar ficha"
            onClick={onEdit}
            style={cardActionStyle}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--parchment-light)'
              e.currentTarget.style.borderColor = 'rgba(139,112,48,0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'var(--bone-muted)'
              e.currentTarget.style.borderColor = 'rgba(139,112,48,0.35)'
            }}
          >
            ✏
          </button>
          <button
            type="button"
            title="Excluir ficha"
            onClick={onDelete}
            style={{ ...cardActionStyle, color: 'var(--blood-bright)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(196,32,32,0.55)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(139,112,48,0.35)'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

const cardActionStyle: React.CSSProperties = {
  background: 'rgba(13,10,5,0.92)',
  border: '1px solid rgba(139,112,48,0.35)',
  color: 'var(--bone-muted)',
  fontFamily: 'var(--font-heading)',
  fontSize: 11,
  cursor: 'pointer',
  borderRadius: 1,
  padding: '5px 9px',
  lineHeight: 1,
  transition: 'all 200ms',
}

function CreateCard() {
  return (
    <Link
      href="/character-creator"
      className="worn-border"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 160,
        padding: 24,
        textDecoration: 'none',
        border: '1px dashed rgba(139,112,48,0.35)',
        background: 'rgba(28,21,8,0.35)',
        transition: 'all 300ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(196,169,106,0.5)'
        e.currentTarget.style.background = 'rgba(42,34,16,0.45)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(139,112,48,0.35)'
        e.currentTarget.style.background = 'rgba(28,21,8,0.35)'
      }}
    >
      <span style={{ fontSize: 28, color: '#4A3520', marginBottom: 12, lineHeight: 1 }}>+</span>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--parchment-warm)',
          textAlign: 'center',
        }}
      >
        Criar novo personagem
      </span>
    </Link>
  )
}

function EditModalHost({
  characterId,
  onClose,
  onSaved,
}: {
  characterId: string
  onClose: () => void
  onSaved: (summary: CharacterSummary) => void
}) {
  const { character, loading, updateCharacter } = useCharacter(characterId)

  async function handleSave(patch: Partial<CharacterRow>) {
    await updateCharacter(patch)
    if (character) {
      onSaved({
        id: character.id,
        name: patch.name ?? character.name,
        classId: character.classId,
        ancestryId: character.ancestryId,
        level: patch.level ?? character.level,
        hpCurrent: character.hpCurrent,
        hpMax: patch.hp_max ?? character.hpMax,
      })
    }
    onClose()
  }

  if (loading || !character) return null

  return (
    <CharacterEditModal
      character={character}
      onSave={handleSave}
      onClose={onClose}
    />
  )
}

export function MyFilesClient({ characters: initialCharacters, playerName, isGm = false }: Props) {
  const router = useRouter()
  const [characters, setCharacters] = useState(initialCharacters)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleDelete = useCallback(
    async (e: React.MouseEvent, char: CharacterSummary) => {
      e.preventDefault()
      e.stopPropagation()
      const ok = window.confirm(
        `Excluir a ficha de "${char.name}"? Esta ação não pode ser desfeita.`
      )
      if (!ok) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub

      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', char.id)
        .eq('user_id', discordId)

      if (!error) {
        setCharacters(prev => prev.filter(c => c.id !== char.id))
        router.refresh()
      }
    },
    [router]
  )

  function handleEditSaved(summary: CharacterSummary) {
    setCharacters(prev =>
      prev.map(c => (c.id === summary.id ? { ...c, ...summary } : c))
    )
    router.refresh()
  }

  return (
    <AppShell
      breadcrumbs={[{ label: isGm ? 'Arquivo Geral' : 'Meus arquivos' }]}
      playerName={playerName}
      playerRole={isGm ? 'MESTRE' : 'ARQUIVISTA'}
    >
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px 40px' }}>
        <header style={{ marginBottom: 28, paddingBottom: 18, borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 26,
                    fontWeight: 700,
                    color: 'var(--parchment-pale)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isGm ? 'Arquivo Geral' : 'Meus arquivos'}
                </h1>
                {isGm && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 7.5,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--blood-bright)',
                    background: 'rgba(139,21,21,0.18)',
                    border: '1px solid rgba(196,32,32,0.35)',
                    padding: '3px 8px',
                    borderRadius: 1,
                    alignSelf: 'center',
                  }}>
                    Vista do Mestre
                  </span>
                )}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: '#6A5A3A',
                }}
              >
                {isGm
                  ? 'Você está visualizando todas as fichas da campanha.'
                  : 'Selecione uma ficha para abrir o grimório do personagem.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, paddingTop: 4 }}>
              <button
                onClick={() => router.push('/gm')}
                style={{
                  background: 'rgba(42,34,16,0.4)',
                  border: '1px solid rgba(139,112,48,0.3)',
                  color: '#8B7030',
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  padding: '7px 16px',
                  cursor: 'pointer',
                  borderRadius: 1,
                  transition: 'all 200ms',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--candle-amber)'
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.5)'
                  e.currentTarget.style.background = 'rgba(60,46,18,0.55)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#8B7030'
                  e.currentTarget.style.borderColor = 'rgba(139,112,48,0.3)'
                  e.currentTarget.style.background = 'rgba(42,34,16,0.4)'
                }}
              >
                Painel do Mestre
              </button>
              {!isGm && (
                <button
                  onClick={() => router.push('/character-creator')}
                  style={{
                    background: 'rgba(80,20,20,0.35)',
                    border: '1px solid rgba(196,32,32,0.4)',
                    color: 'var(--blood-bright)',
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 12,
                    padding: '7px 16px',
                    cursor: 'pointer',
                    borderRadius: 1,
                    transition: 'all 200ms',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(110,25,25,0.5)'
                    e.currentTarget.style.borderColor = 'rgba(196,32,32,0.65)'
                    e.currentTarget.style.color = '#E84040'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(80,20,20,0.35)'
                    e.currentTarget.style.borderColor = 'rgba(196,32,32,0.4)'
                    e.currentTarget.style.color = 'var(--blood-bright)'
                  }}
                >
                  + Criar Personagem
                </button>
              )}
            </div>
          </div>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 18,
          }}
        >
          {characters.map(char => (
            <CharacterCard
              key={char.id}
              char={char}
              isGm={isGm}
              onEdit={e => {
                e.preventDefault()
                e.stopPropagation()
                setEditingId(char.id)
              }}
              onDelete={e => handleDelete(e, char)}
            />
          ))}
          {!isGm && <CreateCard />}
        </div>
      </div>

      {editingId && (
        <EditModalHost
          characterId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={handleEditSaved}
        />
      )}
    </AppShell>
  )
}
