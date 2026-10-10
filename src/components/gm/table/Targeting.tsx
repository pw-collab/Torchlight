'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, CrosshairIcon } from '@hugeicons/core-free-icons'
import type { RollMode, RollResult } from '@/lib/dice'
import { ROLL_MODES } from '@/components/shared/RollModeMenu'
import { Button } from '@/components/ui/button'
import type { Targeting } from './controller'
import { PRESSED } from './ui'
import { cn } from '@/lib/utils'

/** Os botões das faixas sobre o palco: pequenos, para caber numa linha. */
export const CALLOUT_BUTTON = 'h-8 px-2.5 text-[10px] tracking-[0.1em]'

/** O ✕ das faixas. */
export function DismissButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onClick} aria-label={label} title={label} className="size-8">
      <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={1.75} />
    </Button>
  )
}

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
 * A faixa que fica no alto do palco enquanto o Mestre escolhe em quem
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
    <div role="status" className="gm-callout gm-callout--danger animate-mist-rise">
      <HugeiconsIcon icon={CrosshairIcon} size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-[var(--destructive)]" />
      <span className="gm-callout__body">
        <span className="gm-callout__title">
          {targeting.kind === 'attack' && `${attackerName ?? 'O monstro'} ataca`}
          {targeting.kind === 'damage' && targeting.label}
          {targeting.kind === 'area' && `${targeting.amount} de dano em área`}
        </span>
        <span className="gm-callout__text">
          {targeting.kind === 'area'
            ? `Marque os alvos no palco (${targeting.picked.length}) e aplique.`
            : targeting.kind === 'attack'
              ? 'Clique no alvo no palco.'
              : 'Clique em quem levou o golpe.'}
        </span>
      </span>

      <span className="gm-callout__actions">
        {targeting.kind === 'attack' && (
          <span className="flex items-center gap-1" role="group" aria-label="Modo da rolagem">
            {ROLL_MODES.map(mode => (
              <Button
                key={mode.id}
                type="button"
                variant="outline"
                aria-pressed={targeting.mode === mode.id}
                onClick={() => onMode(mode.id)}
                className={cn(
                  CALLOUT_BUTTON,
                  targeting.mode === mode.id && PRESSED,
                )}
              >
                {mode.label}
              </Button>
            ))}
          </span>
        )}
        {targeting.kind === 'area' && (
          <Button
            type="button"
            onClick={onConfirmArea}
            disabled={busy || targeting.picked.length === 0}
            className={CALLOUT_BUTTON}
          >
            Aplicar em {targeting.picked.length}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel} className={CALLOUT_BUTTON}>
          Cancelar · Esc
        </Button>
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
  const verdict = crit ? 'Crítico' : hit ? 'Acertou' : roll.isFumble ? 'Errou feio' : 'Errou'

  return (
    <div role="status" className={cn('gm-callout animate-mist-rise', crit ? 'gm-callout--crit' : hit && 'gm-callout--danger')}>
      <span className="gm-callout__body">
        <span className="gm-callout__title">
          {outcome.attackerName} → {outcome.targetName}:{' '}
          <span className={crit ? 'text-[var(--chart-1)]' : hit ? 'text-[var(--destructive)]' : 'text-[var(--muted-foreground)]'}>
            {verdict}
          </span>
        </span>
        <span className="gm-callout__text">
          {roll.total} contra CA {outcome.ac}
          {roll.rolls && roll.rolls.length > 1 ? ` · d20 ${roll.rolls.join('/')}` : ` · d20 ${roll.result}`}
          {damage && ` · dano ${damage.die} = ${damage.total}`}
        </span>
      </span>
      <span className="gm-callout__actions">
        {hit && damage && (
          <Button type="button" onClick={onApply} disabled={busy} className={CALLOUT_BUTTON}>
            Aplicar {damage.total}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onAgain} className={CALLOUT_BUTTON} title="Mais um ataque do mesmo monstro">
          De novo
        </Button>
        <DismissButton onClick={onDismiss} label="Fechar" />
      </span>
    </div>
  )
}
