'use client'

import { useState } from 'react'
import { modifier } from '@/lib/dice'
import { sendToDiscord } from '@/lib/discord'

const DICE = [4, 6, 8, 10, 12, 20]

interface Props {
  characterName: string
  statMod?: number
}

export function DiceRoller({ characterName, statMod = 0 }: Props) {
  const [selectedDie, setSelectedDie] = useState(20)
  const [extraMod, setExtraMod] = useState(0)
  const [dc, setDc] = useState(14)
  const [lastResult, setLastResult] = useState<{ roll: number; total: number; success: boolean } | null>(null)

  function roll() {
    const result = Math.floor(Math.random() * selectedDie) + 1
    const totalMod = statMod + extraMod
    const total = result + totalMod
    const success = total >= dc
    setLastResult({ roll: result, total, success })
    sendToDiscord({
      type: 'roll',
      player: characterName,
      die: `d${selectedDie}`,
      result,
      modifier: totalMod,
      total,
      dc,
      success,
    })
  }

  return (
    <div className="rounded border border-amber-800 bg-zinc-800 p-3 space-y-3">
      <span className="text-xs font-bold text-amber-400">DICE ROLLER</span>
      <div className="flex flex-wrap gap-1">
        {DICE.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDie(d)}
            className={`rounded px-2 py-1 text-sm font-bold ${selectedDie === d ? 'bg-amber-700 text-white' : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}`}
          >
            d{d}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-zinc-400">Modifier</label>
          <input
            type="number"
            value={extraMod}
            onChange={e => setExtraMod(Number(e.target.value))}
            className="w-full rounded bg-zinc-700 px-2 py-1 text-sm text-white"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-zinc-400">DC</label>
          <input
            type="number"
            value={dc}
            onChange={e => setDc(Number(e.target.value))}
            className="w-full rounded bg-zinc-700 px-2 py-1 text-sm text-white"
          />
        </div>
      </div>
      <button
        onClick={roll}
        className="w-full rounded bg-amber-700 py-2 font-bold text-white hover:bg-amber-600"
      >
        🎲 Roll d{selectedDie}
      </button>
      {lastResult && (
        <div className={`rounded p-2 text-center ${lastResult.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          <span className="text-lg font-bold">{lastResult.total}</span>
          <span className="ml-2 text-sm">(roll: {lastResult.roll}) vs DC {dc}</span>
          <span className="ml-2 font-bold">{lastResult.success ? '✓ SUCESSO' : '✗ FALHOU'}</span>
        </div>
      )}
    </div>
  )
}
