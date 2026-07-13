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
  /** Short label shown in the sidebar timeline. */
  label: string
  /** Descriptive heading shown atop the main content. */
  title: string
  /** One-line subtitle beneath the heading. */
  subtitle: string
}

const ALL_STEPS: StepDef[] = [
  { id: 'ancestry',  label: 'Quem És Tu?',        title: 'Quem És Tu?',          subtitle: 'Teu nome e teu sangue — o princípio de toda lenda.' },
  { id: 'class',     label: 'Escolha a Vocação',  title: 'Escolha Tua Vocação',  subtitle: 'Tua classe define como lutas, conjuras e contas a história do teu herói.' },
  { id: 'stats',     label: 'Forja os Atributos', title: 'Forja Teus Atributos', subtitle: 'Corpo e espírito revelados pela sorte do dado.' },
  { id: 'hp',        label: 'A Chama Vital',       title: 'A Chama Vital',        subtitle: 'A vitalidade que resiste às trevas.' },
  { id: 'origin',    label: 'Domínio & Fé',        title: 'Domínio & Fé',         subtitle: 'De qual sombra tu emergiste — e no que ainda acreditas.' },
  { id: 'equipment', label: 'Pertences',          title: 'Pertences Iniciais',   subtitle: 'O que carregas quando partes rumo ao desconhecido.' },
  { id: 'spells',    label: 'O Arcano',           title: 'O Arcano',             subtitle: 'As palavras proibidas que habitam teu grimório.' },
  { id: 'narrative', label: 'A Narrativa',        title: 'Tua Narrativa',        subtitle: 'A história que nenhum arquivo pode apagar.' },
  { id: 'review',    label: 'Revise o Herói',     title: 'Revise Teu Herói',     subtitle: 'O selo final na ficha do viajante.' },
]

