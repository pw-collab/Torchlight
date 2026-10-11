'use client'

import { useState } from 'react'
import type { NPC } from '@/types/npc.types'
import type { NpcPick } from '@/hooks/useEncounterControls'
import { filterBestiary } from '@/lib/bestiary'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHIP, LABEL } from './ui'
import { cn } from '@/lib/utils'

/**
 * Escolher quem entra na briga: quantos de cada ficha, com busca e as estrelas
 * do dia primeiro. Serve para abrir o combate (com nome) e para chamar
 * reforços no meio dele.
 */
export function MonsterPicker({
  mode, bestiary, defaultName = '', busy, onConfirm,
}: {
  mode: 'start' | 'add'
  bestiary: NPC[]
  defaultName?: string
  busy?: boolean
  onConfirm: (name: string, picks: NpcPick[]) => void
}) {
  const [name, setName] = useState(defaultName)
  const [query, setQuery] = useState('')
  const [counts, setCounts] = useState<Record<string, number>>({})

  const shown = filterBestiary(bestiary, { query, tags: [], onlyFavorites: false })
    .slice()
    .sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.name.localeCompare(b.name, 'pt-BR'))

  const picks: NpcPick[] = bestiary
    .filter(npc => (counts[npc.id] ?? 0) > 0)
    .map(npc => ({ npc, count: counts[npc.id] }))
  const total = picks.reduce((sum, p) => sum + p.count, 0)

  const bump = (id: string, by: number) =>
    setCounts(prev => ({ ...prev, [id]: Math.max(0, Math.min(20, (prev[id] ?? 0) + by)) }))

  return (
    <div className="flex flex-col gap-2.5">
      {mode === 'start' && (
        <Input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value.slice(0, 40))}
          placeholder="Emboscada na ponte…"
          aria-label="Nome do combate"
          className="font-body border-border bg-secondary h-9 text-[12px] italic"
        />
      )}

      <Input
        autoFocus={mode === 'add'}
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Buscar no bestiário…"
        aria-label="Buscar ficha"
        className="font-body border-border bg-secondary h-8 text-[11px]"
      />

      {bestiary.length === 0 ? (
        <p className="font-body text-[11px] text-[var(--muted-foreground)] italic">
          O bestiário está vazio. Crie fichas na aba &quot;NPCs &amp; Monstros&quot;.
          {mode === 'start' && ' Dá para começar o combate só com o grupo e chamar os monstros depois.'}
        </p>
      ) : (
        <ul className="m-0 flex max-h-[260px] list-none flex-col gap-1 overflow-y-auto p-0">
          {shown.map(npc => {
            const n = counts[npc.id] ?? 0
            return (
              <li
                key={npc.id}
                className={cn(
                  'flex items-center gap-2 border px-2 py-1.5',
                  n > 0 ? 'border-[var(--destructive)] bg-[var(--input)]' : 'border-[var(--border)]',
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-heading truncate text-[11px] text-[var(--foreground)]">
                    {npc.favorite && <span className="text-[var(--chart-1)]">★ </span>}{npc.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
                    PV {npc.hp ?? '?'} · CA {npc.ac ?? '?'}{npc.level != null ? ` · NV ${npc.level}` : ''}
                  </span>
                </span>
                <Button type="button" variant="outline" onClick={() => bump(npc.id, -1)} disabled={n === 0} aria-label={`Menos ${npc.name}`} className={cn(CHIP, 'w-7 px-0 disabled:opacity-30')}>
                  −
                </Button>
                <span className="font-mono w-5 text-center text-[12px] text-[var(--foreground)]">{n}</span>
                <Button type="button" variant="outline" onClick={() => bump(npc.id, 1)} aria-label={`Mais ${npc.name}`} className={cn(CHIP, 'w-7 px-0')}>
                  +
                </Button>
              </li>
            )
          })}
          {shown.length === 0 && (
            <li className="font-body text-[11px] text-[var(--muted-foreground)] italic">Nada com essa busca.</li>
          )}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <span className={LABEL}>
          {total === 0 ? 'Ninguém escolhido' : `${total} na trilha`}
        </span>
        <Button
          type="button"
          onClick={() => onConfirm(name, picks)}
          disabled={busy || (mode === 'add' && total === 0)}
          className="ml-auto h-11 px-4 text-[11px] tracking-[0.12em] disabled:opacity-40"
        >
          {mode === 'start' ? 'Começar o combate' : 'Pôr na trilha'}
        </Button>
      </div>
    </div>
  )
}
