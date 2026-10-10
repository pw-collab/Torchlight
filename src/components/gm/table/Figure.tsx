'use client'

import { useState, type ReactNode } from 'react'
import type { EncounterActor } from '@/types/encounter.types'
import type { Seat } from '@/lib/gmActions'
import { brightest, minutesLeft } from '@/lib/light'
import type { TableClock } from '@/lib/dungeonClock'
import { useTableNow } from '@/hooks/useTableNow'
import { dyingRounds, mortalState, withoutMortal } from '@/lib/dying'
import { isFleeing } from '@/lib/encounterSetup'
import { cn } from '@/lib/utils'

/** Como o combatente está em relação ao que o Mestre está fazendo. */
export interface FigureState {
  /** É a vez dele na trilha. */
  active?: boolean
  /** É quem o painel de baixo está mostrando. */
  focused?: boolean
  /** O Mestre está escolhendo um alvo, e este serve. */
  targetable?: boolean
  /** Marcado num dano em área. */
  picked?: boolean
}

/** O veredito do ataque, dito em cima de quem levou: "ERROU", "CRÍTICO!". */
export interface Callout {
  id: string
  text: string
  tone: 'miss' | 'hit' | 'crit'
}

/** "Kael Ferro" → "KF", "Goblin 2" → "G2": o que cabe numa ficha redonda. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * A vida mudou desde o último quadro? Então sobe um número: "−4" em sangue,
 * "+3" em verde. Vale para qualquer origem — o Mestre, o jogador na ficha
 * dele, o Realtime —, porque é lido da própria vida, não de quem mexeu nela.
 *
 * O valor anterior mora em estado e é comparado durante o render (o padrão do
 * React para "guardar o que veio antes"), sem efeito nem cronômetro: o número
 * some quando a animação acaba.
 */
function useHpPop(hp: number) {
  const [prev, setPrev] = useState(hp)
  const [pop, setPop] = useState<{ delta: number; n: number } | null>(null)
  if (hp !== prev) {
    setPrev(hp)
    setPop({ delta: hp - prev, n: (pop?.n ?? 0) + 1 })
  }
  return { pop, clear: () => setPop(null) }
}

/**
 * A moldura comum: o retrato em arco, a mira, a seta da vez e o que sobe por
 * cima. É um botão inteiro, porque clicar na figura é o gesto da tela —
 * escolhe quem o painel mostra, ou é o alvo do golpe que está no ar.
 */
function FigureFrame({
  kind, name, hp, state, down, dying, label, onClick, portrait, badges, callout, below,
}: {
  kind: 'party' | 'foe'
  name: string
  hp: number
  state: FigureState
  down?: boolean
  dying?: boolean
  label: string
  onClick: () => void
  portrait?: string | null
  badges?: ReactNode
  callout?: Callout | null
  below: ReactNode
}) {
  const { pop, clear } = useHpPop(hp)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={state.focused || state.picked || undefined}
      className={cn(
        'dd-fig',
        kind === 'foe' && 'dd-fig--foe',
        state.active && 'is-active',
        state.focused && 'is-focused',
        state.targetable && 'is-targetable',
        state.picked && 'is-picked',
        down && 'is-down',
        dying && 'is-dying',
      )}
    >
      <span className="dd-fig__body">
        {state.active && <span aria-hidden className="dd-fig__turn">▼</span>}
        <span className="dd-fig__frame">
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt="" />
          ) : (
            <span aria-hidden className="dd-fig__mono">{initials(name)}</span>
          )}
        </span>
        {badges}
        {(state.targetable || state.picked) && <span aria-hidden className="dd-fig__reticle" />}
        {pop && pop.delta !== 0 && (
          <span
            key={pop.n}
            aria-hidden
            onAnimationEnd={clear}
            className={cn('dd-pop', pop.delta < 0 ? 'dd-pop--dmg' : 'dd-pop--heal')}
          >
            {pop.delta < 0 ? `−${Math.abs(pop.delta)}` : `+${pop.delta}`}
          </span>
        )}
        {callout && (
          <span key={callout.id} aria-hidden className={cn('dd-pop', `dd-pop--${callout.tone}`)}>
            {callout.text}
          </span>
        )}
      </span>
      <span aria-hidden className="dd-fig__shadow" />
      {below}
    </button>
  )
}

