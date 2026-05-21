'use client'

import type { Character } from '@/types/character.types'

interface Props {
  character: Character
  onClick: () => void
  expanded: boolean
}

export function PlayerCard({ character, onClick, expanded }: Props) {
  const hpPercent = Math.max(0, (character.hpCurrent / character.hpMax) * 100)
  const hpColor = hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-600' : 'bg-red-600'
  const isDead = character.hpCurrent <= 0

  const torchActive = character.torchEndAt !== null
  const torchMins = torchActive
    ? Math.max(0, Math.ceil((new Date(character.torchEndAt!).getTime() - Date.now()) / 60000))
    : null
  const torchLow = torchMins !== null && torchMins <= 10

  return (
    <div
      className={`rounded border cursor-pointer transition-colors ${isDead ? 'border-red-700 bg-red-950' : expanded ? 'border-amber-500 bg-zinc-800' : 'border-zinc-700 bg-zinc-800 hover:border-amber-700'}`}
      onClick={onClick}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-white">{character.name}</h3>
          {isDead && <span className="text-xs text-red-400 font-bold">💀 DOWN</span>}
        </div>
        <div className="mb-1 h-2 w-full rounded bg-zinc-700">
          <div className={`h-2 rounded ${hpColor}`} style={{ width: `${hpPercent}%` }} />
        </div>
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>HP {character.hpCurrent}/{character.hpMax}</span>
          <span>AC {character.ac}</span>
          <span>🍀 {character.luckTokens}</span>
          <span>
            {torchActive
              ? (torchLow ? `⚠️ ${torchMins}min` : `🕯️ ${torchMins}min`)
              : '🌑 No torch'}
          </span>
        </div>
      </div>
    </div>
  )
}
