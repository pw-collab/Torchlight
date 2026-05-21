'use client'

import { modifier } from '@/lib/dice'
import { getClass } from '@/data/classes/index'

interface Props {
  classId: string
  con: number
  hpMax: number
  onRoll: (hp: number) => void
}

export function StepHP({ classId, con, hpMax, onRoll }: Props) {
  const cls = getClass(classId)
  const conMod = modifier(con)

  function rollHP() {
    if (!cls) return
    const roll = Math.floor(Math.random() * cls.hitDie) + 1
    const hp = Math.max(1, roll + conMod)
    onRoll(hp)
  }

  return (
    <div className="space-y-4 text-center">
      {cls && (
        <p className="text-zinc-400 text-sm">
          Roll <span className="text-amber-400 font-bold">d{cls.hitDie}</span> + CON modifier (<span className="text-amber-400">{conMod >= 0 ? '+' : ''}{conMod}</span>), minimum 1
        </p>
      )}
      <button
        onClick={rollHP}
        className="w-full rounded bg-amber-700 py-2 font-bold text-white hover:bg-amber-600"
      >
        🎲 Roll HP
      </button>
      {hpMax > 0 && (
        <div className="rounded border border-red-700 bg-red-950 p-4">
          <p className="text-xs text-red-400">MAX HP</p>
          <p className="text-4xl font-bold text-white">{hpMax}</p>
        </div>
      )}
    </div>
  )
}