function Hp({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0
  return (
    <span aria-hidden className="dd-hp">
      <span style={{ width: `${pct}%` }} />
    </span>
  )
}

// ─── O grupo ──────────────────────────────────────────────────────────────────

export function PartyFigure({
  seat, actor, inEncounter, present, clock, state, callout, onClick,
}: {
  seat: Seat
  /** A linha dele na trilha, quando há combate e ele está nela. */
  actor?: EncounterActor
  inEncounter: boolean
  present: boolean
  clock: TableClock
  state: FigureState
  callout?: Callout | null
  onClick: () => void
}) {
  const c = seat.character
  const now = useTableNow(clock)
  const light = brightest(c.inventory, now)
  const torch = light ? minutesLeft(light, now) : null
  const mortal = mortalState(c.conditions)
  const rounds = dyingRounds(c.conditions)
  const others = withoutMortal(c.conditions)

  return (
    <FigureFrame
      kind="party"
      name={c.name}
      hp={c.hpCurrent}
      state={state}
      down={mortal === 'dead' || mortal === 'stable'}
      dying={mortal === 'dying'}
      label={`${c.name}: ${c.hpCurrent} de ${c.hpMax} PV`}
      onClick={onClick}
      portrait={c.portraitUrl}
      callout={callout}
      badges={
        <>
          {present && <span aria-hidden title="Com a ficha aberta" className="dd-fig__presence" />}
          {inEncounter && (
            <span aria-hidden title="Iniciativa" className="dd-fig__init">{actor?.initiative ?? '—'}</span>
          )}
        </>
      }
      below={
        <>
          <span className="dd-fig__name">{c.name}</span>
          <Hp current={c.hpCurrent} max={c.hpMax} />
          <span className="dd-fig__meta">{c.hpCurrent}/{c.hpMax} · CA {c.ac}</span>
          <span className="dd-fig__tags">
            {mortal === 'dying' && <span className="dd-tag">☠ morrendo {rounds}</span>}
            {mortal === 'stable' && <span className="dd-tag dd-tag--heal">✚ estável</span>}
            {mortal === 'dead' && <span className="dd-tag">☠ morto</span>}
            {torch !== null && (
              <span className={cn('dd-tag', torch > 10 && 'dd-tag--gold')} title={light?.name}>🕯 {torch}m</span>
            )}
            {others.map(condition => (
              <span key={condition.id} className="dd-tag" title={condition.note}>{condition.label}</span>
            ))}
          </span>
        </>
      }
    />
  )
}

// ─── Os inimigos ──────────────────────────────────────────────────────────────

export function FoeFigure({
  actor, state, callout, onClick,
}: {
  actor: EncounterActor
  state: FigureState
  callout?: Callout | null
  onClick: () => void
}) {
  const hp = actor.hpCurrent ?? 0
  const max = actor.hpMax ?? hp
  const fleeing = isFleeing(actor)
  const others = actor.conditions.filter(c => c.id !== 'fugindo')

  return (
    <FigureFrame
      kind="foe"
      name={actor.name}
      hp={hp}
      state={state}
      down={actor.defeated}
      label={`${actor.name}: ${hp} de ${max} PV`}
      onClick={onClick}
      callout={callout}
      badges={<span aria-hidden title="Iniciativa" className="dd-fig__init">{actor.initiative ?? '—'}</span>}
      below={
        <>
          <span className="dd-fig__name">{actor.name}</span>
          <Hp current={hp} max={max} />
          <span className="dd-fig__meta">{hp}/{max} · CA {actor.ac ?? 10}</span>
          <span className="dd-fig__tags">
            {actor.defeated && <span className="dd-tag">☠ caído</span>}
            {fleeing && !actor.defeated && <span className="dd-tag dd-tag--gold">🏳 foge</span>}
            {others.map(condition => (
              <span key={condition.id} className="dd-tag">{condition.label}</span>
            ))}
          </span>
        </>
      }
    />
  )
}
