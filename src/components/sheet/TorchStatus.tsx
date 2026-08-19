'use client'

import type { InventoryItem } from '@/types/inventory.types'
import { brightest, fullMinutes, minutesLeft, spareSource } from '@/lib/light'
import { useNow } from '@/hooks/useNow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  inventory: InventoryItem[]
  /** Jumps to the inventory tab, where the light can be lit or put out. */
  onClick?: () => void
}

const KIND_LABEL: Record<string, string> = {
  torch: 'Tocha',
  candle: 'Vela',
  lantern: 'Lampião',
}

/**
 * Light status, holding its slot beside the heading whether or not anything is
 * burning — the point is being able to tell at a glance, and a badge that only
 * exists while lit can't say "you are in the dark".
 *
 * Lit: the flame breathes, the minutes count down, a bar drains under them,
 * and everything turns red under ten minutes. Unlit: the same box, dimmed,
 * naming the source that is ready to light — or saying there is none.
 */
export function TorchStatus({ inventory, onClick }: Props) {
  // The minutes are derived from the wall clock (see `lib/light`); the ticking
  // value is only here to make the render happen again.
  const now = useNow()

  const source = brightest(inventory, now)
  const mins = source ? minutesLeft(source, now) : 0
  const max = source ? fullMinutes(source) : 60
  const isLow = source !== null && mins <= 10

  // Nothing burning: name whatever is carried and ready, so the box says what
  // could be lit rather than just that it is dark.
  const spare = source ? null : spareSource(inventory, now)

  const accent = isLow ? 'var(--destructive)' : source ? 'var(--chart-1)' : 'var(--muted-foreground)'
  const kind = KIND_LABEL[(source ?? spare)?.lightKind ?? 'torch']

  return (
    <Button
      onClick={onClick}
      variant="outline"
      title={
        source
          ? `${kind} acesa — ${mins} min restantes`
          : spare
            ? `${kind} apagada — abrir o inventário para acender`
            : 'Nenhuma fonte de luz na mochila'
      }
      aria-label={
        source
          ? `Fonte de luz acesa: ${source.name}, ${mins} minutos restantes`
          : 'Nenhuma fonte de luz acesa'
      }
      className={cn(
        'relative h-14 min-h-14 w-full min-w-0 justify-start gap-2 overflow-hidden px-2.5 py-0 normal-case',
        'bg-card',
        source
          ? isLow
            ? 'border-[var(--destructive)]'
            : 'border-[var(--primary)]'
          : 'border-border',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
      style={source ? { boxShadow: `0 0 10px ${isLow ? 'var(--destructive)' : 'var(--primary)'}` } : undefined}
    >
      {/* Flame — halo breathes only while something is actually burning */}
      <span aria-hidden className="relative flex size-6 shrink-0 items-center justify-center">
        {source && (
          <span
            className="animate-torch-halo pointer-events-none absolute -inset-1 rounded-full"
            style={{
              background: `radial-gradient(circle, ${isLow ? 'var(--destructive)' : 'var(--primary)'} 0%, transparent 70%)`,
            }}
          />
        )}
        <span
          className={cn('text-[17px] leading-none', source ? 'animate-flame' : 'opacity-30 grayscale')}
          style={source && isLow ? { filter: 'hue-rotate(-18deg) saturate(1.3)' } : undefined}
        >
          🔥
        </span>
      </span>

      <span className="flex min-w-0 flex-col items-start gap-[3px]">
        {/* One column of the grid is ~116px wide, so the state is a single
            word here and the source's name is left to the tooltip — the
            flame already says what kind of thing is burning. */}
        <span
          className="font-heading truncate text-[7.5px] tracking-[0.12em] uppercase"
          style={{ color: isLow ? 'var(--destructive)' : 'var(--muted-foreground)' }}
        >
          {source ? (isLow ? '⚠ Acabando' : 'Acesa') : spare ? 'Apagada' : 'Sem luz'}
        </span>
        <span
          className="font-[var(--font-mono)] text-sm leading-none font-bold"
          style={{ color: accent }}
        >
          {source ? `${mins}min` : '—'}
        </span>
      </span>

      {/* Burn-down bar, pinned to the bottom edge of the box */}
      <span aria-hidden className="bg-border absolute inset-x-0 bottom-0 block h-[2px]">
        <span
          className="block h-full transition-[width] duration-1000 ease-linear"
          style={{
            width: source ? `${Math.min(1, mins / max) * 100}%` : '0%',
            background: accent,
          }}
        />
      </span>
    </Button>
  )
}
