'use client'

import { useSlots } from '@/hooks/useSlots'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  str: number
  equipment: { slots: number }[]
}

export function SlotTracker({ str, equipment }: Props) {
  const { max, used, overEncumbered } = useSlots(str, equipment)

  return (
    <Card className="worn-border border-t-0 bg-[var(--parchment-mid)] py-5">
      <CardContent className="px-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-[10px] italic">Capacidade de Carga</span>
          <span
            className={cn(
              'font-mono text-[10px]',
              overEncumbered ? 'text-[var(--blood-bright)]' : 'text-[var(--parchment-light)]',
            )}
          >
            {used} / {max}
          </span>
        </div>

        <div
          className="flex flex-wrap gap-[3px]"
          role="meter"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label="Espaços de carga usados"
        >
          {Array.from({ length: max }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'size-2.5 rounded-[1px] border',
                i < used
                  ? overEncumbered
                    ? 'border-[var(--blood-mid)] bg-[var(--destructive)]'
                    : 'border-[var(--muted-foreground)] bg-[var(--border)]'
                  : 'border-[var(--border)] bg-black/30',
              )}
            />
          ))}
        </div>

        {overEncumbered && (
          <p className="mt-1.5 text-[10px] text-[var(--blood-bright)] italic">
            Sobrecarregado — penalidade de movimento aplicada.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
