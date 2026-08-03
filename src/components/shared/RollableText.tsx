'use client'

import { rollFormula, type RollResult } from '@/lib/dice'
import { cn } from '@/lib/utils'

interface Props {
  text: string
  label?: string
  onRoll?: (r: RollResult) => void
  className?: string
}

// Splits text on dice patterns (e.g. 2d6+3, d20, 1d8-1) and renders
// matching tokens as clickable buttons when onRoll is provided.
const DICE_SPLIT = /(\b(?:\d+)?d\d+(?:[+-]\d+)?\b)/gi
const IS_DICE = /^(?:\d+)?d\d+(?:[+-]\d+)?$/i

export function RollableText({ text, label = 'Rolagem', onRoll, className }: Props) {
  const parts = text.split(DICE_SPLIT)

  return (
    <span className={className}>
      {parts.map((part, i) =>
        IS_DICE.test(part) && onRoll ? (
          <button
            key={i}
            onClick={() => onRoll(rollFormula(part, label, part))}
            title={`Rolar ${part}`}
            className={cn(
              'dice-formula inline border-none bg-transparent px-px',
              '[font-family:inherit] [font-size:inherit] [font-style:inherit]',
              '[font-weight:inherit] [line-height:inherit]',
            )}
          >
            {part}
          </button>
        ) : (
          part
        ),
      )}
    </span>
  )
}
