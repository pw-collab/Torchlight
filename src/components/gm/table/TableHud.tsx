'use client'

import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Moon02Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import type { Seat } from '@/lib/gmActions'
import { EXPLORATION_TURN_MINUTES, type TableClock } from '@/lib/dungeonClock'
import { brightest } from '@/lib/light'
import { useTableNow } from '@/hooks/useTableNow'
import { TorchStatus } from '@/components/sheet/TorchStatus'
import { Button } from '@/components/ui/button'
import { initials } from './Figure'
import { cn } from '@/lib/utils'

/**
 * A mesa, na barra do topo: o nome, o código que o Mestre lê em voz alta e o
 * Encerrar. `children` é onde entra quem está na mesa — a presença só existe
 * enquanto a mesa está aberta na tela (ver `Presence`).
 */
export function SessionBadge({
  name, code, ending, onEnd, children,
}: {
  name: string
  code: string
  ending?: boolean
  onEnd: () => void
  children?: ReactNode
}) {
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Sem permissão de área de transferência o código continua na tela.
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2 lg:gap-3">
      <span className="font-mono font-semibold hidden max-w-[18ch] truncate text-[15px] text-[var(--foreground)] xl:inline">
        {name}
      </span>
      {/* O código é a porta da mesa: é ele que o Mestre lê em voz alta, e
          cada jogador digita na própria ficha. */}
      <Button
        type="button"
        variant="outline"
        onClick={() => void copyCode()}
        title={`Copiar o código da sessão "${name}"`}
        className="h-9 shrink-0 gap-2 px-2.5"
      >
        <span className="hidden text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] sm:inline">
          {copied ? 'Copiado' : 'Código'}
        </span>
        <span className="font-mono text-[14px] tracking-[0.22em] text-[var(--foreground)] normal-case">{code}</span>
        <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={1.75} aria-hidden className="hidden text-[var(--muted-foreground)] sm:block" />
      </Button>
      {children}
      <Button
        type="button"
        variant="destructive"
        onClick={onEnd}
        disabled={ending}
        className="h-9 shrink-0 px-2.5 text-[10px] tracking-[0.12em] sm:px-3"
      >
        {ending ? 'Encerrando…' : 'Encerrar'}
      </Button>
    </div>
  )
}

/**
 * Quem está na mesa agora: uma ficha por personagem, acesa enquanto a ficha
 * dele está aberta. Onde a barra do topo aperta, fica só a contagem.
 */
export function Presence({ seats, present }: { seats: Seat[]; present: ReadonlySet<string> }) {
  const here = seats.filter(seat => present.has(seat.character.id)).length
  return (
    <div
      role="group"
      aria-label={`${here} de ${seats.length} jogadores com a ficha aberta`}
      className="flex h-9 shrink-0 items-center gap-1 border-[var(--border)] sm:border sm:px-2"
    >
      {seats.slice(0, 6).map(seat => {
        const on = present.has(seat.character.id)
        return (
          <span
            key={seat.character.id}
            title={`${seat.character.name}${seat.playerName ? ` (${seat.playerName})` : ''}: ${on ? 'na mesa' : 'fora'}`}
            className={cn(
              'font-mono font-semibold hidden size-6 place-items-center text-[9px] xl:grid',
              on
                ? 'border border-[var(--chart-2)] bg-[var(--input)] text-[var(--foreground)]'
                : 'border border-dashed border-[var(--input-border)] text-[var(--muted-foreground)] opacity-50',
            )}
          >
            {initials(seat.character.name)}
          </span>
        )
      })}
      <span className="font-mono font-semibold ml-1 text-[10px] tracking-[0.12em] whitespace-nowrap text-[var(--foreground)] uppercase">
        {seats.length === 0 ? 'Mesa vazia' : <>{here}/{seats.length}<span className="hidden 2xl:inline"> na mesa</span></>}
      </span>
    </div>
  )
}

const TOOL = 'size-9 shrink-0 px-0'

/**
 * A luz do grupo e o relógio da masmorra, na linha de rodada.
 *
 * A luz é o mesmo medidor que a ficha leva no topo, lido sobre tudo o que o
 * grupo carrega: a fonte acesa com mais tempo é a luz do grupo. Pausar,
 * adiantar e apagar tudo mexem no relógio da mesa inteira de uma vez (ver
 * `lib/light`).
 */
export function TableTools({
  seats, clock, busy, onPauseToggle, onAdvance, onSnuffAll,
}: {
  seats: Seat[]
  clock: TableClock
  busy?: boolean
  onPauseToggle: () => void
  onAdvance: (minutes: number) => void
  onSnuffAll: () => void
}) {
  const now = useTableNow(clock)
  const carried = seats.flatMap(seat => seat.character.inventory)
  const lit = seats.filter(seat => brightest(seat.character.inventory, now) !== null)
  const paused = Boolean(clock.pausedAt)
  const drift = Math.round(clock.shiftSeconds / 60)

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {/* O medidor da ficha encolhe com a linha; inteiro, ele tem 250px. */}
      <div
        className="gm-torch w-[150px] 2xl:w-[200px]"
        title={lit.length > 1 ? `${lit.length} fontes acesas` : lit[0] ? `A luz de ${lit[0].character.name}` : undefined}
      >
        <TorchStatus inventory={carried} clock={clock} />
      </div>
      {(paused || drift !== 0) && (
        <span className="font-mono font-semibold text-[10px] tracking-[0.12em] whitespace-nowrap text-[var(--muted-foreground)] uppercase">
          {paused ? 'Parado' : `${drift > 0 ? '+' : ''}${drift} min`}
        </span>
      )}
      <Button
        type="button"
        variant={paused ? 'default' : 'outline'}
        onClick={onPauseToggle}
        disabled={busy}
        title={paused ? 'Retomar: a tocha volta de onde parou' : 'Pausar o tempo de toda a mesa'}
        aria-label={paused ? 'Retomar o tempo' : 'Pausar o tempo'}
        className={TOOL}
      >
        <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={15} strokeWidth={2} />
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => onAdvance(EXPLORATION_TURN_MINUTES)}
        disabled={busy || paused}
        title={paused ? 'Retome o tempo antes de gastar um turno' : `${EXPLORATION_TURN_MINUTES} minutos queimam para todo mundo`}
        className="h-9 shrink-0 px-2 text-[10px] tracking-[0.06em]"
      >
        +{EXPLORATION_TURN_MINUTES}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onSnuffAll}
        disabled={busy || lit.length === 0}
        title={lit.length === 0 ? 'Ninguém está com luz acesa' : 'Escuridão: apagar a luz de todos'}
        aria-label="Escuridão: apagar a luz de todos"
        className={TOOL}
      >
        <HugeiconsIcon icon={Moon02Icon} size={15} strokeWidth={1.75} />
      </Button>
    </div>
  )
}
