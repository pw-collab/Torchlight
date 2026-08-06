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
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
  index = 0,
}: {
  char: CharacterSummary
  onEdit: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  isGm?: boolean
  index?: number
}) {
  const [hovered, setHovered] = useState(false)
  const cls = getClass(char.classId)
  const ancestry = getAncestry(char.ancestryId)

  return (
    <div
      className="worn-border card-surface card-lift stagger-item"
      style={{ position: 'relative', minHeight: 160, animationDelay: `${Math.min(index * 45, 400)}ms` }}
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
            color: 'var(--muted-foreground)',
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
            color: 'var(--muted-foreground)',
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
              background: char.isOwnCharacter
                ? 'color-mix(in oklch, var(--chart-2), transparent 85%)'
                : 'color-mix(in oklch, var(--muted-foreground), transparent 88%)',
              border: `1px solid ${char.isOwnCharacter ? 'var(--chart-2)' : 'var(--border)'}`,
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
          <Button
            type="button"
            variant="outline"
            title="Editar ficha"
            aria-label="Editar ficha"
            onClick={onEdit}
            className={cn(CARD_ACTION_CLASS, 'hover:border-[var(--border)] hover:text-[var(--parchment-light)]')}
          >
            ✏
          </Button>
          <Button
            type="button"
            variant="outline"
            title="Excluir ficha"
            aria-label="Excluir ficha"
            onClick={onDelete}
            className={cn(CARD_ACTION_CLASS, 'text-[var(--blood-bright)] hover:border-[var(--destructive)]')}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  )
}

const CARD_ACTION_CLASS =
  'tactile text-muted-foreground size-11 min-h-11 min-w-11 rounded-[1px] border-[var(--border)] bg-[var(--card)] text-[13px] leading-none transition-all duration-200'

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
        border: '1px dashed var(--border)',
        background: 'var(--card)',
        transition: 'all 300ms',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--card)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--card)'
      }}
    >
      <span style={{ fontSize: 28, color: 'var(--muted-foreground)', marginBottom: 12, lineHeight: 1 }}>+</span>
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

      // RLS enforces ownership: players can only delete own chars,
      // GMs can delete any char (characters_delete_gm_all policy).
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', char.id)

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
      <div className="grid-12 grid-12-page--center" style={{ maxWidth: 960 }}>
        <header className="col-span-12" style={{ paddingBottom: 18, borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
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
                    fontSize: 8,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--blood-bright)',
                    background: 'var(--destructive)',
                    border: '1px solid var(--destructive)',
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
                  color: 'var(--muted-foreground)',
                }}
              >
                {isGm
                  ? 'Você está visualizando todas as fichas da campanha.'
                  : 'Selecione uma ficha para abrir o grimório do personagem.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              {isGm && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/gm')}
                  className="font-sans h-11 min-h-11 rounded-[1px] border-[var(--border)] bg-[var(--card)] px-4 text-[13px] tracking-normal text-[var(--muted-foreground)] normal-case italic transition-all duration-200 hover:border-[var(--chart-1)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                >
                  Painel do Mestre
                </Button>
              )}
              {!isGm && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/character-creator')}
                  className="font-sans h-11 min-h-11 rounded-[1px] border-[var(--destructive)] bg-[var(--destructive)]/15 px-4.5 text-[13px] tracking-normal text-[var(--blood-bright)] normal-case italic transition-all duration-200 hover:border-[var(--destructive)] hover:bg-[var(--destructive)] hover:text-[var(--primary)]"
                >
                  + Criar Personagem
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Character cards on the 12-col grid: span 4 (3-up) → 6 (2-up) → 12 (1-up) */}
        <div className="grid-12 col-span-12">
          {characters.map((char, i) => (
            <div key={char.id} className="col-span-4 col-sm-6 col-xs-12" style={{ display: 'grid' }}>
              <CharacterCard
                char={char}
                index={i}
                isGm={isGm}
                onEdit={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setEditingId(char.id)
                }}
                onDelete={e => handleDelete(e, char)}
              />
            </div>
          ))}
          {!isGm && (
            <div className="col-span-4 col-sm-6 col-xs-12" style={{ display: 'grid' }}>
              <CreateCard />
            </div>
          )}
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
