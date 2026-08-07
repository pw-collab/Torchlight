'use client'

import { useTorch } from '@/hooks/useTorch'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  torchEndAt: string | null
  playerName: string
  characterId: string
  onUpdate: (torchEndAt: string | null) => void
}

export function TorchTimer({ torchEndAt, playerName, characterId, onUpdate }: Props) {
  const stableOnUpdate = useCallback(onUpdate, [onUpdate])
  const { minutesLeft, lightTorch, extinguishTorch } = useTorch(torchEndAt, playerName, characterId, stableOnUpdate)

  const isLit = torchEndAt !== null
  const isLow = minutesLeft !== null && minutesLeft <= 10

  const labelText = isLit
    ? isLow ? '⚠ Tocha Quase Apagando' : '🕯 Tocha Acesa'
    : '🌑 Tocha Apagada'

  return (
    <Card
      className={cn(
        'worn-border bg-[var(--parchment-mid)] py-3',
        isLit
          ? isLow
            ? 'border-[var(--destructive)] shadow-[0_4px_14px_rgba(0,0,0,0.6),0_0_8px_color-mix(in_oklch,var(--destructive),transparent_75%)]'
            : 'border-[var(--primary)] shadow-[0_4px_14px_rgba(0,0,0,0.6),0_0_8px_color-mix(in_oklch,var(--primary),transparent_75%)]'
          : 'border-[var(--border)] shadow-[0_4px_14px_rgba(0,0,0,0.6)]',
      )}
    >
      <CardContent className="px-3.5">
        <div className="mb-2.5 flex items-center justify-between">
          <span
            className={cn(
              'font-heading text-[8.5px] tracking-[0.2em] uppercase',
              isLit
                ? isLow ? 'text-[var(--blood-bright)]' : 'text-[var(--candle-amber)]'
                : 'text-muted-foreground',
            )}
          >
            {labelText}
          </span>
          {isLit && minutesLeft !== null && (
            <span
              className={cn(
                'font-mono text-[13px] font-bold',
                isLow ? 'text-[var(--blood-bright)]' : 'text-[var(--candle-amber)]',
              )}
            >
              {minutesLeft}min
            </span>
          )}
        </div>

        {!isLit ? (
          <Button
            onClick={lightTorch}
            variant="outline"
            className="text-foreground w-full border-[var(--primary)] bg-[var(--primary)]/15 text-[9.5px] tracking-[0.14em] transition-all duration-[350ms] hover:bg-[var(--primary)]"
          >
            Acender Tocha
          </Button>
        ) : (
          <Button
            onClick={extinguishTorch}
            variant="outline"
            className="text-muted-foreground w-full border-[var(--border)] bg-[var(--card)] text-[9.5px] tracking-[0.14em] transition-all duration-[350ms]"
          >
            Apagar Tocha
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
