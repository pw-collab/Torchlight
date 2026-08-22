'use client'

import type { TableClock } from '@/lib/dungeonClock'
import { EXPLORATION_TURN_MINUTES } from '@/lib/dungeonClock'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  clock: TableClock
  onPauseToggle: () => void
  onAdvance: (minutes: number) => void
  onSnuffAll: () => void
  /** Quantas fontes estão acesas agora — sem nenhuma, apagar tudo não faz nada. */
  litCount: number
  busy?: boolean
}

const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase'

/**
 * O relógio da masmorra.
 *
 * Em Shadowdark o tempo é um instrumento do Mestre, e até aqui ele não tinha o
 * botão. A luz é derivada do relógio (ver `lib/light`), então tudo o que este
 * painel faz é mexer no relógio da mesa — a tocha de todo mundo se move junto,
 * sem tocar em ficha nenhuma:
 *
 *   pausar        a mesa faz intervalo e a tocha para de queimar junto
 *   +10 min       um turno de exploração que passou de propósito
 *   apagar tudo   a escuridão desce, e essa é uma escrita por ficha
 */
export function DungeonClockBar({ clock, onPauseToggle, onAdvance, onSnuffAll, litCount, busy }: Props) {
  const paused = Boolean(clock.pausedAt)
  // O deslocamento acumulado só interessa como leitura: quanto a mesa correu à
  // frente do relógio de parede desde que a sessão abriu.
  const driftMinutes = Math.round(clock.shiftSeconds / 60)

  return (
    <div
      className="flex flex-wrap items-center gap-2 px-3 py-2"
      style={{
        background: 'var(--card)',
        border: `1px solid ${paused ? 'var(--muted-foreground)' : 'var(--border)'}`,
        borderLeftWidth: 3,
        borderLeftColor: paused ? 'var(--muted-foreground)' : 'var(--chart-1)',
      }}
    >
      <span className="flex items-center gap-1.5">
        <span aria-hidden className={cn('text-[13px] leading-none', !paused && 'animate-flicker')}>
          {paused ? '⏸' : '⏳'}
        </span>
        <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          {paused ? 'Tempo parado' : 'Relógio correndo'}
        </span>
      </span>

      {driftMinutes !== 0 && (
        <span
          className="font-mono text-[8.5px] text-[var(--muted-foreground)]"
          title="O quanto a mesa correu à frente do relógio de parede"
        >
          {driftMinutes > 0 ? `+${driftMinutes}` : driftMinutes}min
        </span>
      )}

      <span className="ml-auto flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={onPauseToggle}
          disabled={busy}
          title={paused ? 'Retomar — a tocha volta de onde parou' : 'Pausar o tempo de toda a mesa'}
          className={cn(PILL, paused && 'border-[var(--chart-2)] text-[var(--chart-2)]')}
        >
          {paused ? '▶ Retomar' : '⏸ Pausar'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => onAdvance(EXPLORATION_TURN_MINUTES)}
          disabled={busy || paused}
          title={
            paused
              ? 'Retome o tempo antes de gastar um turno'
              : `Um turno de exploração: ${EXPLORATION_TURN_MINUTES} minutos queimam para todo mundo`
          }
          className={cn(PILL, 'disabled:opacity-30')}
        >
          +{EXPLORATION_TURN_MINUTES} min
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onSnuffAll}
          disabled={busy || litCount === 0}
          title={
            litCount === 0
              ? 'Ninguém está com luz acesa'
              : `Apagar a luz de todos (${litCount} acesa${litCount === 1 ? '' : 's'})`
          }
          className={cn(PILL, 'border-[var(--destructive)] text-[var(--destructive)] disabled:opacity-30')}
        >
          🌑 Apagar tudo
        </Button>
      </span>
    </div>
  )
}
