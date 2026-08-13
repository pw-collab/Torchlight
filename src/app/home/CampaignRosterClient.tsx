'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { CharacterEditModal } from '@/components/sheet/CharacterEditModal'
import { createClient } from '@/lib/supabase'
import { useCharacter } from '@/hooks/useCharacter'
import type { CharacterRow } from '@/types/character.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RosterCard } from './RosterCard'
import type { RosterCharacter } from './roster.types'

interface Props {
  characters: RosterCharacter[]
  playerName: string
  isGm?: boolean
}

/**
 * How many cards fill one row, per tier of `.roster-card`'s spans in
 * globals.css. Ordered narrowest first so the first match is the tightest
 * one that applies; anything wider takes WIDE_PAGE_SIZE, the design's six.
 * These queries have to track the CSS — a page that holds more cards than
 * the row shows would silently hide characters.
 */
const PAGE_SIZE_TIERS = [
  { query: '(max-width: 480px)', size: 1 },
  { query: '(max-width: 767px)', size: 2 },
  { query: '(max-width: 1024px)', size: 3 },
  { query: '(max-width: 1440px)', size: 4 },
] as const
const WIDE_PAGE_SIZE = 6

function usePageSize(): number {
  const [size, setSize] = useState(WIDE_PAGE_SIZE)

  useEffect(() => {
    const tiers = PAGE_SIZE_TIERS.map(tier => ({
      size: tier.size,
      mql: window.matchMedia(tier.query),
    }))
    const update = () => setSize(tiers.find(t => t.mql.matches)?.size ?? WIDE_PAGE_SIZE)

    update()
    tiers.forEach(t => t.mql.addEventListener('change', update))
    return () => tiers.forEach(t => t.mql.removeEventListener('change', update))
  }, [])

  return size
}

function EditModalHost({
  characterId,
  onClose,
  onRenamed,
}: {
  characterId: string
  onClose: () => void
  onRenamed: (id: string, name: string) => void
}) {
  const { character, loading, updateCharacter } = useCharacter(characterId)

  async function handleSave(patch: Partial<CharacterRow>) {
    await updateCharacter(patch)
    // The name is the only edited field the roster card renders.
    if (patch.name) onRenamed(characterId, patch.name)
    onClose()
  }

  if (loading || !character) return null

  return (
    <CharacterEditModal character={character} onSave={handleSave} onClose={onClose} />
  )
}

export function CampaignRosterClient({
  characters: initialCharacters,
  playerName,
  isGm = false,
}: Props) {
  const router = useRouter()
  const [characters, setCharacters] = useState(initialCharacters)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const pageSize = usePageSize()
  const pageCount = Math.max(1, Math.ceil(characters.length / pageSize))
  // Clamped on the way out rather than stored: a widening viewport (or a
  // deletion) fits more per page, which can strand `page` past the last one.
  const currentPage = Math.min(page, pageCount - 1)
  const visible = characters.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  const handleDelete = useCallback(
    async (char: RosterCharacter) => {
      const ok = window.confirm(
        `Excluir a ficha de "${char.name}"? Esta ação não pode ser desfeita.`
      )
      if (!ok) return

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // RLS enforces ownership: players can only delete own chars,
      // GMs can delete any char (characters_delete_gm_all policy).
      const { error } = await supabase.from('characters').delete().eq('id', char.id)

      if (!error) {
        setCharacters(prev => prev.filter(c => c.id !== char.id))
        router.refresh()
      }
    },
    [router]
  )

  function handleRenamed(id: string, name: string) {
    setCharacters(prev => prev.map(c => (c.id === id ? { ...c, name } : c)))
    router.refresh()
  }

  return (
    <AppShell playerName={playerName} playerRole={isGm ? 'MESTRE' : 'ARQUIVISTA'}>
      <div className="grid-12-wide">
        <header className="col-span-12 flex flex-col items-start border-b border-[var(--border)] pb-[18px]">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-px flex-1 flex-col items-start">
              <div className="flex w-full flex-wrap items-center gap-2.5">
                <h1 className="font-heading text-[clamp(30px,5vw,48px)] leading-[0.82] font-bold tracking-[1.3px] text-[var(--foreground)]">
                  Elenco da Campanha
                </h1>
                {isGm && (
                  <span className="rounded-[1px] border border-[var(--destructive)] bg-[var(--destructive)] px-2 py-[3px] text-[8px] tracking-[0.14em] text-white uppercase">
                    Vista do Mestre
                  </span>
                )}
              </div>
              <p className="pt-1.5 text-[13px] leading-[19.5px] text-[var(--muted-foreground)] italic">
                Selecione sua ficha para abrir o grimório do personagem.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {isGm && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/gm')}
                  className="font-heading h-11 min-h-11 rounded-[1px] border-[var(--border)] bg-[var(--card)] px-4 text-[16px] tracking-normal text-[var(--muted-foreground)] normal-case transition-all hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Painel do Mestre
                </Button>
              )}
              <Button
                onClick={() => router.push('/character-creator')}
                className="font-heading h-11 min-h-11 rounded-[1px] border border-[var(--border)] bg-[var(--destructive)] px-4 text-[16px] tracking-normal text-white normal-case transition-colors hover:bg-[color-mix(in_oklch,var(--destructive),black_14%)] lg:min-w-[257px]"
              >
                + Criar personagem
              </Button>
            </div>
          </div>
        </header>

        {characters.length === 0 ? (
          <p className="col-span-12 py-10 text-center text-[13px] text-[var(--muted-foreground)] italic">
            Nenhum personagem na campanha ainda. Crie o primeiro do elenco.
          </p>
        ) : (
          <section className="col-span-12" aria-label="Elenco da campanha">
            {/* Netflix's row indicator: one dash per page, at the top right. */}
            {pageCount > 1 && (
              <div className="roster-pager" aria-hidden>
                {Array.from({ length: pageCount }, (_, i) => (
                  <span
                    key={i}
                    className={cn('roster-pager__dash', i === currentPage && 'roster-pager__dash--active')}
                  />
                ))}
              </div>
            )}

            <div className="roster-row">
              {/* Keyed on the page so the cards replay their entry stagger on
                  every turn of the row. */}
              <div className="roster-track" key={currentPage}>
                {visible.map((char, i) => (
                  <RosterCard
                    key={char.id}
                    char={char}
                    index={i}
                    canAccess={char.isOwn || isGm}
                    onEdit={() => setEditingId(char.id)}
                    onDelete={() => handleDelete(char)}
                  />
                ))}
              </div>

              {currentPage > 0 && (
                <button
                  type="button"
                  className="roster-nav roster-nav--prev tactile"
                  aria-label="Personagens anteriores"
                  onClick={() => setPage(currentPage - 1)}
                >
                  ‹
                </button>
              )}
              {currentPage < pageCount - 1 && (
                <button
                  type="button"
                  className="roster-nav roster-nav--next tactile"
                  aria-label="Próximos personagens"
                  onClick={() => setPage(currentPage + 1)}
                >
                  ›
                </button>
              )}
            </div>

            {pageCount > 1 && (
              <p className="sr-only" aria-live="polite">
                Página {currentPage + 1} de {pageCount}
              </p>
            )}
          </section>
        )}
      </div>

      {editingId && (
        <EditModalHost
          characterId={editingId}
          onClose={() => setEditingId(null)}
          onRenamed={handleRenamed}
        />
      )}
    </AppShell>
  )
}
