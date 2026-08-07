'use client'

import { getItem } from '@/data/equipment/index'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Item, ItemContent, ItemGroup, ItemTitle } from '@/components/ui/item'
import { Empty, EmptyDescription } from '@/components/ui/empty'

interface Props {
  equipment: { itemId: string; slots: number }[]
}

export function Equipment({ equipment }: Props) {
  return (
    <Card className="worn-border bg-[var(--parchment-mid)] py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
      <CardHeader className="border-b border-[var(--border)] px-4 pb-[7px]">
        <OrnateTitle>⚗ Equipamento</OrnateTitle>
      </CardHeader>

      <CardContent className="px-4">
        {equipment.length === 0 ? (
          <Empty className="p-0">
            <EmptyDescription className="text-[var(--parchment-warm)] italic">
              Nenhum item registrado no arquivo.
            </EmptyDescription>
          </Empty>
        ) : (
          <ItemGroup>
            {equipment.map((e, i) => {
              const item = getItem(e.itemId)
              return (
                <Item
                  key={i}
                  size="sm"
                  className="justify-between gap-2 px-0 py-[7px] not-last:border-b not-last:border-[var(--border)]"
                >
                  <ItemContent className="gap-0">
                    <ItemTitle className="font-heading text-[11px] font-medium tracking-[0.03em] text-[var(--parchment-light)]">
                      {item?.name ?? e.itemId}
                    </ItemTitle>
                  </ItemContent>
                  <span className="font-mono text-muted-foreground text-[9px]">
                    {e.slots} slot{e.slots !== 1 ? 's' : ''}
                  </span>
                </Item>
              )
            })}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  )
}
