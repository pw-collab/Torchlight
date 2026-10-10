'use client'

import type { Seat } from '@/lib/gmActions'
import { EXPLORATION_TURN_MINUTES, type TableClock } from '@/lib/dungeonClock'
import { brightest, fullMinutes, minutesLeft } from '@/lib/light'
import { useTableNow } from '@/hooks/useTableNow'
import { cn } from '@/lib/utils'

/**
 * A barra de cima: a chama do grupo, o relógio da masmorra e quem está na
 * mesa.
 *
 * A chama é a luz mais forte que o grupo carrega agora — em Shadowdark é ela
 * que separa a exploração do pânico, então fica no alto, à vista, como o
 * medidor de tocha dos RPGs de masmorra. Pausar, adiantar e apagar tudo mexem
 * no relógio da mesa inteira de uma vez (ver `lib/light`).
 */
export function TableHud({
  seats, clock, present, busy, onPauseToggle, onAdvance, onSnuffAll,
}: {
  seats: Seat[]
  clock: TableClock
  present: number
  busy?: boolean
  onPauseToggle: () => void
  onAdvance: (minutes: number) => void
  onSnuffAll: () => void
}) {
  const now = useTableNow(clock)
  const lights = seats
    .map(seat => ({ seat, light: brightest(seat.character.inventory, now) }))
    .filter(entry => entry.light !== null)
  const best = lights.reduce<{ minutes: number; max: number; who: string } | null>((top, { seat, light }) => {
    const minutes = minutesLeft(light!, now)
    return !top || minutes > top.minutes
      ? { minutes, max: fullMinutes(light!), who: seat.character.name }
      : top
  }, null)

  const paused = Boolean(clock.pausedAt)
  const drift = Math.round(clock.shiftSeconds / 60)
  const pct = best ? Math.max(0, Math.min(100, (best.minutes / Math.max(1, best.max)) * 100)) : 0
  const low = best !== null && best.minutes <= 10

  return (
    <div className="dd-frame flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className={cn('dd-flame', !best && 'is-out', low && 'is-low')}>
        <span aria-hidden className="dd-flame__glyph">🔥</span>
        <span className="flex flex-col gap-1">
          <span className="font-heading text-[10px] font-bold tracking-[0.16em] uppercase">
            {best ? `Luz · ${best.minutes} min` : 'Escuridão'}
          </span>
          <span className="dd-flame__bar" role="meter" aria-label="Luz do grupo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
            <span style={{ width: `${pct}%` }} />
          </span>
        </span>
        {best && (
          <span className="dd-plate__sub hidden sm:inline">
            {lights.length > 1 ? `${lights.length} fontes acesas` : `a tocha de ${best.who}`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-[9px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          {paused ? '⏸ Tempo parado' : '⏳ Relógio correndo'}
          {drift !== 0 && <span className="ml-1 font-normal">({drift > 0 ? `+${drift}` : drift} min)</span>}
        </span>
        <button
          type="button"
          onClick={onPauseToggle}
          disabled={busy}
          title={paused ? 'Retomar: a tocha volta de onde parou' : 'Pausar o tempo de toda a mesa'}
          className={cn('dd-btn dd-btn--sm', paused && 'dd-btn--gold')}
        >
          {paused ? '▶ Retomar' : '⏸ Pausar'}
        </button>
        <button
          type="button"
          onClick={() => onAdvance(EXPLORATION_TURN_MINUTES)}
          disabled={busy || paused}
          title={paused ? 'Retome o tempo antes de gastar um turno' : `${EXPLORATION_TURN_MINUTES} minutos queimam para todo mundo`}
          className="dd-btn dd-btn--sm"
        >
          +{EXPLORATION_TURN_MINUTES} min
        </button>
        <button
          type="button"
          onClick={onSnuffAll}
          disabled={busy || lights.length === 0}
          title={lights.length === 0 ? 'Ninguém está com luz acesa' : 'Apagar a luz de todos'}
          className="dd-btn dd-btn--sm dd-btn--blood"
        >
          🌑 Escuridão
        </button>
      </div>

      <span className="font-heading ml-auto text-[9px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
        {seats.length === 0 ? 'Mesa vazia' : `● ${present} de ${seats.length} na mesa`}
      </span>
    </div>
  )
}
