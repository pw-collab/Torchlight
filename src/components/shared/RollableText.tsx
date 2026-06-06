'use client'

import { rollFormula, type RollResult } from '@/lib/dice'

interface Props {
  text: string
  label?: string
  onRoll?: (r: RollResult) => void
  style?: React.CSSProperties
}

// Splits text on dice patterns (e.g. 2d6+3, d20, 1d8-1) and renders
// matching tokens as clickable buttons when onRoll is provided.
const DICE_SPLIT = /(\b(?:\d+)?d\d+(?:[+-]\d+)?\b)/gi
const IS_DICE = /^(?:\d+)?d\d+(?:[+-]\d+)?$/i

export function RollableText({ text, label = 'Rolagem', onRoll, style }: Props) {
  const parts = text.split(DICE_SPLIT)

  return (
    <span style={style}>
      {parts.map((part, i) =>
        IS_DICE.test(part) && onRoll ? (
          <button
            key={i}
            onClick={() => onRoll(rollFormula(part, label, part))}
            title={`Rolar ${part}`}
            className="dice-formula"
            style={{
              display: 'inline',
              background: 'none',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              fontStyle: 'inherit',
              fontWeight: 'inherit',
              lineHeight: 'inherit',
              padding: '0 1px',
            }}
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
