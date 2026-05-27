'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { StepAncestry } from '@/components/creator/StepAncestry'
import { StepClass } from '@/components/creator/StepClass'
import { StepStats } from '@/components/creator/StepStats'
import { StepHP } from '@/components/creator/StepHP'
import { StepOrigin } from '@/components/creator/StepOrigin'
import { StepEquipment } from '@/components/creator/StepEquipment'
import { StepSpells } from '@/components/creator/StepSpells'
import { StepNarrative } from '@/components/creator/StepNarrative'
import { StepReview } from '@/components/creator/StepReview'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getItem } from '@/data/equipment/index'
import { modifier } from '@/lib/dice'
import type { Stat } from '@/types/class.types'
import type { KnowledgeArea } from '@/types/character.types'

const EMPTY_STATS: Record<Stat, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }

type StepId = 'ancestry' | 'class' | 'stats' | 'hp' | 'origin' | 'equipment' | 'spells' | 'narrative' | 'review'

interface StepDef {
  id: StepId
  chapter: string
  title: string
  flavor: string
}

const ALL_STEPS: StepDef[] = [
  { id: 'ancestry',  chapter: 'I',    title: 'Origem',    flavor: 'No início, apenas um nome e um sangue.' },
  { id: 'class',     chapter: 'II',   title: 'Vocação',   flavor: 'O destino escolhe antes de nós.' },
  { id: 'stats',     chapter: 'III',  title: 'Atributos', flavor: 'O corpo e o espírito revelados pelo dado.' },
  { id: 'hp',        chapter: 'IV',   title: 'Vitalidade', flavor: 'A chama que resiste às trevas.' },
  { id: 'origin',    chapter: 'V',    title: 'Domínio',   flavor: 'De qual sombra tu emergiste?' },
  { id: 'equipment', chapter: 'VI',   title: 'Pertences', flavor: 'O que carregas quando partes.' },
  { id: 'spells',    chapter: 'VII',  title: 'Arcano',    flavor: 'As palavras proibidas que habitam o grimório.' },
  { id: 'narrative', chapter: 'VIII', title: 'Narrativa', flavor: 'A história que nenhum arquivo pode apagar.' },
  { id: 'review',    chapter: 'IX',   title: 'Revisão',   flavor: 'O selo final na ficha do viajante.' },
]

