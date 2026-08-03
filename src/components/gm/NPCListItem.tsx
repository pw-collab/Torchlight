'use client'

import type { NPC } from '@/types/npc.types'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'

interface Props {
  npc: NPC
  selected: boolean
  onSelect: () => void
}

export function NPCListItem({ npc, selected, onSelect }: Props) {
  return (
    <Item
      render={<button type="button" onClick={onSelect} aria-current={selected} />}
      variant="outline"
      size="sm"
      className={cn(
        'tactile relative block w-full cursor-pointer overflow-hidden rounded-[1px] border-l-[3px]',
        'border-l-transparent px-3 py-2.5 text-left transition-colors duration-200',
        selected
          ? 'border-[rgba(196,120,42,0.5)] bg-[rgba(139,112,48,0.18)]'
          : 'border-[rgba(139,112,48,0.2)] bg-[rgba(42,34,16,0.3)] hover:border-[rgba(139,112,48,0.4)] hover:bg-[rgba(60,46,18,0.45)]',
      )}
    >
      {/* Selection bar — grows vertically when selected */}
      <span
        aria-hidden
        className={cn(
          'absolute -left-[3px] inset-y-0 w-[3px] origin-center bg-[var(--candle-amber)]',
          'transition-transform duration-[260ms] ease-[var(--ease-ritual)]',
          selected ? 'scale-y-100 shadow-[0_0_8px_rgba(196,120,42,0.6)]' : 'scale-y-0',
        )}
      />

      <ItemContent className="gap-0">
        <ItemTitle
          className={cn(
            'font-heading mb-[3px] block truncate text-sm leading-tight tracking-[0.03em]',
            selected ? 'text-[var(--parchment-pale)]' : 'text-[var(--parchment-light)]',
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
      </ItemContent>
    </Item>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span className="font-mono text-muted-foreground text-[9px] tracking-[0.06em]">
      <span className="text-[rgba(139,112,48,0.7)]">{label}</span> {value}
    </span>
  )
}
