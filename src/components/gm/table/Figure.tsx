'use client'

import { useState, type ReactNode } from 'react'
import type { EncounterActor } from '@/types/encounter.types'
import type { Seat } from '@/lib/gmActions'
import { brightest, minutesLeft } from '@/lib/light'
import type { TableClock } from '@/lib/dungeonClock'
import { useTableNow } from '@/hooks/useTableNow'
import { dyingRounds, mortalState, withoutMortal } from '@/lib/dying'
import { isFleeing } from '@/lib/encounterSetup'
import { HpBar } from './ui'
import { cn } from '@/lib/utils'

/** Como o combatente está em relação ao que o Mestre está fazendo. */
export interface FigureState {
  /** É ele quem está agindo. */
  active?: boolean
  /** Já agiu nesta rodada. */
  done?: boolean
  /** É quem o bloco de ações está mostrando. */
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

/** "Kael Ferro" → "KF", "Goblin 2" → "G2": o que cabe numa ficha do quadro. */
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
 * A moldura comum: o retrato com a CA e a vida por cima, como os vitais da
 * ficha, a mira e o que sobe por cima. É um botão inteiro, porque clicar na
 * figura é o gesto da tela — escolhe quem o bloco de ações mostra, ou é o
 * alvo do golpe que está no ar.
 */
function FigureFrame({
  kind, name, hp, max, ac, state, down, dying, label, onClick, portrait, present, callout, tags,
}: {
  kind: 'party' | 'foe'
  name: string
  hp: number
  max: number
  ac: number
  state: FigureState
  down?: boolean
  dying?: boolean
  label: string
  onClick: () => void
  portrait?: string | null
  /** Com a ficha aberta agora. */
  present?: boolean
  callout?: Callout | null
  tags: ReactNode
}) {
  const { pop, clear } = useHpPop(hp)

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={state.focused || state.picked || undefined}
      className={cn(
        'gm-fig',
        kind === 'foe' && 'gm-fig--foe',
        state.active && 'is-active',
        state.done && 'is-done',
        state.focused && 'is-focused',
        state.targetable && 'is-targetable',
        state.picked && 'is-picked',
        down && 'is-down',
        dying && 'is-dying',
      )}
    >
      <span className="gm-fig__body">
        <span className="gm-fig__portrait">
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={portrait} alt="" />
          ) : (
            <span aria-hidden className="gm-fig__mono">{initials(name)}</span>
          )}
          {state.active ? (
            <span aria-hidden className="gm-fig__flag gm-fig__flag--turn">Age</span>
          ) : state.done ? (
            <span aria-hidden title="Já agiu nesta rodada" className="gm-fig__flag">✓ Agiu</span>
          ) : null}
          <span aria-hidden className="gm-fig__ac"><small>CA</small><b>{ac}</b></span>
          <HpBar current={hp} max={max} label={false} />
        </span>
        {(state.targetable || state.picked) && <span aria-hidden className="gm-fig__reticle" />}
        {pop && pop.delta !== 0 && (
          <span
            key={pop.n}
            aria-hidden
            onAnimationEnd={clear}
            className={cn('gm-pop', pop.delta < 0 ? 'gm-pop--dmg' : 'gm-pop--heal')}
          >
            {pop.delta < 0 ? `−${Math.abs(pop.delta)}` : `+${pop.delta}`}
          </span>
        )}
        {callout && (
          <span key={callout.id} aria-hidden className={cn('gm-pop', `gm-pop--${callout.tone}`)}>
            {callout.text}
          </span>
        )}
      </span>
      <span className="gm-fig__name">
        {present && <span aria-hidden title="Com a ficha aberta" className="gm-fig__presence" />}
        <span>{name}</span>
      </span>
      <span className="gm-fig__tags">{tags}</span>
    </button>
  )
}

/** A vez dita para o leitor de tela, que não vê o vermelho nem o apagado. */
function turnLabel(state: FigureState): string {
  if (state.active) return ', agindo'
  if (state.done) return ', já agiu'
  return ''
}

// ─── O grupo ──────────────────────────────────────────────────────────────────

export function PartyFigure({
  seat, present, clock, state, callout, onClick,
}: {
  seat: Seat
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
      max={c.hpMax}
      ac={c.ac}
      state={state}
      down={mortal === 'dead' || mortal === 'stable'}
      dying={mortal === 'dying'}
      label={`${c.name}: ${c.hpCurrent} de ${c.hpMax} PV, CA ${c.ac}${turnLabel(state)}`}
      onClick={onClick}
      portrait={c.portraitUrl}
      present={present}
      callout={callout}
      tags={
        <>
          {mortal === 'dying' && <span className="gm-tag">Morrendo · {rounds}</span>}
          {mortal === 'stable' && <span className="gm-tag gm-tag--quiet">Estável</span>}
          {mortal === 'dead' && <span className="gm-tag">Morto</span>}
          {torch !== null && (
            <span className={cn('gm-tag', torch > 10 ? 'gm-tag--light' : '')} title={light?.name}>Luz {torch}m</span>
          )}
          {others.map(condition => (
            <span key={condition.id} className="gm-tag" title={condition.note}>{condition.label}</span>
          ))}
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
      max={max}
      ac={actor.ac ?? 10}
      state={state}
      down={actor.defeated}
      label={`${actor.name}: ${hp} de ${max} PV, CA ${actor.ac ?? 10}${turnLabel(state)}`}
      onClick={onClick}
      callout={callout}
      tags={
        <>
          {actor.defeated && <span className="gm-tag gm-tag--quiet">Caído</span>}
          {fleeing && !actor.defeated && <span className="gm-tag gm-tag--quiet">Fugindo</span>}
          {others.map(condition => (
            <span key={condition.id} className="gm-tag">{condition.label}</span>
          ))}
        </>
      }
    />
  )
}
