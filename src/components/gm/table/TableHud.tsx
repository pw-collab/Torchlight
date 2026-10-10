'use client'

import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Moon02Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import type { Seat } from '@/lib/gmActions'
import { EXPLORATION_TURN_MINUTES, type TableClock } from '@/lib/dungeonClock'
import { brightest } from '@/lib/light'
import { useTableNow } from '@/hooks/useTableNow'
import { TorchStatus } from '@/components/sheet/TorchStatus'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BAR_BUTTON = 'h-9 gap-1.5 px-3 text-[10px] tracking-[0.12em]'

/**
 * A barra de cima: a mesa (nome e o código que o Mestre lê em voz alta), a
 * luz do grupo, o relógio da masmorra e quem está com a ficha aberta.
 *
 * A luz é o mesmo medidor que a ficha leva no topo, lido sobre tudo o que o
 * grupo carrega: a fonte acesa com mais tempo é a luz do grupo. Pausar,
 * adiantar e apagar tudo mexem no relógio da mesa inteira de uma vez (ver
 * `lib/light`).
 */
export function TableHud({
  name, code, seats, clock, present, busy, ending, onPauseToggle, onAdvance, onSnuffAll, onEnd,
}: {
  name: string
  code: string
  seats: Seat[]
  clock: TableClock
  present: number
  busy?: boolean
  ending?: boolean
  onPauseToggle: () => void
  onAdvance: (minutes: number) => void
  onSnuffAll: () => void
  onEnd: () => void
}) {
  const now = useTableNow(clock)
  const [copied, setCopied] = useState(false)
  const carried = seats.flatMap(seat => seat.character.inventory)
  const lit = seats.filter(seat => brightest(seat.character.inventory, now) !== null)

  const paused = Boolean(clock.pausedAt)
  const drift = Math.round(clock.shiftSeconds / 60)

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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-[var(--border)] bg-[var(--card)] py-1 pr-2 pl-4 xl:gap-x-6">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="size-1.5 shrink-0 rounded-full bg-[var(--chart-2)] shadow-[0_0_6px_var(--chart-2)]"
        />
        <h2 className="font-heading min-w-0 truncate text-[17px] leading-tight text-[var(--foreground)]">{name}</h2>
        {/* O código é a porta da mesa: é ele que o Mestre lê em voz alta, e
            cada jogador digita na própria ficha. */}
        <Button
          type="button"
          variant="outline"
          onClick={() => void copyCode()}
          title="Copiar o código da sessão"
          className="h-9 shrink-0 gap-2 px-2.5"
        >
          <span className="text-[10px] tracking-[0.14em] text-[var(--muted-foreground)]">
            {copied ? 'Copiado' : 'Código'}
          </span>
          <span className="font-mono text-[15px] tracking-[0.24em] text-[var(--foreground)] normal-case">{code}</span>
          <HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={1.75} aria-hidden className="text-[var(--muted-foreground)]" />
        </Button>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
        {/* O medidor da ficha encolhe com a barra; inteiro, ele tem 250px. */}
        <div className="w-[190px] xl:w-[250px]">
          <TorchStatus inventory={carried} clock={clock} />
        </div>
        {lit.length > 0 && (
          <span className="font-body hidden text-[12px] text-[var(--muted-foreground)] italic 2xl:inline">
            {lit.length > 1 ? `${lit.length} fontes acesas` : `a luz de ${lit[0].character.name}`}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Correndo é o normal e o botão já diz; a barra só fala quando o
            relógio foge disso — parado, ou adiantado à mão. */}
        {(paused || drift !== 0) && (
          <span className="font-heading text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
            {paused ? 'Tempo parado' : 'Relógio'}
            {drift !== 0 && <span className="ml-1 font-mono tracking-normal normal-case">({drift > 0 ? `+${drift}` : drift} min)</span>}
          </span>
        )}
        <Button
          type="button"
          variant={paused ? 'default' : 'outline'}
          onClick={onPauseToggle}
          disabled={busy}
          title={paused ? 'Retomar: a tocha volta de onde parou' : 'Pausar o tempo de toda a mesa'}
          className={BAR_BUTTON}
        >
          <HugeiconsIcon icon={paused ? PlayIcon : PauseIcon} size={14} strokeWidth={2} aria-hidden />
          {paused ? 'Retomar' : 'Pausar'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onAdvance(EXPLORATION_TURN_MINUTES)}
          disabled={busy || paused}
          title={paused ? 'Retome o tempo antes de gastar um turno' : `${EXPLORATION_TURN_MINUTES} minutos queimam para todo mundo`}
          className={BAR_BUTTON}
        >
          +{EXPLORATION_TURN_MINUTES} min
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSnuffAll}
          disabled={busy || lit.length === 0}
          title={lit.length === 0 ? 'Ninguém está com luz acesa' : 'Apagar a luz de todos'}
          className={BAR_BUTTON}
        >
          <HugeiconsIcon icon={Moon02Icon} size={14} strokeWidth={1.75} aria-hidden />
          Escuridão
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className={cn('font-heading text-[10px] tracking-[0.14em] uppercase', present > 0 ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]')}>
          {seats.length === 0 ? 'Mesa vazia' : `${present}/${seats.length} na mesa`}
        </span>
        <Button
          type="button"
          variant="destructive"
          onClick={onEnd}
          disabled={ending}
          className={BAR_BUTTON}
        >
          {ending ? 'Encerrando…' : 'Encerrar'}
        </Button>
      </div>
    </div>
  )
}
