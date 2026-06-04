'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { StepAncestry } from '@/components/creator/StepAncestry'
import { StepClass } from '@/components/creator/StepClass'
import { StepStats } from '@/components/creator/StepStats'
import { StepHP } from '@/components/creator/StepHP'
import { StepOrigin } from '@/components/creator/StepOrigin'
import { StepEquipment } from '@/components/creator/StepEquipment'
import { StepTalents } from '@/components/creator/StepTalents'
import { StepSpells } from '@/components/creator/StepSpells'
import { StepNarrative } from '@/components/creator/StepNarrative'
import { StepReview } from '@/components/creator/StepReview'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import type { Character, CharacterRow, KnowledgeArea } from '@/types/character.types'
import type { Stat } from '@/types/class.types'
import type { Talent } from '@/types/talent.types'

type StepId = 'ancestry' | 'class' | 'stats' | 'hp' | 'origin' | 'equipment' | 'talents' | 'spells' | 'narrative' | 'review'

interface StepDef {
  id: StepId
  chapter: string
  title: string
  flavor: string
}

const ALL_STEPS: StepDef[] = [
  { id: 'ancestry',  chapter: 'I',   title: 'Origem',    flavor: 'O sangue que te define.' },
  { id: 'class',     chapter: 'II',  title: 'Vocação',   flavor: 'O caminho que trilhaste.' },
  { id: 'stats',     chapter: 'III', title: 'Atributos', flavor: 'A carne e o espírito, revisitados.' },
  { id: 'hp',        chapter: 'IV',  title: 'Vitalidade', flavor: 'A chama que persiste.' },
  { id: 'origin',    chapter: 'V',   title: 'Domínio',   flavor: 'As sombras de onde vieste.' },
  { id: 'equipment', chapter: 'VI',  title: 'Pertences', flavor: 'O peso que ainda carregas.' },
  { id: 'talents',   chapter: 'VII', title: 'Talentos',  flavor: 'O que o destino te concedeu.' },
  { id: 'spells',    chapter: 'VIII', title: 'Arcano',   flavor: 'As palavras que ainda sussurras.' },
  { id: 'narrative', chapter: 'IX',  title: 'Narrativa', flavor: 'A história que não pode ser apagada.' },
  { id: 'review',    chapter: 'X',   title: 'Revisão',   flavor: 'Selar as alterações no arquivo.' },
]

interface Props {
  character: Character
}

