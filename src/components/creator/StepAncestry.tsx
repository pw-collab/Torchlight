'use client'

import { ancestries } from '@/data/ancestries/index'
import type { Ancestry } from '@/types/ancestry.types'

interface Props {
  name: string
  ancestryId: string
  onNameChange: (name: string) => void
  onAncestryChange: (id: string) => void
}

export function StepAncestry({ name, ancestryId, onNameChange, onAncestryChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-amber-400 mb-1">CHARACTER NAME</label>
        <input
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Enter name..."
          className="w-full rounded bg-zinc-700 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-600"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-amber-400 mb-2">ANCESTRY</label>
        <div className="grid grid-cols-2 gap-2">
          {ancestries.map(a => (
            <button
              key={a.id}
              onClick={() => onAncestryChange(a.id)}
              className={`rounded border p-3 text-left transition-colors ${ancestryId === a.id ? 'border-amber-500 bg-amber-900' : 'border-zinc-700 bg-zinc-800 hover:border-amber-700'}`}
            >
              <p className="font-bold text-white">{a.name}</p>
              {a.traits.map(t => (
                <p key={t.name} className="text-xs text-zinc-400 mt-0.5">
                  <span className="text-amber-400">{t.name}:</span> {t.description}
                </p>
              ))}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
