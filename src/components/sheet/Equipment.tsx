'use client'

import { getItem } from '@/data/equipment/index'

interface Props {
  equipment: { itemId: string; slots: number }[]
}

export function Equipment({ equipment }: Props) {
  return (
    <div className="rounded border border-amber-800 bg-zinc-800 p-3">
      <span className="text-xs font-bold text-amber-400">EQUIPMENT</span>
      {equipment.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No items.</p>
      ) : (
        <ul className="mt-2 space-y-1">
          {equipment.map((e, i) => {
            const item = getItem(e.itemId)
            return (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-white">{item?.name ?? e.itemId}</span>
                <span className="text-zinc-400">{e.slots} slot{e.slots !== 1 ? 's' : ''}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
