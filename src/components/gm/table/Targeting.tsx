'use client'

import type { RollMode, RollResult } from '@/lib/dice'
import { ROLL_MODES } from '@/components/shared/RollModeMenu'
import { Button } from '@/components/ui/button'
import type { Targeting } from './controller'
import { CHIP, PILL } from './ui'
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
 * A faixa que aparece enquanto o Mestre escolhe em quem clicar. Diz o que
 * está no ar, deixa trocar vantagem e desvantagem no ataque, e confirma o
 * dano em área depois de marcar os alvos. Esc cancela.
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
    <div
      role="status"
      className="animate-ink-spread flex flex-wrap items-center gap-2 px-3 py-2.5"
      style={{
        background: 'color-mix(in oklch, var(--destructive), var(--card) 85%)',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 3,
        borderColor: 'var(--destructive)',
      }}
    >
      <span aria-hidden className="animate-flicker text-[16px] leading-none">🎯</span>
      <span className="font-heading text-[11px] tracking-[0.06em] text-[var(--foreground)]">
        {targeting.kind === 'attack' && `${attackerName ?? 'O monstro'} ataca: clique no alvo`}
        {targeting.kind === 'damage' && `${targeting.label}: clique em quem levou o golpe`}
        {targeting.kind === 'area' && `${targeting.amount} de dano em área: marque os alvos (${targeting.picked.length})`}
      </span>

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
                CHIP,
                targeting.mode === mode.id
                  ? 'border-[var(--foreground)] text-[var(--foreground)]'
                  : 'border-[var(--border)] text-[var(--muted-foreground)]',
              )}
            >
              {mode.label}
            </Button>
          ))}
        </span>
      )}

      <span className="ml-auto flex items-center gap-1.5">
        {targeting.kind === 'area' && (
          <Button
            type="button"
            variant="outline"
            onClick={onConfirmArea}
            disabled={busy || targeting.picked.length === 0}
            className={cn(PILL, 'border-[var(--destructive)] text-[var(--destructive)] disabled:opacity-30')}
          >
            💥 Aplicar em {targeting.picked.length}
          </Button>
        )}
        <Button type="button" variant="ghost" onClick={onCancel} className={cn(PILL, 'text-[var(--muted-foreground)]')}>
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
  const accent = crit ? 'var(--chart-1)' : hit ? 'var(--destructive)' : 'var(--muted-foreground)'

  return (
    <div
      role="status"
      className="animate-ink-spread flex flex-wrap items-center gap-3 px-3 py-2.5"
      style={{
        background: 'var(--card)',
        borderStyle: 'solid',
        borderWidth: 1,
        borderLeftWidth: 3,
        borderColor: accent,
      }}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-heading text-[12px] tracking-[0.04em] text-[var(--foreground)]">
          {outcome.attackerName} → {outcome.targetName}:{' '}
          <span style={{ color: accent }}>
            {crit ? '✦ CRÍTICO' : hit ? 'ACERTOU' : roll.isFumble ? '☠ ERROU FEIO' : 'ERROU'}
          </span>
        </span>
        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">
          {roll.total} vs CA {outcome.ac}
          {roll.rolls && roll.rolls.length > 1 ? ` · d20 ${roll.rolls.join('/')}` : ` · d20 ${roll.result}`}
          {damage && ` · dano ${damage.die} = ${damage.total}`}
        </span>
      </span>
      <span className="flex items-center gap-1.5">
        {hit && damage && (
          <Button
            type="button"
            variant="outline"
            onClick={onApply}
            disabled={busy}
            className={cn(PILL, 'h-10 border-[var(--destructive)] text-[var(--destructive)]')}
          >
            🗡 Aplicar {damage.total}
          </Button>
        )}
        <Button type="button" variant="outline" onClick={onAgain} className={PILL} title="Mais um ataque do mesmo monstro">
          ⚔ De novo
        </Button>
        <Button type="button" variant="ghost" onClick={onDismiss} aria-label="Fechar" className={cn(PILL, 'text-[var(--muted-foreground)]')}>
          ✕
        </Button>
      </span>
    </div>
  )
}