export function CharacterEditWizard({ character }: Props) {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)

  // — State initialized from existing character —
  const [name, setName]             = useState(character.name)
  const [ancestryId, setAncestryId] = useState(character.ancestryId)
  const [classId, setClassId]       = useState(character.classId)
  const [stats, setStats]           = useState<Record<Stat, number>>(character.stats)
  const [hpMax, setHpMax]           = useState(character.hpMax)
  const [domainId, setDomainId]     = useState(character.domainId ?? '')
  const [languages, setLanguages]   = useState<string[]>(character.languages)
  const [faith, setFaith]           = useState(character.faith ?? '')
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>(character.knowledgeAreas)
  const [spells, setSpells]         = useState<string[]>(character.spells)
  const [localTalents, setLocalTalents] = useState<Talent[]>(character.talents)
  const [backgroundDetails, setBackgroundDetails] = useState(character.backgroundDetails ?? {})
  const [relations, setRelations]   = useState(character.relations ?? {})
  const [impulses, setImpulses]     = useState(character.impulses ?? {})

  const [saving, setSaving]   = useState(false)
  const [stepSaving, setStepSaving] = useState(false)

  const cls      = getClass(classId)
  const ancestry = getAncestry(ancestryId)
  const hasSpells = cls?.spellcasting != null

  const steps = ALL_STEPS.filter(s => s.id !== 'spells' || hasSpells)
  const current    = steps[stepIdx]
  const totalSteps = steps.length
  const isLast     = stepIdx === totalSteps - 1
  const progress   = totalSteps > 1 ? stepIdx / (totalSteps - 1) : 0

  function canNext(): boolean {
    if (current.id === 'ancestry') return name.trim().length > 0
    if (current.id === 'stats')    return Object.values(stats).every(v => v > 0)
    if (current.id === 'hp')       return hpMax > 0
    return true
  }

  function patchForStep(stepId: string): Partial<CharacterRow> {
    switch (stepId) {
      case 'ancestry':  return { name: name.trim(), ancestry_id: ancestryId } as Partial<CharacterRow>
      case 'class':     return { class_id: classId } as Partial<CharacterRow>
      case 'stats':     return { str: stats.str, dex: stats.dex, con: stats.con, int: stats.int, wis: stats.wis, cha: stats.cha } as Partial<CharacterRow>
      case 'hp':        return { hp_max: hpMax, hp_current: Math.min(character.hpCurrent, hpMax) } as Partial<CharacterRow>
      case 'origin':    return { domain_id: domainId || null, languages, faith: faith || null } as Partial<CharacterRow>
      case 'equipment': return { knowledge_areas: knowledgeAreas } as Partial<CharacterRow>
      case 'talents':   return { talents: localTalents } as Partial<CharacterRow>
      case 'spells':    return { spells } as Partial<CharacterRow>
      case 'narrative': return { background_details: backgroundDetails, relations, impulses } as Partial<CharacterRow>
      default: return {}
    }
  }

  async function saveStep(stepId: string) {
    const patch = patchForStep(stepId)
    if (Object.keys(patch).length === 0) return
    const supabase = createClient()
    await supabase.from('characters').update(patch).eq('id', character.id)
  }

  async function goTo(targetIdx: number) {
    if (targetIdx === stepIdx) return
    if (!canNext() && targetIdx > stepIdx) return
    setStepSaving(true)
    await saveStep(current.id)
    setStepSaving(false)
    setStepIdx(targetIdx)
  }

  async function next() { await goTo(stepIdx + 1) }
  async function prev() { await goTo(stepIdx - 1) }

  function handleAncestryChange(id: string) {
    setAncestryId(id)
    const a = getAncestry(id)
    setDomainId('')
    setLanguages(a?.fixedLanguages ?? [])
  }

  function handleDomainChange(id: string) {
    setDomainId(id)
    const a = getAncestry(ancestryId)
    setLanguages(a?.fixedLanguages ?? [])
  }

  async function saveAll() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('characters').update({
      name: name.trim(),
      ancestry_id: ancestryId,
      class_id: classId,
      str: stats.str, dex: stats.dex, con: stats.con,
      int: stats.int, wis: stats.wis, cha: stats.cha,
      hp_max: hpMax,
      hp_current: Math.min(character.hpCurrent, hpMax),
      domain_id: domainId || null,
      faith: faith || null,
      languages,
      knowledge_areas: knowledgeAreas,
      talents: localTalents,
      spells,
      background_details: backgroundDetails,
      relations,
      impulses,
    } as Partial<CharacterRow>).eq('id', character.id)
    router.push(`/sheet/${character.id}`)
  }

  const dotBusy = stepSaving

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
            href={`/sheet/${character.id}`}
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
            ← Voltar à ficha
          </Link>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#3A2E18', letterSpacing: '0.1em' }}>
            EDITAR · CAP. {current.chapter}/{totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(139,112,48,0.1)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #4A3520, var(--candle-amber))',
            boxShadow: '0 0 8px rgba(196,120,42,0.4)',
            transition: 'width 500ms cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>

        {/* Step dots — all clickable */}
        <div style={{ display: 'flex', gap: 5, marginTop: 9, justifyContent: 'center' }}>
          {steps.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              disabled={dotBusy}
              title={s.title}
              style={{
                width: i === stepIdx ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === stepIdx
                  ? 'var(--candle-amber)'
                  : 'var(--gold-oxidized)',
                border: 'none',
                cursor: dotBusy ? 'wait' : 'pointer',
                transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
                boxShadow: i === stepIdx ? '0 0 8px rgba(196,120,42,0.5)' : 'none',
                flexShrink: 0,
                opacity: dotBusy ? 0.5 : 1,
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

      {/* Decorative rule */}
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
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
          <StepStats stats={stats} onChange={setStats} editMode />
        )}
        {current.id === 'hp' && (
          <StepHP classId={classId} con={stats.con} hpMax={hpMax} onRoll={setHpMax} editMode />
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
        {current.id === 'talents' && (
          <StepTalents
            classId={classId}
            talents={localTalents}
            onChange={setLocalTalents}
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
      <div style={{ width: '100%', maxWidth: 640, display: 'flex', gap: 10, marginTop: 28 }}>
        {stepIdx > 0 && (
          <button
            onClick={prev}
            disabled={stepSaving}
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
              cursor: stepSaving ? 'wait' : 'pointer',
              transition: 'all 200ms',
              opacity: stepSaving ? 0.5 : 1,
            }}
            onMouseEnter={e => {
              if (!stepSaving) {
                e.currentTarget.style.borderColor = 'rgba(139,112,48,0.4)'
                e.currentTarget.style.color = 'var(--parchment-light)'
              }
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
            disabled={!canNext() || stepSaving}
            style={{
              flex: stepIdx === 0 ? 1 : 2,
              background: canNext() && !stepSaving ? 'rgba(139,112,48,0.16)' : 'rgba(139,112,48,0.05)',
              border: `1px solid ${canNext() && !stepSaving ? 'rgba(196,120,42,0.45)' : 'rgba(139,112,48,0.12)'}`,
              borderRadius: 2,
              padding: '13px 16px',
              fontFamily: 'var(--font-heading)',
              fontSize: 9,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: canNext() && !stepSaving ? 'var(--parchment-light)' : 'var(--bone-muted)',
              cursor: canNext() && !stepSaving ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: canNext() && !stepSaving ? '0 0 10px rgba(196,120,42,0.08)' : 'none',
            }}
          >
            {stepSaving ? '⟳ Salvando...' : 'Próximo →'}
          </button>
        )}
        {isLast && (
          <button
            onClick={saveAll}
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
            {saving ? '⟳ Salvando...' : '✦ Selar Alterações'}
          </button>
        )}
      </div>

      {/* Bottom preview strip */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
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
        </span>
        <span style={{
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 7,
          color: '#3A2E18',
          letterSpacing: '0.1em',
        }}>
          NVL {character.level}
        </span>
      </div>
    </div>
  )
}
