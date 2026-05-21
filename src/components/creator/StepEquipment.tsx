'use client'

import { getItem } from '@/data/equipment/index'
import { getClass } from '@/data/classes/index'
import { useSlots } from '@/hooks/useSlots'

interface Props {
  classId: string
  equipment: { itemId: string; slots: number }[]
  str: number
}

export function StepEquipment({ classId, equipment, str }: Props) {
  const cls = getClass(classId)
  const { max, used } = useSlots(str, equipment)

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-400">Starting gear is fixed per class.</p>
      <div className="flex justify-between text-xs text-amber-400">
        <span>Slots used: {used} / {max}</span>
      </div>
      <ul className="space-y-1">
        {equipment.map((e, i) => {
          const item = getItem(e.itemId)
          return (
            <li key={i} className="flex justify-between rounded bg-zinc-800 px-3 py-2 text-sm">
              <span className="text-white">{item?.name ?? e.itemId}</span>
              <span className="text-zinc-400">{e.slots} slot{e.slots !== 1 ? 's' : ''}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
