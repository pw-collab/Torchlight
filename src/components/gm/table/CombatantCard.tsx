'use client'

import type { ReactNode } from 'react'
import type { EncounterActor } from '@/types/encounter.types'
import type { Seat } from '@/lib/gmActions'
import { getClass } from '@/data/classes/index'
import { brightest, minutesLeft } from '@/lib/light'
import { tableNow, type TableClock } from '@/lib/dungeonClock'
import { useNow } from '@/hooks/useNow'
import { dyingRounds, mortalState, withoutMortal } from '@/lib/dying'
import { isFleeing } from '@/lib/encounterSetup'
import { ConditionChips } from '@/components/sheet/ConditionChips'
import { HpBar } from './ui'
import { cn } from '@/lib/utils'

/** Como o card está agora em relação ao que o Mestre está fazendo. */
export interface CardState {
  /** É a vez dele na trilha. */
  active?: boolean
  /** É quem o menu de comandos está mostrando. */
  focused?: boolean
  /** O Mestre está escolhendo um alvo, e este serve. */
  targetable?: boolean
  /** Marcado num dano em área. */
  picked?: boolean
}

/**
 * A moldura comum: um botão inteiro, porque clicar no card é o gesto da tela
 * — escolhe quem o menu mostra, ou é o alvo do ataque que está no ar.
 */
function CardFrame({
  state, down, onClick, label, children,
}: {
  state: CardState
  down?: boolean
  onClick: () => void
  label: string
  children: ReactNode
}) {
  const border = state.picked
    ? 'var(--destructive)'
    : state.targetable
      ? 'var(--destructive)'
      : state.active
        ? 'var(--chart-1)'
        : state.focused
          ? 'var(--primary)'
          : 'var(--border)'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={state.focused || state.picked || undefined}
      className={cn(
        'relative flex w-full min-w-0 cursor-pointer flex-col gap-1.5 px-3 py-2.5 text-left',
        'transition-[border-color,box-shadow,opacity] duration-200 focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50 focus-visible:outline-none',
        down && !state.targetable && !state.picked && 'opacity-50',
        state.targetable && 'cursor-crosshair',
      )}
      style={{
        background: state.active
          ? 'color-mix(in oklch, var(--chart-1), var(--card) 90%)'
          : state.picked
            ? 'color-mix(in oklch, var(--destructive), var(--card) 85%)'
            : 'var(--card)',
        borderStyle: 'solid',
        borderWidth: state.focused || state.active || state.targetable || state.picked ? 2 : 1,
        borderColor: border,
        boxShadow: state.targetable
          ? '0 0 0 2px color-mix(in oklch, var(--destructive), transparent 70%), 0 0 14px color-mix(in oklch, var(--destructive), transparent 60%)'
          : state.active
            ? '0 0 14px color-mix(in oklch, var(--chart-1), transparent 65%)'
            : '0 3px 12px rgba(0,0,0,0.5)',
      }}
    >
      {children}
      {state.targetable && (
        <span className="font-heading absolute top-1.5 right-2 text-[8px] tracking-[0.14em] text-[var(--destructive)] uppercase">
          🎯 alvo
        </span>
      )}
      {state.picked && (
        <span className="font-heading absolute top-1.5 right-2 text-[8px] tracking-[0.14em] text-[var(--destructive)] uppercase">
          ✔ marcado
        </span>
      )}
    </button>
  )
}

/** "▶ VEZ" e a iniciativa, no canto do nome. */
function TurnMarks({ active, initiative }: { active?: boolean; initiative?: number | null }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {active && (
        <span className="font-heading animate-flicker text-[8px] tracking-[0.16em] text-[var(--chart-1)] uppercase">
          ▶ Vez
        </span>
      )}
      {initiative !== undefined && (
        <span
          title={initiative == null ? 'Ainda não rolou iniciativa' : 'Iniciativa'}
          className="font-mono min-w-6 border border-[var(--border)] px-1 text-center text-[10px] text-[var(--muted-foreground)]"
        >
          {initiative ?? '—'}
        </span>
      )}
    </span>
  )
}

// ─── O grupo ──────────────────────────────────────────────────────────────────

/**
 * Um aventureiro, do lado do Mestre: vida, CA, Fortuna, luz, o que está em
 * vigor sobre ele e, no combate, a iniciativa e a vez. Nada de botão aqui —
 * as ações moram no menu de comandos, que abre ao clicar.
 */
