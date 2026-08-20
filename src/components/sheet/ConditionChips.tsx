'use client'

import type { ActiveCondition } from '@/types/character.types'
import { getCondition } from '@/data/conditions'
import { cn } from '@/lib/utils'

interface Props {
  conditions: ActiveCondition[]
  /** Quando presente, cada chip ganha um ✕ que a remove. */
  onRemove?: (condition: ActiveCondition) => void
  compact?: boolean
}

/**
 * O que está em vigor sobre o personagem, à vista.
 *
 * Cego, envenenado, caído — antes disso, quem lembrasse. O chip carrega o
 * nome, a nota que o Mestre escreveu ("névoa do santuário") e a descrição no
 * title, para quem não decorou a regra.
 */
export function ConditionChips({ conditions, onRemove, compact }: Props) {
  if (conditions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center', compact ? 'gap-1' : 'gap-1.5')}>
      {conditions.map(condition => {
        const known = getCondition(condition.id)
        const detail = [known?.description, condition.note, condition.appliedBy && `por ${condition.appliedBy}`]
          .filter(Boolean)
          .join(' · ')

        return (
          <span
            key={condition.id}
            title={detail || condition.label}
            className={cn(
              'font-heading inline-flex items-center gap-1 border tracking-[0.12em] uppercase',
              compact ? 'px-1.5 py-[1px] text-[7px]' : 'px-2 py-[3px] text-[8px]',
            )}
            style={{
              color: 'var(--destructive)',
              background: 'color-mix(in oklch, var(--destructive), transparent 88%)',
              borderColor: 'color-mix(in oklch, var(--destructive), transparent 60%)',
            }}
          >
            {condition.label}
            {known?.disadvantage && (
              <span aria-hidden title="Impõe desvantagem" className="opacity-70">↓</span>
            )}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(condition)}
                aria-label={`Remover ${condition.label}`}
                className="cursor-pointer pl-0.5 leading-none opacity-60 transition-opacity hover:opacity-100"
              >
                ✕
              </button>
            )}
          </span>
        )
      })}
    </div>
  )
}

/** As condições ativas que impõem desvantagem, pelo nome — o que o painel de dados anuncia. */
export function disadvantageLabels(conditions: ActiveCondition[]): string[] {
  return conditions.filter(c => getCondition(c.id)?.disadvantage).map(c => c.label)
}
