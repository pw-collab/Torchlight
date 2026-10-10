'use client'

import type { Encounter, EncounterActor } from '@/types/encounter.types'
import type { Seat } from '@/lib/gmActions'
import { DANGER_LEVELS, type DangerLevel } from '@/lib/crawl'
import { mortalState } from '@/lib/dying'
import { Button } from '@/components/ui/button'
import { HpBar, LABEL } from './ui'
import { cn } from '@/lib/utils'

/** A chave que a tela usa para dizer de quem se está falando. */
export const pcKey = (characterId: string) => `pc:${characterId}`
export const npcKey = (actorId: string) => `npc:${actorId}`

export function actorKey(actor: EncounterActor): string {
  return actor.source === 'pc' && actor.refId ? pcKey(actor.refId) : npcKey(actor.id)
}

const NEXT =
  'font-heading h-11 min-h-11 shrink-0 rounded-[1px] border-[var(--chart-1)] px-4 text-[10px] font-bold tracking-[0.16em] text-[var(--foreground)] uppercase ' +
  'bg-[color-mix(in_oklch,var(--chart-1),transparent_82%)] hover:bg-[color-mix(in_oklch,var(--chart-1),transparent_72%)]'

/**
 * A fila de turnos, como num RPG de turno: quem age, em que ordem, e o botão
 * grande que passa a vez. Clicar num rosto da fila abre os comandos dele.
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
    <div
      className="flex flex-wrap items-center gap-3 px-3 py-2.5"
      style={{
        background: 'var(--card)',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 3,
        borderColor: 'var(--border)',
        borderLeftColor: 'var(--destructive)',
      }}
    >
      <span className="flex shrink-0 flex-col">
        <span className={LABEL}>Combate · rodada {encounter.round}</span>
        <span className="font-heading max-w-[180px] truncate text-[13px] text-[var(--foreground)]">
          ⚔ {encounter.name}
        </span>
      </span>

      <ol
        aria-label="Ordem de turnos"
        className="m-0 flex min-w-0 flex-1 list-none gap-1.5 overflow-x-auto p-0 pb-1"
      >
        {order.length === 0 && (
          <li className="font-body py-2 text-[11px] text-[var(--muted-foreground)] italic">
            Ninguém na trilha ainda.
          </li>
        )}
        {order.map(actor => {
          const seat = seatOf(actor)
          const active = actor.id === encounter.activeActorId
          const key = actorKey(actor)
          const hp = seat ? seat.character.hpCurrent : actor.hpCurrent ?? 0
          const max = seat ? seat.character.hpMax : actor.hpMax ?? hp
          const out = seat ? mortalState(seat.character.conditions) === 'dead' : actor.defeated
          return (
            <li key={actor.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(key)}
                title={`${actor.name} · iniciativa ${actor.initiative ?? '—'}`}
                className={cn(
                  'flex w-[104px] cursor-pointer flex-col gap-1 border px-2 py-1.5 text-left transition-colors',
                  active
                    ? 'border-[var(--chart-1)] bg-[color-mix(in_oklch,var(--chart-1),transparent_85%)]'
                    : focusKey === key
                      ? 'border-[var(--primary)] bg-[var(--input)]'
                      : 'border-[var(--border)] bg-[var(--background)]',
                  out && 'opacity-40',
                )}
              >
                <span className="flex items-center gap-1">
                  <span className="font-mono text-[9px] text-[var(--muted-foreground)]">{actor.initiative ?? '—'}</span>
                  <span
                    className={cn(
                      'font-heading min-w-0 flex-1 truncate text-[10px]',
                      actor.source === 'pc' ? 'text-[var(--foreground)]' : 'text-[var(--destructive)]',
                      out && 'line-through',
                    )}
                  >
                    {active && '▶ '}{actor.name}
                  </span>
                </span>
                <HpBar current={hp} max={max} thin />
              </button>
            </li>
          )
        })}
      </ol>

      <Button
        type="button"
        variant="outline"
        onClick={onAdvance}
        disabled={busy || order.length === 0}
        title="Passar a vez (atalho: N)"
        className={NEXT}
      >
        {started ? '▸ Próximo turno' : '▶ Começar'}
      </Button>
    </div>
  )
}

/**
 * Fora do combate a mesa também anda em turnos: as rodadas de exploração.
 * O perigo dita de quantas em quantas rodadas a masmorra responde.
 */
