'use client'

import type { NPC } from '@/types/npc.types'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'

interface Props {
  npc: NPC
  selected: boolean
  onSelect: () => void
  /** Marca a ficha para a sessão de hoje. */
  onToggleFavorite?: () => void
}

export function NPCListItem({ npc, selected, onSelect, onToggleFavorite }: Props) {
  return (
    <Item
      render={<button type="button" onClick={onSelect} aria-current={selected} />}
      variant="outline"
      size="sm"
      className={cn(
        'tactile relative block w-full cursor-pointer overflow-hidden rounded-[1px] border-l-[3px]',
        'border-l-transparent px-3 py-2.5 text-left transition-colors duration-200',
        selected
          ? 'border-[var(--primary)] bg-[var(--input)]'
          : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)] hover:bg-[var(--accent)] hover:*:text-[var(--accent-foreground)]',
      )}
    >
      {/* Selection bar — grows vertically when selected */}
      <span
        aria-hidden
        className={cn(
          'absolute -left-[3px] inset-y-0 w-[3px] origin-center bg-[var(--primary)]',
          'transition-transform duration-[260ms] ease-[var(--ease-ritual)]',
          selected ? 'scale-y-100 shadow-[0_0_8px_color-mix(in_oklch,var(--primary),transparent_70%)]' : 'scale-y-0',
        )}
      />

      {/* A estrela fica fora do conteúdo para não virar parte do alvo de
          seleção: marcar não é abrir. */}
      {onToggleFavorite && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggleFavorite() }
          }}
          title={npc.favorite ? 'Tirar da sessão de hoje' : 'Marcar para a sessão de hoje'}
          aria-label={npc.favorite ? `Tirar ${npc.name} da sessão` : `Marcar ${npc.name} para a sessão`}
          className={cn(
            'absolute top-2 right-2 z-10 cursor-pointer text-[12px] leading-none transition-opacity',
            npc.favorite ? 'text-[var(--chart-1)] opacity-100' : 'text-[var(--muted-foreground)] opacity-40 hover:opacity-100',
          )}
        >
          {npc.favorite ? '★' : '☆'}
        </span>
      )}

      <ItemContent className="gap-0">
        <ItemTitle
          className={cn(
            'font-heading mb-[3px] block truncate text-sm leading-tight tracking-[0.03em]',
            selected ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
          )}
        >
          {npc.name}
        </ItemTitle>

        {npc.npcType && (
          <ItemDescription className="text-muted-foreground mb-[5px] truncate text-[11px] italic">
            {npc.npcType}
          </ItemDescription>
        )}

        {/* Quick stat chips */}
        <div className="flex flex-wrap gap-2">
          {npc.level != null && <Chip label="LV" value={npc.level} />}
          {npc.hp != null && <Chip label="HP" value={npc.hp} />}
          {npc.ac != null && <Chip label="CA" value={npc.ac} />}
        </div>

        {npc.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {npc.tags.map(tag => (
              <span
                key={tag}
                className="font-heading border border-[var(--border)] px-1.5 py-[1px] text-[7px] tracking-[0.1em] text-[var(--muted-foreground)] uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </ItemContent>
    </Item>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-mono text-muted-foreground text-[9px] tracking-[0.06em]">
      <span className="text-[var(--muted-foreground)]">{label}</span> {value}
    </span>
  )
}
