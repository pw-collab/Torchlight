'use client'

import { useSlots } from '@/hooks/useSlots'

interface Props {
  str: number
  equipment: { slots: number }[]
}

export function SlotTracker({ str, equipment }: Props) {
  const { max, used, remaining, overEncumbered } = useSlots(str, equipment)

  return (
    <div className="rounded border border-amber-800 bg-zinc-800 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold text-amber-400">SLOTS</span>
        <span className={`text-sm font-semibold ${overEncumbered ? 'text-red-400' : 'text-white'}`}>
          {used} / {max}
        </span>
      </div>
      <div className="flex gap-0.5 flex-wrap">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-sm border ${i < used ? (overEncumbered ? 'border-red-500 bg-red-600' : 'border-amber-600 bg-amber-700') : 'border-zinc-600 bg-zinc-700'}`}
          />
        ))}
      </div>
      {overEncumbered && (
        <p className="mt-1 text-xs text-red-400">Overencumbered! -{remaining} slots</p>
      )}
    </div>
  )
}
