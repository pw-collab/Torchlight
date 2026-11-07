'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { OlympicTorchIcon } from '@hugeicons/core-free-icons'
import type { InventoryItem } from '@/types/inventory.types'
import { useTableNow } from '@/hooks/useTableNow'
import { brightest, fullMinutes, secondsLeft, spareSource } from '@/lib/light'
import type { TableClock } from '@/lib/dungeonClock'
import { cn } from '@/lib/utils'

interface Props {
  inventory: InventoryItem[]
  /**
   * O relógio da mesa, quando o personagem está numa. A luz é lida contra ele,
   * não contra o relógio de parede cru: é isso que faz a pausa do Mestre
   * congelar a tocha (ver `lib/dungeonClock`).
   */
  clock?: TableClock | null
  /** Jumps to the inventory tab, where the light can be lit or put out. */
  onClick?: () => void
  /**
   * `bar` lays the torch, the segments and the clock out in a row (the old
   * header lane). `counter` stacks them in a 64px column, the torch on a
   * square key (Figma 353:3490): the first column of the character card,
   * where the tab rail used to be.
   */
  variant?: 'bar' | 'counter'
}

const KIND_LABEL: Record<string, string> = {
  torch: 'Tocha',
  candle: 'Vela',
  lantern: 'Lampião',
}

/** The bar is cut in four: a torch's hour, fifteen minutes to the segment. */
const SEGMENTS = 4

/** Under ten minutes the light turns red — time to reach for the next one. */
const LOW_SECONDS = 10 * 60

/** `59:25` — the countdown the way the table reads it out. */
function countdown(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Light status: the torch, a bar cut into four segments that drain as it
 * burns, and the time left to the second. The character sheet stacks it at
 * the head of its card (`counter`); the Mestre's table HUD lays it in a row.
 *
 * It holds its place whether or not anything is burning — the point is being
 * able to tell at a glance, and a status that only exists while lit can't say
 * "you are in the dark". Unlit, the segments empty out and the clock reads
 * `--:--`; under ten minutes everything turns red.
 */
export function TorchStatus({ inventory, onClick, clock, variant = 'bar' }: Props) {
  // Os segundos saem do relógio da mesa (ver `lib/light` e `lib/dungeonClock`);
  // o valor que tiquetaqueia só existe para o render acontecer de novo.
  const now = useTableNow(clock, 1000)

  const source = brightest(inventory, now)
  const seconds = source ? secondsLeft(source, now) : 0
  const fraction = source ? Math.min(1, seconds / (fullMinutes(source) * 60)) : 0
  const isLow = source !== null && seconds <= LOW_SECONDS

  // Nothing burning: name whatever is carried and ready, so the tooltip says
  // what could be lit rather than just that it is dark.
  const spare = source ? null : spareSource(inventory, now)
  const kind = KIND_LABEL[(source ?? spare)?.lightKind ?? 'torch']
  const minutes = Math.ceil(seconds / 60)

  const accent = isLow ? 'var(--destructive)' : 'var(--torch)'

  const title = source
    ? `${kind} acesa — ${minutes} min restantes`
    : spare
      ? `${kind} apagada — abrir o inventário para acender`
      : 'Nenhuma fonte de luz na mochila'
  const label = source
    ? `Fonte de luz acesa: ${source.name}, ${minutes} minutos restantes`
    : 'Nenhuma fonte de luz acesa'

  // Four segments, draining right to left as the source burns.
  const segments = (height: number) => (
    <span aria-hidden className="flex w-full min-w-0 flex-1 items-center gap-[2px]">
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const fill = Math.min(1, Math.max(0, fraction * SEGMENTS - i))
        return (
          <span key={i} className="bg-input relative min-w-0 flex-1 overflow-hidden" style={{ height }}>
            <span
              className="absolute inset-y-0 left-0 transition-[width] duration-1000 ease-linear"
              style={{ width: `${fill * 100}%`, background: accent }}
            />
          </span>
        )
      })}
    </span>
  )

  const clockText = (
    <span
      className={cn(
        'shrink-0 text-center leading-[14px] whitespace-nowrap',
        variant === 'counter' ? 'type-clock' : 'font-mono text-sm font-bold tracking-[1.12px]',
      )}
      style={{ color: isLow ? 'var(--destructive)' : 'var(--muted-foreground)' }}
    >
      {source ? countdown(seconds) : '--:--'}
    </span>
  )

  if (variant === 'counter') {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={label}
        className={cn(
          'group flex w-16 flex-col items-center gap-1 outline-none',
          onClick ? 'cursor-pointer' : 'cursor-default',
        )}
      >
        <span
          className={cn(
            'tactile flex size-16 items-center justify-center border-2 border-[var(--border-frame)] bg-muted p-2',
            'transition-colors duration-150 group-hover:border-[var(--border-control)]',
            'group-focus-visible:ring-ring/50 group-focus-visible:ring-[3px]',
          )}
        >
          <HugeiconsIcon
            icon={OlympicTorchIcon}
            size={48}
            strokeWidth={1.5}
            aria-hidden
            className={cn('shrink-0', isLow && 'animate-flicker', !source && 'opacity-40')}
            style={{ color: source ? accent : 'var(--muted-foreground)' }}
          />
        </span>
        {segments(6)}
        {clockText}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={label}
      className={cn(
        'flex min-h-14 w-[250px] max-w-full items-center gap-1 overflow-hidden outline-none',
        'focus-visible:ring-ring/50 transition-opacity focus-visible:ring-[3px]',
        onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
      )}
    >
      <HugeiconsIcon
        icon={OlympicTorchIcon}
        size={24}
        aria-hidden
        className={cn('shrink-0', isLow && 'animate-flicker', !source && 'opacity-40')}
        style={{ color: source ? accent : 'var(--muted-foreground)' }}
      />

      {segments(14)}
      {clockText}
    </button>
  )
}
