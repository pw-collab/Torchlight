'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon, RepeatIcon, StopIcon } from '@hugeicons/core-free-icons'
import type { Encounter, EncounterActor } from '@/types/encounter.types'
import type { NextStep } from '@/hooks/useEncounterControls'
import { DANGER_LEVELS, type DangerLevel } from '@/lib/crawl'
import { actorKey, type CombatTurn, type Side } from '@/lib/turns'
import { Button } from '@/components/ui/button'
import { initials } from './Figure'
import { PRESSED } from './ui'
import { cn } from '@/lib/utils'

const SIDE_LABEL: Record<Side, string> = { pc: 'Grupo', npc: 'Inimigos' }

/** O botão grande do quadro: o vermelho cheio, a ação que o momento pede. */
const NEXT_BUTTON = 'h-11 shrink-0 gap-2 px-4 text-[11px] tracking-[0.12em] max-sm:ml-auto max-sm:h-9 max-sm:px-3 max-sm:text-[10px]'

/** O título do quadro: a rodada, e o que está acontecendo nela. */
function Heading({ title, status }: { title: React.ReactNode; status: string }) {
  return (
    <div className="flex min-w-0 shrink-0 flex-col gap-0.5">
      <span className="font-heading text-[17px] leading-none tracking-[0.1em] text-[var(--foreground)] uppercase">
        {title}
      </span>
      <span role="status" className="font-body max-w-[280px] truncate text-[12px] text-[var(--muted-foreground)] italic max-sm:sr-only">
        {status}
      </span>
    </div>
  )
}

/**
 * O quadro de iniciativa do combate: a rodada, os dois d6 e, ao lado de cada
 * um, as fichas do lado que ele ordena (cinza para o grupo, sangue para os
 * inimigos, vermelho cheio para quem age, apagadas para quem já agiu).
 * Clicar numa ficha abre os comandos daquele combatente — ou o escolhe como
 * alvo, se um golpe está no ar.
 *
 * O botão faz o que o momento pede (ver `NextStep`): rolar o d6 que falta,
 * encerrar a vez de quem age, pôr o próximo inimigo para agir. Na vez do
 * grupo ele descansa: quem assume são os jogadores, na ficha.
 */