export default function CharacterCreatorPage() {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)

  // Core identity
  const [name, setName] = useState('')
  const [ancestryId, setAncestryId] = useState('human')
  const [classId, setClassId] = useState('warrior')

  // Stats & HP
  const [stats, setStats] = useState<Record<Stat, number>>(EMPTY_STATS)
  const [hpMax, setHpMax] = useState(0)

  // Origin
  const [domainId, setDomainId] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [faith, setFaith] = useState('')

  // Equipment & Knowledge
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>([])

  // Spells
  const [spells, setSpells] = useState<string[]>([])

  // Narrative
  const [backgroundDetails, setBackgroundDetails] = useState<{
    concept?: string; origin?: string; backstory?: string; traumaticEvents?: string
  }>({})
  const [relations, setRelations] = useState<{
    family?: string[]; allies?: string[]; rivals?: string[]; faction?: string
  }>({})
  const [impulses, setImpulses] = useState<{
    secrets?: string; flaws?: string; fears?: string; objectives?: string
  }>({})

  const [saving, setSaving] = useState(false)

  const cls = getClass(classId)
  const ancestry = getAncestry(ancestryId)
  const hasSpells = cls?.spellcasting != null

  const steps = ALL_STEPS.filter(s => s.id !== 'spells' || hasSpells)
  const current = steps[stepIdx]
  const totalSteps = steps.length
  const isLast = stepIdx === totalSteps - 1

  function canNext(): boolean {
    if (current.id === 'ancestry') return name.trim().length > 0
    if (current.id === 'stats') return Object.values(stats).every(v => v > 0)
    if (current.id === 'hp') return hpMax > 0
    return true
  }

  function next() { if (stepIdx < totalSteps - 1) setStepIdx(i => i + 1) }
  function prev() { if (stepIdx > 0) setStepIdx(i => i - 1) }

  function handleAncestryChange(id: string) {
    setAncestryId(id)
    const a = getAncestry(id)
    setDomainId('')
    setLanguages(a?.fixedLanguages ?? [])
  }

  function handleDomainChange(id: string) {
    setDomainId(id)
    const a = getAncestry(ancestryId)
    const fixed = a?.fixedLanguages ?? []
    // Keep free langs (not in any domain pool), reset domain selections
    setLanguages(fixed)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const discordId = user.user_metadata?.provider_id ?? user.user_metadata?.sub

    const equipment = (cls?.startingGear ?? []).map(id => {
      const item = getItem(id)
      return { itemId: id, slots: item?.slots ?? 1 }
    })

    let ac = 10 + modifier(stats.dex)
    for (const e of equipment) {
      const item = getItem(e.itemId)
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
      xp: 0,
      domain_id: domainId || null,
      faith: faith || null,
      languages,
      knowledge_areas: knowledgeAreas,
      background_details: backgroundDetails,
      relations,
      impulses,
    }).select('id').single()

    if (data) router.push(`/sheet/${data.id}`)
    else { console.error(error); setSaving(false) }
  }

  const progress = totalSteps > 1 ? stepIdx / (totalSteps - 1) : 0

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink-black)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 20px 120px',
    }}>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 640, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Link
            href="/home"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bone-muted)',
              textDecoration: 'none',
              transition: 'color 200ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--parchment-light)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--bone-muted)' }}
          >
            ← Voltar
          </Link>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 7,
            color: '#3A2E18',
            letterSpacing: '0.1em',
          }}>
            ARQUIVO NOVO · CAP. {current.chapter}/{totalSteps}
          </span>
        </div>

        {/* Progress flame bar */}
        <div style={{ height: 2, background: 'rgba(139,112,48,0.1)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #4A3520, var(--candle-amber))',
            boxShadow: '0 0 8px rgba(196,120,42,0.4)',
            transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 5, marginTop: 9, justifyContent: 'center' }}>
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { if (i < stepIdx) setStepIdx(i) }}
              style={{
                width: i === stepIdx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i < stepIdx ? 'var(--gold-oxidized)' : i === stepIdx ? 'var(--candle-amber)' : 'rgba(139,112,48,0.12)',
                border: 'none',
                cursor: i < stepIdx ? 'pointer' : 'default',
                transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                boxShadow: i === stepIdx ? '0 0 8px rgba(196,120,42,0.5)' : 'none',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* Chapter heading */}
      <div style={{ width: '100%', maxWidth: 640, marginBottom: 20, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 9,
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          color: 'var(--candle-amber)',
          opacity: 0.6,
          marginBottom: 8,
        }}>
          ✦ {current.chapter} ✦
        </div>
        <h2 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 30,
          fontWeight: 700,
          color: 'var(--parchment-pale)',
          letterSpacing: '0.04em',
          lineHeight: 1,
          marginBottom: 10,
        }}>
          {current.title}
        </h2>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--bone-muted)',
          letterSpacing: '0.02em',
        }}>
          {current.flavor}
        </p>
      </div>

      {/* Rule */}
      <div style={{
        width: '100%',
        maxWidth: 640,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
      }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(139,112,48,0.14)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#3A2E18', letterSpacing: '0.14em' }}>✦</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(139,112,48,0.14)' }} />
      </div>

      {/* Step content */}
      <div style={{ width: '100%', maxWidth: 640 }}>
        {current.id === 'ancestry' && (
          <StepAncestry
            name={name}
            ancestryId={ancestryId}
            onNameChange={setName}
            onAncestryChange={handleAncestryChange}
          />
        )}
        {current.id === 'class' && (
          <StepClass
            classId={classId}
            onChange={id => { setClassId(id); setSpells([]) }}
          />
        )}
        {current.id === 'stats' && (
          <StepStats stats={stats} onChange={setStats} />
        )}
        {current.id === 'hp' && (
          <StepHP classId={classId} con={stats.con} hpMax={hpMax} onRoll={setHpMax} />
        )}
        {current.id === 'origin' && (
          <StepOrigin
            ancestryId={ancestryId}
            intStat={stats.int}
            domainId={domainId}
            languages={languages}
            faith={faith}
            onDomainChange={handleDomainChange}
            onLanguagesChange={setLanguages}
            onFaithChange={setFaith}
          />
        )}
        {current.id === 'equipment' && (
          <StepEquipment
            classId={classId}
            str={stats.str}
            knowledgeAreas={knowledgeAreas}
            onKnowledgeAreasChange={setKnowledgeAreas}
          />
        )}
        {current.id === 'spells' && (
          <StepSpells classId={classId} selectedSpells={spells} onChange={setSpells} />
        )}
        {current.id === 'narrative' && (
          <StepNarrative
            backgroundDetails={backgroundDetails}
            relations={relations}
            impulses={impulses}
            onBackgroundChange={setBackgroundDetails}
            onRelationsChange={setRelations}
            onImpulsesChange={setImpulses}
          />
        )}
        {current.id === 'review' && (
          <StepReview
            name={name}
            classId={classId}
            ancestryId={ancestryId}
            stats={stats}
            hpMax={hpMax}
            domainId={domainId}
            languages={languages}
            faith={faith}
            knowledgeAreas={knowledgeAreas}
            spells={spells}
            backgroundDetails={backgroundDetails}
            relations={relations}
            impulses={impulses}
          />
        )}
      </div>

      {/* Navigation */}
      <div style={{
        width: '100%',
        maxWidth: 640,
        display: 'flex',
        gap: 10,
        marginTop: 28,
      }}>
        {stepIdx > 0 && (
          <button
            onClick={prev}
            style={{
              flex: 1,
              background: 'none',
              border: '1px solid rgba(139,112,48,0.25)',
              borderRadius: 2,
              padding: '13px 16px',
              fontFamily: 'var(--font-heading)',
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bone-muted)',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(139,112,48,0.4)'
              e.currentTarget.style.color = 'var(--parchment-light)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(139,112,48,0.25)'
              e.currentTarget.style.color = 'var(--bone-muted)'
            }}
          >
            ← Anterior
          </button>
        )}
        {!isLast && (
          <button
            onClick={next}
            disabled={!canNext()}
            style={{
              flex: stepIdx === 0 ? 1 : 2,
              background: canNext() ? 'rgba(139,112,48,0.16)' : 'rgba(139,112,48,0.05)',
              border: `1px solid ${canNext() ? 'rgba(196,120,42,0.45)' : 'rgba(139,112,48,0.12)'}`,
              borderRadius: 2,
              padding: '13px 16px',
              fontFamily: 'var(--font-heading)',
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: canNext() ? 'var(--parchment-light)' : 'var(--bone-muted)',
              cursor: canNext() ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: canNext() ? '0 0 10px rgba(196,120,42,0.08)' : 'none',
            }}
          >
            Próximo →
          </button>
        )}
        {isLast && (
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 2,
              background: saving ? 'rgba(42,80,69,0.2)' : 'rgba(42,80,69,0.28)',
              border: `1px solid ${saving ? 'rgba(61,112,96,0.25)' : 'rgba(61,112,96,0.55)'}`,
              borderRadius: 2,
              padding: '13px 16px',
              fontFamily: 'var(--font-heading)',
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: saving ? 'var(--bone-muted)' : 'var(--verdigris-light)',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 200ms',
              boxShadow: saving ? 'none' : '0 0 12px rgba(61,112,96,0.15)',
            }}
          >
            {saving ? '⟳ Registrando...' : '✦ Selar o Registro'}
          </button>
        )}
      </div>

      {/* Character preview strip — fixed bottom bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(8,5,3,0.97)',
        borderTop: '1px solid rgba(139,112,48,0.15)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
        backdropFilter: 'blur(6px)',
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13,
          color: name ? 'var(--parchment-light)' : '#3A2E18',
          transition: 'color 300ms',
          minWidth: 80,
        }}>
          {name || 'Sem nome'}
        </span>
        <span style={{ color: 'rgba(139,112,48,0.25)', fontSize: 10 }}>·</span>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 10,
          color: 'var(--bone-muted)',
        }}>
          {ancestry?.name ?? ancestryId} · {cls?.name ?? classId}
          {hpMax > 0 && ` · ${hpMax} HP`}
          {domainId && ` · ${domainId}`}
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 7,
          color: '#3A2E18',
          letterSpacing: '0.1em',
        }}>
          NVL 1
        </span>
      </div>
    </div>
  )
}
