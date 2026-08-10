'use client'

import { useState } from 'react'
import { DieGlyph } from '@/components/dice/DieGlyph'

/* Painted die art for the roller buttons, where the icon stands for the
   *type* of die. The tumbling dice in DiceScene can't use these: they have to
   show whichever face is up at that instant, and each of these images has its
   number baked in. That's why DieGlyph stays — it draws any value in any
   colour, and doubles as the fallback here. */

const DIE_ART: Record<number, string> = {
  4: '/dice/d4.png',
  6: '/dice/d6.png',
  8: '/dice/d8.png',
  10: '/dice/d10.png',
  12: '/dice/d12.png',
  20: '/dice/d20.png',
}

interface Props {
  sides: number
  size?: number
  /** Only reaches the vector fallback — the art carries its own colours. */
  shapeColor: string
  numberColor: string
  className?: string
}

export function DieIcon({ sides, size = 32, shapeColor, numberColor, className }: Props) {
  const [broken, setBroken] = useState(false)
  const src = DIE_ART[sides]

  // A die with no art of its own, or an asset that failed to load.
  if (!src || broken) {
    return (
      <DieGlyph
        sides={sides}
        size={size}
        shapeColor={shapeColor}
        numberColor={numberColor}
        className={className}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local icon set, already sized for display
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', flexShrink: 0 }}
      onError={() => setBroken(true)}
    />
  )
}
