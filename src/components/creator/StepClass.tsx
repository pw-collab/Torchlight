'use client'

import { classes } from '@/data/classes/index'

interface Props {
  classId: string
  onChange: (id: string) => void
}

export function StepClass({ classId, onChange }: Props) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-amber-400 mb-2">CLASS</label>
      {classes.map(c => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`w-full rounded border p-3 text-left transition-colors ${classId === c.id ? 'border-amber-500 bg-amber-900' : 'border-zinc-700 bg-zinc-800 hover:border-amber-700'}`}
        >
          <div className="flex items-center justify-between">
            <p className="font-bold text-white">{c.name}</p>
            <span className="text-xs text-zinc-400">d{c.hitDie} HD</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Armor: {c.armorTraining.join(', ')}</p>
          <p className="text-xs text-zinc-400">Weapons: {c.weaponTraining.join(', ')}</p>
          {c.spellcasting && (
            <p className="text-xs text-amber-400 mt-1">✨ Spellcasting ({c.spellcasting.stat.toUpperCase()})</p>
          )}
        </button>
      ))}
    </div>
  )
}