function Flame({ size = 13, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size * 1.14} viewBox="0 0 12 14" fill="none" aria-hidden>
      <path
        d="M6 0.4C6.6 3 9 4.1 9 7.6C9 10.2 7.7 12 6 12C4.3 12 3 10.3 3 8.3C3 6.8 3.9 6 4.5 5.4C4.6 6.7 5.1 7.4 5.8 7.4C6.5 7.4 6.7 6.4 6.4 5.4C6.1 4.4 5.4 3.3 6 0.4Z"
        fill={color}
      />
    </svg>
  )
}

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: `
        radial-gradient(130% 80% at 50% -12%, rgba(74,40,14,0.30) 0%, transparent 58%),
        radial-gradient(90% 70% at 100% 110%, rgba(48,24,8,0.22) 0%, transparent 70%),
        radial-gradient(70% 60% at 0% 100%, rgba(30,16,8,0.20) 0%, transparent 70%),
        var(--ink-black)`,
    }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <header style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: `calc(16px + var(--safe-top)) 24px 14px`,
        borderBottom: '1px solid rgba(139,112,48,0.14)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--candle-amber)', opacity: 0.75 }}>
          <Flame size={12} />
        </span>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.34em',
          textTransform: 'uppercase',
          color: 'var(--parchment-light)',
          textAlign: 'center',
          paddingLeft: '0.34em',
        }}>
          Forjar um Herói
        </h1>
        <div style={{ justifySelf: 'end' }}>
          <Link
            href="/home"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--bone-muted)',
              textDecoration: 'none',
              transition: 'color 200ms',
              minHeight: 44,
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--parchment-light)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--bone-muted)' }}
          >
            Sair
          </Link>
        </div>
      </header>

      {/* ── Two-column shell ────────────────────────────────── */}
      <div className="creator-shell">

        {/* ── Sidebar stepper ──────────────────────────────── */}
        <aside className="creator-sidebar" style={{ padding: '48px 28px 40px 40px' }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 9,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--bone-muted)',
            marginBottom: 26,
            opacity: 0.7,
          }}>
            A Forja
          </div>

          <nav>
            {steps.map((s, i) => {
              const state = i < stepIdx ? 'done' : i === stepIdx ? 'current' : 'todo'
              const clickable = i < stepIdx
              const isFirst = i === 0
              const isLastItem = i === steps.length - 1

              const nodeColor =
                state === 'current' ? 'var(--candle-glow)'
                  : state === 'done' ? 'var(--gold-oxidized)'
                    : 'rgba(139,112,48,0.28)'

              const labelColor =
                state === 'current' ? 'var(--parchment-pale)'
                  : state === 'done' ? 'var(--parchment-light)'
                    : '#5A4A2E'

              return (
                <button
                  key={s.id}
                  onClick={() => { if (clickable) setStepIdx(i) }}
                  disabled={!clickable}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr',
                    gap: 14,
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    textAlign: 'left',
                    cursor: clickable ? 'pointer' : 'default',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {/* Node + connector column */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    alignSelf: 'stretch',
                  }}>
                    {/* connector above */}
                    <div style={{
                      width: 1.5,
                      flex: '0 0 14px',
                      background: isFirst ? 'transparent' : (state === 'todo' ? 'rgba(139,112,48,0.15)' : 'var(--gold-oxidized)'),
                    }} />
                    {/* node */}
                    <div
                      className={state === 'current' ? 'animate-flicker' : undefined}
                      style={{
                        width: state === 'todo' ? 10 : 26,
                        height: state === 'todo' ? 10 : 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        color: nodeColor,
                        background: state === 'current' ? 'radial-gradient(circle, rgba(196,120,42,0.28), rgba(196,120,42,0.05))'
                          : state === 'todo' ? 'rgba(139,112,48,0.14)' : 'rgba(139,112,48,0.06)',
                        border: state === 'todo' ? 'none' : `1.5px solid ${state === 'current' ? 'rgba(224,160,64,0.7)' : 'rgba(139,112,48,0.45)'}`,
                        boxShadow: state === 'current' ? 'var(--glow-candle)' : 'none',
                        transition: 'all 300ms var(--ease-ritual)',
                      }}
                    >
                      {state !== 'todo' && <Flame size={11} />}
                    </div>
                    {/* connector below */}
                    <div style={{
                      width: 1.5,
                      flex: '1 0 14px',
                      background: isLastItem ? 'transparent' : (i < stepIdx ? 'var(--gold-oxidized)' : 'rgba(139,112,48,0.15)'),
                    }} />
                  </div>

                  {/* Label column */}
                  <div style={{ paddingTop: 10, paddingBottom: 10, minWidth: 0 }}>
                    {state === 'current' && (
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 8,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: 'var(--candle-amber)',
                        marginBottom: 4,
                      }}>
                        Forjando {stepIdx + 1} de {totalSteps}
                      </div>
                    )}
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: state === 'current' ? 14 : 12,
                      fontWeight: state === 'current' ? 600 : 500,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: labelColor,
                      lineHeight: 1.3,
                      transition: 'color 300ms',
                    }}>
                      {s.label}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* ── Main content ─────────────────────────────────── */}
        <main className="creator-main" style={{ padding: '40px 28px 140px' }}>
          <div className="creator-content" style={{ margin: '0 auto' }}>

            {/* Mobile step indicator (sidebar hidden < 900px) */}
            <div className="creator-mobile-steps" style={{
              flexDirection: 'column',
              gap: 10,
              marginBottom: 22,
            }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {steps.map((s, i) => (
                  <span
                    key={s.id}
                    style={{
                      height: 3,
                      flex: 1,
                      borderRadius: 2,
                      background: i < stepIdx ? 'var(--gold-oxidized)'
                        : i === stepIdx ? 'var(--candle-amber)'
                          : 'rgba(139,112,48,0.14)',
                      boxShadow: i === stepIdx ? '0 0 8px rgba(196,120,42,0.5)' : 'none',
                      transition: 'all 300ms var(--ease-ritual)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step header */}
            <div key={current.id} className="animate-mist-rise">
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--candle-amber)',
                marginBottom: 12,
              }}>
                Passo {stepIdx + 1} de {totalSteps}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 5vw, 40px)',
                fontWeight: 700,
                color: 'var(--parchment-pale)',
                letterSpacing: '0.03em',
                lineHeight: 1.02,
                textTransform: 'uppercase',
                marginBottom: 12,
              }}>
                {current.title}
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--bone-muted)',
                letterSpacing: '0.01em',
                maxWidth: 620,
                lineHeight: 1.5,
              }}>
                {current.subtitle}
              </p>
            </div>

            {/* Rule */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '26px 0 28px',
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(139,112,48,0.16)' }} />
              <span style={{ color: 'var(--candle-amber)', opacity: 0.5, display: 'flex' }}>
                <Flame size={10} />
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(139,112,48,0.16)' }} />
            </div>

            {/* Step content */}
            <div key={`content-${current.id}`} className="animate-ink-spread">
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
          </div>
        </main>
      </div>

      {/* ── Bottom navigation bar ───────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(8,5,3,0.94)',
        borderTop: '1px solid rgba(139,112,48,0.16)',
        padding: `16px 28px calc(16px + var(--safe-bottom))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        {/* Back */}
        <button
          onClick={prev}
          disabled={stepIdx === 0}
          className="tactile"
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 8px',
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: stepIdx === 0 ? '#3A2E18' : 'var(--bone-muted)',
            cursor: stepIdx === 0 ? 'default' : 'pointer',
            transition: 'color 200ms',
            opacity: stepIdx === 0 ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (stepIdx > 0) e.currentTarget.style.color = 'var(--parchment-light)' }}
          onMouseLeave={e => { if (stepIdx > 0) e.currentTarget.style.color = 'var(--bone-muted)' }}
        >
          ← Voltar
        </button>

        {/* Character summary (center, ≥560px) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          flex: 1,
          justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            color: name ? 'var(--parchment-light)' : '#3A2E18',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 160,
          }}>
            {name || 'Sem nome'}
          </span>
          <span style={{ color: 'rgba(139,112,48,0.3)', fontSize: 10 }}>·</span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--bone-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {ancestry?.name ?? ancestryId} · {cls?.name ?? classId}
            {hpMax > 0 && ` · ${hpMax} HP`}
          </span>
        </div>

        {/* Next / Seal */}
        {!isLast ? (
          <button
            onClick={next}
            disabled={!canNext()}
            className="tactile"
            style={{
              background: canNext()
                ? 'linear-gradient(180deg, var(--candle-glow), var(--candle-amber))'
                : 'rgba(139,112,48,0.1)',
              border: `1px solid ${canNext() ? 'rgba(224,160,64,0.6)' : 'rgba(139,112,48,0.15)'}`,
              borderRadius: 4,
              padding: '12px 28px',
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: canNext() ? 'var(--ink-black)' : 'var(--bone-muted)',
              cursor: canNext() ? 'pointer' : 'not-allowed',
              transition: 'all 200ms',
              boxShadow: canNext() ? '0 0 16px rgba(196,120,42,0.35)' : 'none',
            }}
          >
            Próximo →
          </button>
        ) : (
          <button
            onClick={save}
            disabled={saving}
            className="tactile"
            style={{
              background: saving
                ? 'rgba(42,80,69,0.2)'
                : 'linear-gradient(180deg, var(--verdigris-bright), var(--verdigris))',
              border: `1px solid ${saving ? 'rgba(61,112,96,0.25)' : 'rgba(79,169,140,0.6)'}`,
              borderRadius: 4,
              padding: '12px 28px',
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: saving ? 'var(--bone-muted)' : 'var(--ink-black)',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 200ms',
              boxShadow: saving ? 'none' : '0 0 16px rgba(61,112,96,0.35)',
            }}
          >
            {saving ? '⟳ Registrando...' : '✦ Selar o Registro'}
          </button>
        )}
      </div>
    </div>
  )
}
