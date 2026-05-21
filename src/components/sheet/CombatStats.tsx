'use client'

interface Props {
  hpMax: number
  hpCurrent: number
  ac: number
  onHpChange: (newHp: number) => void
}

export function CombatStats({ hpMax, hpCurrent, ac, onHpChange }: Props) {
  const hpPercent = Math.max(0, (hpCurrent / hpMax) * 100)
  const hpColor = hpPercent > 50 ? 'bg-green-600' : hpPercent > 25 ? 'bg-yellow-600' : 'bg-red-600'

  function handleHpInput(delta: number) {
    const next = Math.min(hpMax, Math.max(0, hpCurrent + delta))
    onHpChange(next)
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 rounded border border-amber-800 bg-zinc-800 p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-400">HP</span>
          <span className="text-sm text-white">{hpCurrent} / {hpMax}</span>
        </div>
        <div className="mb-2 h-2 w-full rounded bg-zinc-700">
          <div className={`h-2 rounded transition-all ${hpColor}`} style={{ width: `${hpPercent}%` }} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleHpInput(-1)}
            className="flex-1 rounded bg-red-800 py-1 text-sm font-bold text-white hover:bg-red-700"
          >−1</button>
          <button
            onClick={() => handleHpInput(1)}
            className="flex-1 rounded bg-green-800 py-1 text-sm font-bold text-white hover:bg-green-700"
          >+1</button>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded border border-amber-800 bg-zinc-800 p-3">
        <span className="text-xs font-bold text-amber-400">AC</span>
        <span className="text-3xl font-bold text-white">{ac}</span>
      </div>
    </div>
  )
}