export function PartyCard({
  seat, actor, inEncounter, present, clock, state, onClick,
}: {
  seat: Seat
  /** A linha dele na trilha, quando há combate e ele está nela. */
  actor?: EncounterActor
  inEncounter: boolean
  present: boolean
  clock: TableClock
  state: CardState
  onClick: () => void
}) {
  const c = seat.character
  const now = tableNow(clock, useNow())
  const light = brightest(c.inventory, now)
  const torch = light ? minutesLeft(light, now) : null
  const mortal = mortalState(c.conditions)
  const rounds = dyingRounds(c.conditions)
  const cls = getClass(c.classId)

  return (
    <CardFrame
      state={state}
      down={c.hpCurrent <= 0}
      onClick={onClick}
      label={`${c.name}: ${c.hpCurrent} de ${c.hpMax} PV`}
    >
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          title={present ? 'Com a ficha aberta agora' : 'Fora do app'}
          className="size-1.5 shrink-0 rounded-full"
          style={{
            background: present ? 'var(--chart-2)' : 'var(--muted-foreground)',
            boxShadow: present ? '0 0 6px var(--chart-2)' : 'none',
            opacity: present ? 1 : 0.35,
          }}
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-heading truncate text-[13px] leading-tight font-semibold text-[var(--foreground)]">
            {c.name}
          </span>
          <span className="font-body truncate text-[9.5px] text-[var(--muted-foreground)] italic">
            {[seat.playerName, cls ? `${cls.name} ${c.level}` : `Nível ${c.level}`].filter(Boolean).join(' · ')}
          </span>
        </span>
        <TurnMarks
          active={state.active}
          initiative={inEncounter ? (actor ? actor.initiative : null) : undefined}
        />
      </span>

      <HpBar current={c.hpCurrent} max={c.hpMax} />

      <span className="flex items-center justify-between gap-2 font-mono text-[10px]">
        <span className="text-[var(--foreground)]">PV {c.hpCurrent}/{c.hpMax}</span>
        <span className="text-[var(--muted-foreground)]">CA {c.ac}</span>
        <span className="text-[var(--chart-1)]">✦ {c.luckTokens}</span>
        <span
          className={cn(
            torch === null
              ? 'text-[var(--muted-foreground)]/50'
              : torch <= 10
                ? 'text-[var(--destructive)]'
                : 'text-[var(--chart-1)]',
          )}
          title={light ? light.name : 'Sem luz'}
        >
          {torch === null ? '🌑' : `🕯 ${torch}m`}
        </span>
      </span>

      {(mortal !== 'standing' || withoutMortal(c.conditions).length > 0) && (
        <span className="flex flex-wrap items-center gap-1">
          {mortal !== 'standing' && (
            <span
              className={cn(
                'font-heading border px-1.5 py-[1px] text-[7.5px] tracking-[0.12em] uppercase',
                mortal === 'stable'
                  ? 'border-[var(--chart-2)] text-[var(--chart-2)]'
                  : 'border-[var(--destructive)] text-[var(--destructive)]',
                mortal === 'dying' && 'animate-flicker',
              )}
            >
              {mortal === 'dying' ? `☠ Morrendo · ${rounds}` : mortal === 'stable' ? '✚ Estável' : '☠ Morto'}
            </span>
          )}
          <ConditionChips compact conditions={withoutMortal(c.conditions)} />
        </span>
      )}
    </CardFrame>
  )
}

// ─── Os inimigos ──────────────────────────────────────────────────────────────

/**
 * Um monstro da trilha: a vida que é só dele, a CA, o ataque que o statblock
 * deu e o que está em vigor — fugindo, caído, envenenado.
 */
export function FoeCard({
  actor, kind, state, onClick,
}: {
  actor: EncounterActor
  /** O tipo do statblock de origem ("Humanoide, caótico"), quando há ficha. */
  kind?: string
  state: CardState
  onClick: () => void
}) {
  const hp = actor.hpCurrent ?? 0
  const max = actor.hpMax ?? hp
  const fleeing = isFleeing(actor)
  const others = actor.conditions.filter(c => c.id !== 'fugindo')
  const bonus = actor.atkBonus ?? 0

  return (
    <CardFrame
      state={state}
      down={actor.defeated}
      onClick={onClick}
      label={`${actor.name}: ${hp} de ${max} PV`}
    >
      <span className="flex items-center gap-2">
        <span className="flex min-w-0 flex-1 flex-col">
          <span
            className={cn(
              'font-heading truncate text-[13px] leading-tight font-semibold text-[var(--foreground)]',
              actor.defeated && 'line-through',
            )}
          >
            {actor.name}
          </span>
          {kind && (
            <span className="font-body truncate text-[9.5px] text-[var(--muted-foreground)] italic">{kind}</span>
          )}
        </span>
        <TurnMarks active={state.active} initiative={actor.initiative} />
      </span>

      <HpBar current={hp} max={max} />

      <span className="flex items-center justify-between gap-2 font-mono text-[10px]">
        <span className="text-[var(--foreground)]">PV {hp}/{max}</span>
        <span className="text-[var(--muted-foreground)]">CA {actor.ac ?? 10}</span>
        <span className="text-[var(--muted-foreground)]">
          ATK {bonus >= 0 ? `+${bonus}` : bonus}{actor.damageDie ? ` · ${actor.damageDie}` : ''}
        </span>
      </span>

      {(actor.defeated || fleeing || others.length > 0) && (
        <span className="flex flex-wrap items-center gap-1">
          {actor.defeated && (
            <span className="font-heading border border-[var(--destructive)] px-1.5 py-[1px] text-[7.5px] tracking-[0.12em] text-[var(--destructive)] uppercase">
              ☠ Derrotado
            </span>
          )}
          {fleeing && !actor.defeated && (
            <span className="font-heading border border-[var(--chart-1)] px-1.5 py-[1px] text-[7.5px] tracking-[0.12em] text-[var(--chart-1)] uppercase">
              🏳 Fugindo
            </span>
          )}
          <ConditionChips compact conditions={others} />
        </span>
      )}
    </CardFrame>
  )
}
