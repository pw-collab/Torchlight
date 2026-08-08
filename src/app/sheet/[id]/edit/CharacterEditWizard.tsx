'use client'

import { useEffect, useRef, useState } from 'react'
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
import { ProgressionPanel, type ProgressionCommit } from '@/components/progression/ProgressionPanel'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import type { Character, CharacterRow, KnowledgeArea } from '@/types/character.types'
import type { LevelEntry } from '@/types/progression.types'
import type { Stat } from '@/types/class.types'
import type { Talent } from '@/types/talent.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StepId = 'ancestry' | 'class' | 'stats' | 'hp' | 'origin' | 'equipment' | 'talents' | 'spells' | 'narrative' | 'review'
/** The advancement track is the landing tab; every other tab is an editing step. */
type TabId = 'progress' | StepId

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

const PROGRESS_LABEL = 'Progresso'

interface Props {
  character: Character
}

export function CharacterEditWizard({ character }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('progress')

  // — State initialized from existing character —
  const [name, setName]             = useState(character.name)
  const [ancestryId, setAncestryId] = useState(character.ancestryId)
  const [classId, setClassId]       = useState(character.classId)
  const [stats, setStats]           = useState<Record<Stat, number>>(character.stats)
  const [hpMax, setHpMax]           = useState(character.hpMax)
  const [hpCurrent, setHpCurrent]   = useState(character.hpCurrent)
  const [level, setLevel]           = useState(character.level)
  const [levelProgress, setLevelProgress] = useState<LevelEntry[]>(character.levelProgress)
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
  const tabs: { id: TabId; label: string }[] = [
    { id: 'progress', label: PROGRESS_LABEL },
    ...steps.map(s => ({ id: s.id as TabId, label: s.title })),
  ]
  const tabIdx  = Math.max(0, tabs.findIndex(t => t.id === tab))
  const current = steps.find(s => s.id === tab)
  const isProgress = tab === 'progress'
  const isLast  = tabIdx === tabs.length - 1

  // The tab strip scrolls on narrow screens; keep the active tab reachable
  // after Próximo/Anterior moves the selection off-screen.
  const stripRef = useRef<HTMLDivElement>(null)
  const tabRefs  = useRef<Record<string, HTMLButtonElement | null>>({})
  useEffect(() => {
    const strip = stripRef.current
    const el = tabRefs.current[tab]
    if (!strip || !el) return
    const target = el.offsetLeft - strip.clientWidth / 2 + el.offsetWidth / 2
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [tab])

  function canNext(): boolean {
    if (tab === 'ancestry') return name.trim().length > 0
    if (tab === 'stats')    return Object.values(stats).every(v => v > 0)
    if (tab === 'hp')       return hpMax > 0
    return true
  }

  function patchForStep(stepId: TabId): Partial<CharacterRow> {
    switch (stepId) {
      case 'ancestry':  return { name: name.trim(), ancestry_id: ancestryId } as Partial<CharacterRow>
      case 'class':     return { class_id: classId } as Partial<CharacterRow>
      case 'stats':     return { str: stats.str, dex: stats.dex, con: stats.con, int: stats.int, wis: stats.wis, cha: stats.cha } as Partial<CharacterRow>
      case 'hp':        return { hp_max: hpMax, hp_current: Math.min(hpCurrent, hpMax) } as Partial<CharacterRow>
      case 'origin':    return { domain_id: domainId || null, languages, faith: faith || null } as Partial<CharacterRow>
      case 'equipment': return { knowledge_areas: knowledgeAreas } as Partial<CharacterRow>
      case 'talents':   return { talents: localTalents } as Partial<CharacterRow>
      case 'spells':    return { spells } as Partial<CharacterRow>
      case 'narrative': return { background_details: backgroundDetails, relations, impulses } as Partial<CharacterRow>
      // 'progress' writes through commitProgression as each level resolves.
      default: return {}
    }
  }

  async function saveStep(stepId: TabId) {
    const patch = patchForStep(stepId)
    if (Object.keys(patch).length === 0) return
    const supabase = createClient()
    await supabase.from('characters').update(patch).eq('id', character.id)
  }

  async function goToTab(target: TabId) {
    if (target === tab) return
    const targetIdx = tabs.findIndex(t => t.id === target)
    if (!canNext() && targetIdx > tabIdx) return
    setStepSaving(true)
    await saveStep(tab)
    setStepSaving(false)
    setTab(target)
  }

  async function next() { await goToTab(tabs[Math.min(tabs.length - 1, tabIdx + 1)].id) }
  async function prev() { await goToTab(tabs[Math.max(0, tabIdx - 1)].id) }

  /**
   * The Progresso tab applies each level as soon as it is rolled — HP onto the
   * maximum, talents onto the list — so it writes straight through instead of
   * waiting for a tab change.
   */
  async function commitProgression(patch: ProgressionCommit) {
    const row: Partial<CharacterRow> = {}

    if (patch.level !== undefined) {
      setLevel(patch.level)
      row.level = patch.level
    }
    if (patch.hpMax !== undefined) {
      const gain = patch.hpGain ?? 0
      // A level's HP raises the pool the character is walking around with, not
      // just the ceiling; undoing only pulls the ceiling back down.
      const nextCurrent = Math.min(patch.hpMax, gain > 0 ? hpCurrent + gain : hpCurrent)
      setHpMax(patch.hpMax)
      setHpCurrent(nextCurrent)
      row.hp_max = patch.hpMax
      row.hp_current = nextCurrent
    }
    if (patch.talents !== undefined) {
      setLocalTalents(patch.talents)
      row.talents = patch.talents
    }
    if (patch.levelProgress !== undefined) {
      setLevelProgress(patch.levelProgress)
      row.level_progress = patch.levelProgress
    }

    if (Object.keys(row).length === 0) return
    const supabase = createClient()
    await supabase.from('characters').update(row).eq('id', character.id)
  }

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
      level,
      hp_max: hpMax,
      hp_current: Math.min(hpCurrent, hpMax),
      domain_id: domainId || null,
      faith: faith || null,
      languages,
      knowledge_areas: knowledgeAreas,
      talents: localTalents,
      level_progress: levelProgress,
      spells,
      background_details: backgroundDetails,
      relations,
      impulses,
    } as Partial<CharacterRow>).eq('id', character.id)
    router.push(`/sheet/${character.id}`)
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center bg-[var(--ink-black)] px-5"
      style={{ paddingBottom: isProgress ? 'calc(172px + var(--safe-bottom))' : 'calc(80px + var(--safe-bottom))' }}
    >
      {/* ── Header: back link, identity line and the tab strip ────────── */}
      <header className="bg-background/95 sticky top-0 z-20 -mx-5 w-[calc(100%+40px)] border-b border-[var(--border)] px-5 pt-3 backdrop-blur-[6px]">
        <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/sheet/${character.id}`}
              className="font-heading flex min-h-11 items-center py-2 text-[11px] tracking-[0.12em] text-[var(--bone-muted)] uppercase transition-colors duration-200 hover:text-[var(--parchment-light)]"
            >
              ← Voltar à ficha
            </Link>
            <span className="font-mono truncate text-[8px] tracking-[0.1em] text-[var(--muted-foreground)]">
              EDITAR · {name || 'Sem nome'} · NVL {level}
            </span>
          </div>

          {/* Plain buttons rather than the Tabs primitive: the content lives in
              the page body, so each label is a view switch, not a tab labelling
              a panel — the same call TabRail makes on the sheet. */}
          <nav
            ref={stripRef}
            aria-label="Seções da edição"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map(t => {
              const isActive = t.id === tab
              return (
                <button
                  key={t.id}
                  type="button"
                  ref={el => { tabRefs.current[t.id] = el }}
                  onClick={() => goToTab(t.id)}
                  disabled={stepSaving}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'tactile font-heading h-10 shrink-0 cursor-pointer border px-3 text-[11px] font-extrabold tracking-[0.06em] whitespace-nowrap uppercase',
                    'transition-colors duration-150 outline-none',
                    'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    isActive
                      ? 'bg-destructive text-background border-[var(--bone-dim)]'
                      : 'bg-secondary border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--bone-dim)] hover:text-[var(--bone-dim)]',
                    stepSaving && 'cursor-wait opacity-50',
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {isProgress ? (
        /* The card sits in the middle of whatever height the track leaves over. */
        <div className="flex w-full max-w-[900px] flex-1 py-6">
          <ProgressionPanel
            classId={classId}
            level={level}
            xp={character.xp}
            con={stats.con}
            hpMax={hpMax}
            talents={localTalents}
            levelProgress={levelProgress}
            onCommit={commitProgression}
          />
        </div>
      ) : current ? (
        <>
          {/* Chapter heading */}
          <div className="mt-6 mb-5 w-full max-w-[640px] text-center">
            <div className="font-heading mb-2 text-[9px] tracking-[0.26em] text-[var(--candle-amber)] uppercase opacity-60">
              ✦ {current.chapter} ✦
            </div>
            <h2 className="font-heading mb-2.5 text-[30px] leading-none font-bold tracking-[0.04em] text-[var(--parchment-pale)]">
              {current.title}
            </h2>
            <p className="font-sans text-[12px] tracking-[0.02em] text-[var(--bone-muted)] italic">
              {current.flavor}
            </p>
          </div>

          {/* Decorative rule */}
          <div className="mb-6 flex w-full max-w-[640px] items-center gap-2.5">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="font-mono text-[7px] tracking-[0.14em] text-[var(--muted-foreground)]">✦</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Step content */}
          <div className="w-full max-w-[640px]">
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
          <div className="mt-7 flex w-full max-w-[640px] gap-2.5">
            <Button
              variant="outline"
              onClick={prev}
              disabled={stepSaving}
              className={cn(
                'h-auto flex-1 border-[var(--border)] bg-transparent px-4 py-3.5',
                'text-[9px] tracking-[0.16em] text-[var(--muted-foreground)] transition-all duration-200',
                'hover:border-[var(--border)] hover:text-[var(--parchment-light)]',
                stepSaving && 'cursor-wait opacity-50',
              )}
            >
              ← Anterior
            </Button>
            {!isLast && (
              <Button
                variant="outline"
                onClick={next}
                disabled={!canNext() || stepSaving}
                className={cn(
                  'h-auto flex-[2] px-4 py-3.5 text-[9px] tracking-[0.16em] transition-all duration-200',
                  canNext() && !stepSaving
                    ? 'border-[var(--primary)] bg-[var(--border)] text-[var(--parchment-light)] shadow-[0_0_10px_color-mix(in_oklch,var(--primary),transparent_75%)]'
                    : 'cursor-not-allowed border-[var(--border)] bg-[var(--border)]/15 text-[var(--muted-foreground)]',
                )}
              >
                {stepSaving ? '⟳ Salvando...' : 'Próximo →'}
              </Button>
            )}
            {isLast && (
              <Button
                variant="outline"
                onClick={saveAll}
                disabled={saving}
                className={cn(
                  'h-auto flex-[2] px-4 py-3.5 text-[9px] tracking-[0.2em] transition-all duration-200',
                  saving
                    ? 'cursor-not-allowed border-[var(--chart-2)] bg-[var(--chart-2)]/15 text-[var(--muted-foreground)]'
                    : 'border-[var(--chart-2)] bg-[var(--chart-2)]/15 text-[var(--foreground)] shadow-[0_0_12px_color-mix(in_oklch,var(--chart-2),transparent_70%)]',
                )}
              >
                {saving ? '⟳ Salvando...' : '✦ Selar Alterações'}
              </Button>
            )}
          </div>
        </>
      ) : null}

      {/* Bottom preview strip — the Progresso tab pins its level track here instead. */}
      {!isProgress && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-10 flex items-center gap-2.5 overflow-hidden border-t border-[var(--border)] px-5 py-2 pb-[calc(8px+var(--safe-bottom))] backdrop-blur-[6px]">
          <span
            className={cn(
              'font-heading max-w-[140px] shrink-0 truncate text-[13px] transition-colors duration-300',
              name ? 'text-[var(--parchment-light)]' : 'text-[var(--muted-foreground)]',
            )}
          >
            {name || 'Sem nome'}
          </span>
          <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">·</span>
          <span className="font-sans min-w-0 flex-1 truncate text-[10px] text-[var(--bone-muted)] italic">
            {ancestry?.name ?? ancestryId} · {cls?.name ?? classId}
            {hpMax > 0 && ` · ${hpMax} HP`}
          </span>
          <span className="font-mono shrink-0 text-[8px] tracking-[0.1em] text-[var(--muted-foreground)]">
            NVL {level}
          </span>
        </div>
      )}
    </div>
  )
}
