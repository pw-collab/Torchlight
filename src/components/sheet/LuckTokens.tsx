'use client'

interface Props {
  luckTokens: number
  onChange: (newValue: number) => void
}

export function LuckTokens({ luckTokens, onChange }: Props) {
  return (
    <div className="flex items-center gap-3 rounded border border-amber-800 bg-zinc-800 p-3">
      <span className="text-xs font-bold text-amber-400">LUCK</span>
      <div className="flex gap-1">
        {Array.from({ length: Math.max(luckTokens, 5) }).map((_, i) => (
          <span
            key={i}
            className={`text-lg cursor-pointer ${i < luckTokens ? 'text-amber-400' : 'text-zinc-600'}`}
            onClick={() => onChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
          >
            🍀
          </span>
        ))}
      </div>
      <span className="ml-auto text-white font-bold">{luckTokens}</span>
    </div>
  )
}
