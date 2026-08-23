'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Props {
  query: string
  onQuery: (value: string) => void
  tags: string[]
  activeTags: string[]
  onToggleTag: (tag: string) => void
  onlyFavorites: boolean
  onToggleFavorites: () => void
  onImport: () => void
  /** Quantas fichas sobraram do filtro, de quantas existem. */
  shown: number
  total: number
}

const CHIP =
  'font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase'

/**
 * O bestiário como uma lista que se procura.
 *
 * Era uma lista plana por Mestre: crescia a cada sessão e, no meio da cena, o
 * monstro estava lá em algum lugar. A busca alcança nome, tipo e tags; a
 * estrela marca o que é de hoje; a importação em lote poupa colar dez fichas
 * uma a uma.
 */
export function BestiaryToolbar({
  query, onQuery, tags, activeTags, onToggleTag,
  onlyFavorites, onToggleFavorites, onImport, shown, total,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Input
          value={query}
          onChange={e => onQuery(e.target.value)}
          placeholder="Procurar por nome, tipo ou tag…"
          aria-label="Procurar no bestiário"
          className="font-body border-border bg-secondary h-9 min-w-[180px] flex-1 text-[12px] italic"
        />

        <Button
          type="button"
          variant="outline"
          onClick={onToggleFavorites}
          title="Só o que está marcado para a sessão de hoje"
          className={cn(
            'font-heading h-9 min-h-9 shrink-0 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase',
            onlyFavorites
              ? 'border-[var(--chart-1)] text-[var(--chart-1)]'
              : 'border-[var(--border)] text-[var(--muted-foreground)]',
          )}
        >
          ★ Da sessão
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onImport}
          title="Colar vários statblocks de uma vez"
          className="font-heading h-9 min-h-9 shrink-0 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase"
        >
          ⇩ Importar
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {tags.map(tag => (
            <Button
              key={tag}
              type="button"
              variant="outline"
              onClick={() => onToggleTag(tag)}
              className={cn(
                CHIP,
                activeTags.includes(tag)
                  ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                  : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
              )}
            >
              {tag}
            </Button>
          ))}
        </div>
      )}

      {shown !== total && (
        <span className="font-body text-[10px] text-[var(--muted-foreground)] italic">
          {shown} de {total} ficha{total === 1 ? '' : 's'}
        </span>
      )}
    </div>
  )
}
