'use client'

import type { Encounter, EncounterActor } from '@/types/encounter.types'
import type { NextStep } from '@/hooks/useEncounterControls'
import { DANGER_LEVELS, type DangerLevel } from '@/lib/crawl'
import { actorKey, type CombatTurn, type Side } from '@/lib/turns'
import { initials } from './Figure'
import { cn } from '@/lib/utils'

const SIDE_LABEL: Record<Side, string> = { pc: 'Grupo', npc: 'Inimigos' }

/**
 * A faixa de cima no combate: a rodada em letras de pedra, os dois d6 e, ao
 * lado de cada um, as fichas redondas do lado que ele ordena (osso para o
 * grupo, sangue para os inimigos, ouro para quem age, apagadas para quem já
 * agiu). Clicar numa ficha abre os comandos daquele combatente — ou o escolhe
 * como alvo, se um golpe está no ar.
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
    <div className="dd-frame flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex shrink-0 flex-col items-start gap-0.5">
        <span className="dd-title text-[16px]">{rolling ? 'Iniciativa' : `Rodada ${turn.round}`}</span>
        <span role="status" className="dd-plate__sub max-w-[260px] truncate" title={encounter.name}>
          {notice ?? status}
        </span>
      </div>

      <ol aria-label="Ordem dos lados" className="m-0 flex min-w-0 flex-[1_1_16rem] list-none items-center gap-3 overflow-x-auto p-0 py-1">
        {order.length === 0 && <li className="dd-plate__sub">Ninguém na trilha ainda.</li>}
        {sides.map((side, index) => {
          const members = order.filter(a => a.source === side)
          if (members.length === 0) return null
          const die = side === 'pc' ? encounter.pcInitiative : encounter.npcInitiative
          const current = !rolling && turn.side === side
          return (
            <li key={side} className="flex shrink-0 items-center gap-2">
              {index > 0 && <span aria-hidden className="text-[10px] text-[var(--dd-gold-dim)]">›</span>}
              <span
                title={die == null ? `${SIDE_LABEL[side]}: d6 ainda não rolado` : `${SIDE_LABEL[side]}: d6 ${die}`}
                className={cn('dd-side-die', side === 'npc' && 'dd-side-die--foe', current && 'is-current')}
              >
                {SIDE_LABEL[side]} <b>{die ?? '—'}</b>
              </span>
              <ol aria-label={SIDE_LABEL[side]} className="m-0 flex list-none items-center gap-1.5 p-0">
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
                        className={cn(
                          'dd-token',
                          actor.source === 'npc' && 'dd-token--foe',
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
        <button
          type="button"
          onClick={() => void next.run()}
          disabled={busy || next.idle}
          title={`${next.hint}${next.idle ? '' : ' (atalho: N)'}`}
          className="dd-btn dd-btn--gold shrink-0"
        >
          {next.icon} {next.label}
        </button>
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
    <div className="dd-frame flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex shrink-0 flex-col items-start gap-0.5">
        <span className="dd-title text-[16px]">Exploração · rodada {round}</span>
        <span className="dd-plate__sub">
          {justChecked ? 'A masmorra acabou de responder.' : `A masmorra responde em ${roundsToCheck} rodada${roundsToCheck === 1 ? '' : 's'}.`}
        </span>
      </div>

      <div role="status" className="flex shrink-0 items-center gap-2">
        <span className={cn('dd-side-die', (actingName || everyone) && 'is-current')}>
          {actingName ? <>Age: <b>{actingName}</b></> : everyone ? 'Todos agiram' : <>Agiram <b>{acted}/{standing}</b></>}
        </span>
        {actingName && (
          <button type="button" onClick={onEndActing} title={`Encerrar a vez de ${actingName}`} className="dd-btn dd-btn--sm">
            ■ Encerrar
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-[1_1_16rem] flex-wrap items-center gap-2" role="group" aria-label="Nível de perigo">
        <span className="font-heading text-[9px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">Perigo</span>
        {DANGER_LEVELS.map(d => (
          <button
            key={d.id}
            type="button"
            aria-pressed={danger === d.id}
            onClick={() => onSetDanger(d.id)}
            title={`Checagem de encontro a cada ${d.every} rodada${d.every === 1 ? '' : 's'}`}
            className={cn('dd-btn dd-btn--sm', danger === d.id && 'dd-btn--blood')}
          >
            {d.label}
          </button>
        ))}
        {round > 0 && (
          <button type="button" onClick={onReset} title="Zerar a contagem: uma área nova, um descanso" className="dd-btn dd-btn--sm">
            ↺
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onNextRound}
        title={`Passar uma rodada de exploração: a vez fica livre para todos de novo. ${level.label}: a checagem rola sozinha a cada ${level.every} (atalho: N)`}
        className="dd-btn dd-btn--gold shrink-0"
      >
        ▸ Rodada
      </button>
    </div>
  )
}