export function CombatRibbon({
  encounter, order, turn, actingName, next, notice, focusKey, onSelect, busy,
}: {
  encounter: Encounter
  order: EncounterActor[]
  turn: CombatTurn
  actingName: string | null
  next: NextStep | null
  notice: string | null
  focusKey: string | null
  onSelect: (key: string) => void
  busy?: boolean
}) {
  const rolling = turn.stage === 'initiative'
  const sides: Side[] = rolling ? ['pc', 'npc'] : turn.order
  const status = rolling
    ? 'Um d6 por lado; empate, o grupo começa.'
    : actingName
      ? `${actingName} está agindo`
      : turn.side
        ? `Vez ${turn.side === 'pc' ? 'do grupo' : 'dos inimigos'}`
        : encounter.name

  return (
    <div className="gm-turns" data-live={!rolling && Boolean(actingName)}>
      <Heading title={rolling ? 'Iniciativa' : `Rodada ${turn.round}`} status={notice ?? status} />

      <ol
        aria-label="Ordem dos lados"
        className="m-0 flex min-w-0 flex-[1_1_18rem] list-none flex-wrap items-center gap-x-4 gap-y-2 p-0 max-sm:order-last max-sm:basis-full max-sm:flex-nowrap max-sm:overflow-x-auto"
      >
        {order.length === 0 && <li className="gm-void">Ninguém na trilha ainda.</li>}
        {sides.map((side, index) => {
          const members = order.filter(a => a.source === side)
          if (members.length === 0) return null
          const die = side === 'pc' ? encounter.pcInitiative : encounter.npcInitiative
          const current = !rolling && turn.side === side
          return (
            <li key={side} className="flex min-w-0 shrink-0 items-center gap-2">
              {index > 0 && <span aria-hidden className="font-heading text-[14px] text-[var(--muted-foreground)]">›</span>}
              <span
                title={die == null ? `${SIDE_LABEL[side]}: d6 ainda não rolado` : `${SIDE_LABEL[side]}: d6 ${die}`}
                className={cn('gm-side-die', current && 'is-current')}
              >
                {SIDE_LABEL[side]} <b>{die ?? '—'}</b>
              </span>
              <ol aria-label={SIDE_LABEL[side]} className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0 max-sm:flex-nowrap">
                {members.map(actor => {
                  const key = actorKey(actor)
                  const acting = !rolling && turn.actingKey === key
                  const done = !rolling && turn.acted.has(key)
                  return (
                    <li key={actor.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(key)}
                        title={`${actor.name}${acting ? ' · agindo' : done ? ' · já agiu' : ''}`}
                        aria-label={`${actor.name}${acting ? ', agindo' : done ? ', já agiu' : ''}`}
                        aria-pressed={focusKey === key}
                        className={cn(
                          'gm-token',
                          actor.source === 'npc' && 'gm-token--foe',
                          acting && 'is-active',
                          done && 'is-done',
                          focusKey === key && 'is-focused',
                          actor.defeated && 'is-out',
                        )}
                      >
                        {initials(actor.name)}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </li>
          )
        })}
      </ol>

      {next && (
        <Button
          type="button"
          onClick={() => void next.run()}
          disabled={busy || next.idle}
          title={`${next.hint}${next.idle ? '' : ' (atalho: N)'}`}
          className={NEXT_BUTTON}
        >
          <HugeiconsIcon icon={next.icon} size={16} strokeWidth={2} aria-hidden />
          {next.label}
        </Button>
      )}
    </div>
  )
}

/**
 * Fora do combate a mesa também anda em turnos: as rodadas de exploração.
 * Cada um do grupo assume a vez na ficha e a encerra; o Mestre vira a rodada
 * quando quiser, e o perigo dita de quantas em quantas a masmorra responde.
 */
export function ExplorationRibbon({
  round, danger, roundsToCheck, actingName, acted, standing, onNextRound, onEndActing, onSetDanger, onReset,
}: {
  round: number
  danger: DangerLevel
  roundsToCheck: number
  /** Quem está agindo agora. */
  actingName: string | null
  /** Quantos do grupo já agiram nesta rodada, de quantos que podem. */
  acted: number
  standing: number
  onNextRound: () => void
  onEndActing: () => void
  onSetDanger: (danger: DangerLevel) => void
  onReset: () => void
}) {
  const level = DANGER_LEVELS.find(d => d.id === danger) ?? DANGER_LEVELS[0]
  const justChecked = round > 0 && roundsToCheck === level.every
  const everyone = standing > 0 && acted >= standing

  return (
    <div className="gm-turns" data-live={Boolean(actingName)}>
      <Heading
        title={<><span className="max-sm:hidden">Exploração · </span>Rodada {round}</>}
        status={justChecked ? 'A masmorra acabou de responder.' : `A masmorra responde em ${roundsToCheck} rodada${roundsToCheck === 1 ? '' : 's'}.`}
      />

      <div className="flex min-w-0 shrink-0 items-center gap-2 max-sm:order-last">
        <span className={cn('gm-side-die', (actingName || everyone) && 'is-current')}>
          {actingName ? <>Age <b className="max-w-[16ch] truncate text-[13px]">{actingName}</b></> : everyone ? 'Todos agiram' : <>Agiram <b>{acted}/{standing}</b></>}
        </span>
        {actingName && (
          <Button type="button" variant="outline" onClick={onEndActing} title={`Encerrar a vez de ${actingName}`} className="h-9 gap-1.5 px-3 text-[10px] tracking-[0.12em]">
            <HugeiconsIcon icon={StopIcon} size={14} strokeWidth={2} aria-hidden />
            Encerrar
          </Button>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_16rem] flex-wrap items-center gap-1.5 max-sm:order-last" role="group" aria-label="Nível de perigo">
        <span className="font-heading mr-1 text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">Perigo</span>
        {/* Uma escolha só: os três unidos, como um seletor. */}
        <span className="flex">
          {DANGER_LEVELS.map(d => (
            <Button
              key={d.id}
              type="button"
              variant="outline"
              aria-pressed={danger === d.id}
              onClick={() => onSetDanger(d.id)}
              title={`Checagem de encontro a cada ${d.every} rodada${d.every === 1 ? '' : 's'}`}
              className={cn(
                'relative -ml-px h-9 px-2.5 text-[10px] tracking-[0.08em] first:ml-0',
                danger === d.id && cn(PRESSED, 'z-10'),
              )}
            >
              {d.label}
            </Button>
          ))}
        </span>
        {round > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onReset}
            title="Zerar a contagem: uma área nova, um descanso"
            aria-label="Zerar a contagem de rodadas"
            className="size-9"
          >
            <HugeiconsIcon icon={RepeatIcon} size={16} strokeWidth={1.75} />
          </Button>
        )}
      </div>

      <Button
        type="button"
        onClick={onNextRound}
        title={`Passar uma rodada de exploração: a vez fica livre para todos de novo. ${level.label}: a checagem rola sozinha a cada ${level.every} (atalho: N)`}
        className={NEXT_BUTTON}
      >
        <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={2} aria-hidden />
        Próxima rodada
      </Button>
    </div>
  )
}