export function ExplorationRibbon({
  round, danger, roundsToCheck, seats, presentIds, focusKey,
  onSelect, onNextRound, onSetDanger, onReset,
}: {
  round: number
  danger: DangerLevel
  roundsToCheck: number
  seats: Seat[]
  presentIds: ReadonlySet<string>
  focusKey: string | null
  onSelect: (key: string) => void
  onNextRound: () => void
  onSetDanger: (danger: DangerLevel) => void
  onReset: () => void
}) {
  const level = DANGER_LEVELS.find(d => d.id === danger) ?? DANGER_LEVELS[0]
  const justChecked = round > 0 && roundsToCheck === level.every

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-3 py-2.5"
      style={{
        background: 'var(--card)',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 3,
        borderColor: 'var(--border)',
        borderLeftColor: 'var(--muted-foreground)',
      }}
    >
      <span className="flex shrink-0 flex-col gap-1">
        <span className={LABEL}>
          Exploração · rodada {round}
          {round > 0 && (
            <button
              type="button"
              onClick={onReset}
              title="Zerar a contagem: uma área nova, um descanso"
              className="ml-1.5 cursor-pointer text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              ↺
            </button>
          )}
        </span>
        <span className="flex items-center gap-1" role="group" aria-label="Nível de perigo">
          {DANGER_LEVELS.map(d => (
            <button
              key={d.id}
              type="button"
              aria-pressed={danger === d.id}
              onClick={() => onSetDanger(d.id)}
              title={`Checagem de encontro a cada ${d.every} rodada${d.every === 1 ? '' : 's'}`}
              className={cn(
                'font-heading cursor-pointer border px-1.5 py-0.5 text-[7.5px] tracking-[0.1em] uppercase',
                danger === d.id
                  ? 'border-[var(--primary)] text-[var(--foreground)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)]',
              )}
            >
              {d.label}
            </button>
          ))}
          <span className="font-mono ml-1 text-[8.5px] text-[var(--muted-foreground)]">
            {justChecked ? 'checou agora' : `checa em ${roundsToCheck}`}
          </span>
        </span>
      </span>

      <ol aria-label="O grupo" className="m-0 flex min-w-0 flex-1 list-none gap-1.5 overflow-x-auto p-0 pb-1">
        {seats.map(seat => {
          const key = `pc:${seat.character.id}`
          const present = presentIds.has(seat.character.id)
          return (
            <li key={seat.character.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(key)}
                className={cn(
                  'flex w-[104px] cursor-pointer flex-col gap-1 border px-2 py-1.5 text-left',
                  focusKey === key ? 'border-[var(--primary)] bg-[var(--input)]' : 'border-[var(--border)] bg-[var(--background)]',
                )}
              >
                <span className="flex items-center gap-1">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ background: present ? 'var(--chart-2)' : 'var(--muted-foreground)', opacity: present ? 1 : 0.35 }}
                  />
                  <span className="font-heading min-w-0 flex-1 truncate text-[10px] text-[var(--foreground)]">
                    {seat.character.name}
                  </span>
                </span>
                <HpBar current={seat.character.hpCurrent} max={seat.character.hpMax} thin />
              </button>
            </li>
          )
        })}
      </ol>

      <Button
        type="button"
        variant="outline"
        onClick={onNextRound}
        title={`Passar uma rodada de exploração. ${level.label}: a checagem rola sozinha a cada ${level.every} (atalho: N)`}
        className={NEXT}
      >
        ▸ Rodada
      </Button>
    </div>
  )
}
