'use client'

import type { Encounter, EncounterActor } from '@/types/encounter.types'
import type { Seat } from '@/lib/gmActions'
import { DANGER_LEVELS, type DangerLevel } from '@/lib/crawl'
import { mortalState } from '@/lib/dying'
import { initials } from './Figure'
import { cn } from '@/lib/utils'

/** A chave que a tela usa para dizer de quem se está falando. */
export const pcKey = (characterId: string) => `pc:${characterId}`
export const npcKey = (actorId: string) => `npc:${actorId}`

export function actorKey(actor: EncounterActor): string {
  return actor.source === 'pc' && actor.refId ? pcKey(actor.refId) : npcKey(actor.id)
}

/**
 * A faixa de cima no combate: a rodada em letras de pedra, a ordem de turnos
 * em fichas redondas (osso para o grupo, sangue para os inimigos, ouro para
 * quem age) e o botão que passa a vez. Clicar numa ficha abre os comandos
 * daquele combatente — ou o escolhe como alvo, se um golpe está no ar.
 */
export function CombatRibbon({
  encounter, order, seatOf, focusKey, onSelect, onAdvance, busy,
}: {
  encounter: Encounter
  order: EncounterActor[]
  seatOf: (actor: EncounterActor) => Seat | undefined
  focusKey: string | null
  onSelect: (key: string) => void
  onAdvance: () => void
  busy?: boolean
}) {
  const started = encounter.activeActorId !== null

  return (
    <div className="dd-frame flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex shrink-0 flex-col items-start gap-0.5">
        <span className="dd-title text-[16px]">Rodada {encounter.round}</span>
        <span className="dd-plate__sub max-w-[220px] truncate">{encounter.name}</span>
      </div>

      <ol aria-label="Ordem de turnos" className="m-0 flex min-w-0 flex-1 list-none items-center gap-2 overflow-x-auto p-0 py-1">
        {order.length === 0 && (
          <li className="dd-plate__sub">Ninguém na trilha ainda.</li>
        )}
        {order.map((actor, index) => {
          const seat = seatOf(actor)
          const key = actorKey(actor)
          const out = seat ? mortalState(seat.character.conditions) === 'dead' : actor.defeated
          return (
            <li key={actor.id} className="flex shrink-0 items-center gap-2">
              {index > 0 && <span aria-hidden className="text-[10px] text-[var(--dd-gold-dim)]">›</span>}
              <button
                type="button"
                onClick={() => onSelect(key)}
                title={`${actor.name} · iniciativa ${actor.initiative ?? '—'}`}
                aria-label={`${actor.name}, iniciativa ${actor.initiative ?? 'não rolada'}`}
                className={cn(
                  'dd-token',
                  actor.source === 'npc' && 'dd-token--foe',
                  actor.id === encounter.activeActorId && 'is-active',
                  focusKey === key && 'is-focused',
                  out && 'is-out',
                )}
              >
                {initials(actor.name)}
              </button>
            </li>
          )
        })}
      </ol>

      <button
        type="button"
        onClick={onAdvance}
        disabled={busy || order.length === 0}
        title="Passar a vez (atalho: N)"
        className="dd-btn dd-btn--gold shrink-0"
      >
        {started ? '▸ Próximo turno' : '▶ Começar'}
      </button>
    </div>
  )
}

/**
 * Fora do combate a mesa também anda em turnos: as rodadas de exploração.
 * O perigo dita de quantas em quantas rodadas a masmorra responde.
 */
export function ExplorationRibbon({
  round, danger, roundsToCheck, onNextRound, onSetDanger, onReset,
}: {
  round: number
  danger: DangerLevel
  roundsToCheck: number
  onNextRound: () => void
  onSetDanger: (danger: DangerLevel) => void
  onReset: () => void
}) {
  const level = DANGER_LEVELS.find(d => d.id === danger) ?? DANGER_LEVELS[0]
  const justChecked = round > 0 && roundsToCheck === level.every

  return (
    <div className="dd-frame flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
      <div className="flex shrink-0 flex-col items-start gap-0.5">
        <span className="dd-title text-[16px]">Exploração · rodada {round}</span>
        <span className="dd-plate__sub">
          {justChecked ? 'A masmorra acabou de responder.' : `A masmorra responde em ${roundsToCheck} rodada${roundsToCheck === 1 ? '' : 's'}.`}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2" role="group" aria-label="Nível de perigo">
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
        title={`Passar uma rodada de exploração. ${level.label}: a checagem rola sozinha a cada ${level.every} (atalho: N)`}
        className="dd-btn dd-btn--gold shrink-0"
      >
        ▸ Rodada
      </button>
    </div>
  )
}
