'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { StepAncestry } from '@/components/creator/StepAncestry'
import { StepClass } from '@/components/creator/StepClass'
import { StepStats } from '@/components/creator/StepStats'
import { StepHP } from '@/components/creator/StepHP'
import { StepEquipment } from '@/components/creator/StepEquipment'
import { StepSpells } from '@/components/creator/StepSpells'
import { StepReview } from '@/components/creator/StepReview'
import { getClass } from '@/data/classes/index'
import { getItem } from '@/data/equipment/index'
import { modifier } from '@/lib/dice'
import type { Stat } from '@/types/class.types'

const STEP_TITLES = [
  'Nome & Ancestria',
  'Classe',
  'Atributos',
  'HP Inicial',
  'Equipamento',
  'Magias',
  'Revisão',
]

const EMPTY_STATS: Record<Stat, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }

export default function CharacterCreatorPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [ancestryId, setAncestryId] = useState('human')
  const [classId, setClassId] = useState('warrior')
  const [stats, setStats] = useState<Record<Stat, number>>(EMPTY_STATS)
  const [hpMax, setHpMax] = useState(0)
  const [spells, setSpells] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const cls = getClass(classId)
  const equipment = cls
    ? (cls.startingGear ?? []).map(id => {
        const item = getItem(id)
        return { itemId: id, slots: item?.slots ?? 1 }
      })
    : []

  const hasSpells = (cls?.spellcasting) != null
  const totalSteps = hasSpells ? 7 : 6
  const effectiveStep = !hasSpells && step >= 5 ? step + 1 : step

  function canNext(): boolean {
    if (step === 0) return name.trim().length > 0
    if (step === 2) return Object.values(stats).every(v => v > 0)
    if (step === 3) return hpMax > 0
    return true
  }

  function next() { if (step < STEP_TITLES.length - 1) setStep(s => s + 1) }
  function prev() { if (step > 0) setStep(s => s - 1) }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub

    // Determine AC from equipped armor
    const { getItem: gi } = await import('@/data/equipment/index')
    let ac = 10 + modifier(stats.dex)
    for (const e of equipment) {
      const item = gi(e.itemId)
      if (item?.type === 'armor' && item.properties) {
        const props = item.properties as { baseAC: number; dexModApplies: boolean }
        ac = props.dexModApplies ? props.baseAC + modifier(stats.dex) : props.baseAC
      }
    }

    const { data, error } = await supabase.from('characters').insert({
      user_id: discordId,
      name,
      class_id: classId,
      ancestry_id: ancestryId,
      level: 1,
      str: stats.str, dex: stats.dex, con: stats.con,
      int: stats.int, wis: stats.wis, cha: stats.cha,
      hp_max: hpMax, hp_current: hpMax,
      ac,
      luck_tokens: 0,
      equipment,
      spells,
      torch_end_at: null,
    }).select('id').single()

    if (data) router.push(`/sheet/${data.id}`)
    else { console.error(error); setSaving(false) }
  }

  return (
    <main className="mx-auto max-w-lg min-h-screen p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-amber-400">Criar Personagem</h1>
        <div className="mt-2 flex gap-1">
          {STEP_TITLES.map((_, i) => {
            const visible = hasSpells || i !== 5
            if (!visible) return null
            return (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${i === effectiveStep ? 'bg-amber-500' : i < effectiveStep ? 'bg-amber-800' : 'bg-zinc-700'}`}
              />
            )
          })}
        </div>
        <p className="mt-1 text-xs text-zinc-400">Step {step + 1} — {STEP_TITLES[step]}</p>
      </header>

      <div className="mb-6">
        {step === 0 && <StepAncestry name={name} ancestryId={ancestryId} onNameChange={setName} onAncestryChange={setAncestryId} />}
        {step === 1 && <StepClass classId={classId} onChange={id => { setClassId(id); setSpells([]) }} />}
        {step === 2 && <StepStats stats={stats} onChange={setStats} />}
        {step === 3 && <StepHP classId={classId} con={stats.con} hpMax={hpMax} onRoll={setHpMax} />}
        {step === 4 && <StepEquipment classId={classId} equipment={equipment} str={stats.str} />}
        {step === 5 && hasSpells && <StepSpells classId={classId} selectedSpells={spells} onChange={setSpells} />}
        {step === 6 && <StepReview name={name} classId={classId} ancestryId={ancestryId} stats={stats} hpMax={hpMax} equipment={equipment} spells={spells} />}
        {step === 5 && !hasSpells && <StepReview name={name} classId={classId} ancestryId={ancestryId} stats={stats} hpMax={hpMax} equipment={equipment} spells={spells} />}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={prev} className="flex-1 rounded border border-zinc-700 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
            ← Anterior
          </button>
        )}
        {step < STEP_TITLES.length - 1 && !(step === 5 && !hasSpells) && (
          <button
            onClick={next}
            disabled={!canNext()}
            className="flex-1 rounded bg-amber-700 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-40"
          >
            Próximo →
          </button>
        )}
        {(step === STEP_TITLES.length - 1 || (step === 5 && !hasSpells)) && (
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded bg-green-700 py-2 text-sm font-bold text-white hover:bg-green-600 disabled:opacity-40"
          >
            {saving ? 'Salvando...' : '✓ Criar Personagem'}
          </button>
        )}
      </div>
    </main>
  )
}
