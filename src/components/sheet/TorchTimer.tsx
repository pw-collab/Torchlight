'use client'

import { useTorch } from '@/hooks/useTorch'
import { useCallback } from 'react'

interface Props {
  torchEndAt: string | null
  playerName: string
  characterId: string
  onUpdate: (torchEndAt: string | null) => void
}

export function TorchTimer({ torchEndAt, playerName, characterId, onUpdate }: Props) {
  const stableOnUpdate = useCallback(onUpdate, [onUpdate])
  const { minutesLeft, lightTorch, extinguishTorch } = useTorch(torchEndAt, playerName, characterId, stableOnUpdate)

  const isLit = torchEndAt !== null
  const isLow = minutesLeft !== null && minutesLeft <= 10

  return (
    <div className={`rounded border p-3 ${isLit ? (isLow ? 'border-orange-600 bg-orange-950' : 'border-amber-600 bg-amber-950') : 'border-zinc-700 bg-zinc-800'}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400">TORCH</span>
        {isLit && minutesLeft !== null && (
          <span className={`text-sm font-semibold ${isLow ? 'text-orange-400' : 'text-amber-300'}`}>
            {minutesLeft}min
          </span>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        {!isLit ? (
          <button
            onClick={lightTorch}
            className="flex-1 rounded bg-amber-700 py-1 text-sm font-bold text-white hover:bg-amber-600"
          >
            🕯️ Acender
          </button>
        ) : (
          <button
            onClick={extinguishTorch}
            className="flex-1 rounded bg-zinc-700 py-1 text-sm font-bold text-white hover:bg-zinc-600"
          >
            🌑 Apagar
          </button>
        )}
      </div>
    </div>
  )
}
