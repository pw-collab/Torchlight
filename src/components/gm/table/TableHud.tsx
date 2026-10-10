'use client'

import type { TableClock } from '@/lib/dungeonClock'
import { EXPLORATION_TURN_MINUTES } from '@/lib/dungeonClock'
import { Button } from '@/components/ui/button'
import { LABEL, PILL } from './ui'
import { cn } from '@/lib/utils'

/**
 * A barra de cima: o relógio da masmorra e quem está na mesa.
 *
 * Em Shadowdark o tempo é um instrumento do Mestre. A luz de todo mundo é
 * derivada deste relógio (`lib/light`), então pausar, adiantar e apagar tudo
 * mexem na mesa inteira de uma vez.
 */
export function TableHud({
  clock, litCount, present, total, busy, onPauseToggle, onAdvance, onSnuffAll,
}: {
  clock: TableClock
  litCount: number
  present: number
  total: number
  busy?: boolean
  onPauseToggle: () => void
  onAdvance: (minutes: number) => void
  onSnuffAll: () => void
}) {
  const paused = Boolean(clock.pausedAt)
  const drift = Math.round(clock.shiftSeconds / 60)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className={cn('text-[13px] leading-none', !paused && 'animate-flicker')}>
          {paused ? '⏸' : '⏳'}
        </span>
        <span className={LABEL}>{paused ? 'Tempo parado' : 'Relógio correndo'}</span>
        {drift !== 0 && (
          <span className="font-mono text-[8.5px] text-[var(--muted-foreground)]" title="O quanto a mesa correu à frente do relógio de parede">
            {drift > 0 ? `+${drift}` : drift}min
          </span>
        )}
      </span>

      <Button
        type="button"
        variant="outline"
        onClick={onPauseToggle}
        disabled={busy}
        title={paused ? 'Retomar: a tocha volta de onde parou' : 'Pausar o tempo de toda a mesa'}
        className={cn(PILL, paused && 'border-[var(--chart-2)] text-[var(--chart-2)]')}
      >
        {paused ? '▶ Retomar' : '⏸ Pausar'}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => onAdvance(EXPLORATION_TURN_MINUTES)}
        disabled={busy || paused}
        title={paused ? 'Retome o tempo antes de gastar um turno' : `${EXPLORATION_TURN_MINUTES} minutos queimam para todo mundo`}
        className={cn(PILL, 'disabled:opacity-30')}
      >
        +{EXPLORATION_TURN_MINUTES} min
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onSnuffAll}
        disabled={busy || litCount === 0}
        title={litCount === 0 ? 'Ninguém está com luz acesa' : `Apagar a luz de todos (${litCount} acesa${litCount === 1 ? '' : 's'})`}
        className={cn(PILL, 'border-[var(--destructive)] text-[var(--destructive)] disabled:opacity-30')}
      >
        🌑 Escuridão
      </Button>

      <span className={cn(LABEL, 'ml-auto')}>
        {total === 0 ? 'Mesa vazia' : `● ${present} de ${total} presente${present === 1 ? '' : 's'}`}
      </span>
    </div>
  )
}
