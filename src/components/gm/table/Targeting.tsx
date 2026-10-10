'use client'

import type { RollMode, RollResult } from '@/lib/dice'
import { ROLL_MODES } from '@/components/shared/RollModeMenu'
import type { Targeting } from './controller'
import { cn } from '@/lib/utils'

/** O ataque de um monstro, rolado e esperando o Mestre aplicar o dano. */
export interface AttackOutcome {
  attackerId: string
  attackerName: string
  targetKey: string
  targetName: string
  roll: RollResult
  ac: number
  hit: boolean
  /** Nulo quando errou — ou quando o statblock não tem dado de dano. */
  damage: RollResult | null
}

/**
 * O pergaminho que paira sobre o palco enquanto o Mestre escolhe em quem
 * clicar: o que está no ar, vantagem e desvantagem no ataque, e a
 * confirmação do dano em área depois de marcar os alvos. Esc cancela.
 */
export function TargetingBar({
  targeting, attackerName, onMode, onConfirmArea, onCancel, busy,
}: {
  targeting: Targeting
  attackerName?: string
  onMode: (mode: RollMode) => void
  onConfirmArea: () => void
  onCancel: () => void
  busy?: boolean
}) {
  return (
    <div role="status" className="dd-scroll dd-scroll--blood animate-ink-spread">
      <span className="dd-scroll__title" style={{ color: 'var(--dd-blood-hi)' }}>
        🎯{' '}
        {targeting.kind === 'attack' && `${attackerName ?? 'O monstro'} ataca: clique no alvo`}
        {targeting.kind === 'damage' && `${targeting.label}: clique em quem levou o golpe`}
        {targeting.kind === 'area' && `${targeting.amount} de dano em área: marque os alvos (${targeting.picked.length})`}
      </span>

      {targeting.kind === 'attack' && (
        <span className="flex items-center gap-1" role="group" aria-label="Modo da rolagem">
          {ROLL_MODES.map(mode => (
            <button
              key={mode.id}
              type="button"
              aria-pressed={targeting.mode === mode.id}
              onClick={() => onMode(mode.id)}
              className={cn('dd-btn dd-btn--sm', targeting.mode === mode.id && 'dd-btn--gold')}
            >
              {mode.label}
            </button>
          ))}
        </span>
      )}

      <span className="flex items-center gap-1.5">
        {targeting.kind === 'area' && (
          <button
            type="button"
            onClick={onConfirmArea}
            disabled={busy || targeting.picked.length === 0}
            className="dd-btn dd-btn--sm dd-btn--blood"
          >
            💥 Aplicar em {targeting.picked.length}
          </button>
        )}
        <button type="button" onClick={onCancel} className="dd-btn dd-btn--sm">
          Cancelar · Esc
        </button>
      </span>
    </div>
  )
}

/**
 * O resultado do ataque: o número contra a CA, o veredito e o dano, que só
 * vai para a ficha quando o Mestre aplica — ele ainda pode narrar antes, ou
 * decidir que o golpe pega de raspão.
 */
export function AttackOutcomeCard({
  outcome, onApply, onAgain, onDismiss, busy,
}: {
  outcome: AttackOutcome
  onApply: () => void
  onAgain: () => void
  onDismiss: () => void
  busy?: boolean
}) {
  const { roll, hit, damage } = outcome
  const crit = roll.isCritical === true
  const accent = crit ? 'var(--dd-gold)' : hit ? 'var(--dd-blood-hi)' : 'var(--dd-bone-dim)'

  return (
    <div role="status" className="dd-scroll animate-ink-spread" style={{ borderColor: accent }}>
      <span className="flex min-w-0 flex-col items-center gap-0.5 text-center">
        <span className="dd-scroll__title">
          {outcome.attackerName} → {outcome.targetName}:{' '}
          <span style={{ color: accent }}>
            {crit ? '✦ Crítico' : hit ? 'Acertou' : roll.isFumble ? '☠ Errou feio' : 'Errou'}
          </span>
        </span>
        <span className="dd-scroll__text">
          {roll.total} contra CA {outcome.ac}
          {roll.rolls && roll.rolls.length > 1 ? ` · d20 ${roll.rolls.join('/')}` : ` · d20 ${roll.result}`}
          {damage && ` · dano ${damage.die} = ${damage.total}`}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        {hit && damage && (
          <button type="button" onClick={onApply} disabled={busy} className="dd-btn dd-btn--sm dd-btn--blood">
            🗡 Aplicar {damage.total}
          </button>
        )}
        <button type="button" onClick={onAgain} className="dd-btn dd-btn--sm" title="Mais um ataque do mesmo monstro">
          ⚔ De novo
        </button>
        <button type="button" onClick={onDismiss} aria-label="Fechar" className="dd-btn dd-btn--sm">
          ✕
        </button>
      </span>
    </div>
  )
}
