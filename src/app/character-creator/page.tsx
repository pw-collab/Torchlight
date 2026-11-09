'use client'

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { StepStats, type StatRoll } from '@/components/creator/StepStats'
import { StepClass } from '@/components/creator/StepClass'
import { StepArchetype } from '@/components/creator/StepArchetype'
import { StepOrigin } from '@/components/creator/StepOrigin'
import { StepHP } from '@/components/creator/StepHP'
import { StepTalents } from '@/components/creator/StepTalents'
import { StepEquipment } from '@/components/creator/StepEquipment'
import { StepSpells } from '@/components/creator/StepSpells'
import { StepNarrative } from '@/components/creator/StepNarrative'
import { StepReview } from '@/components/creator/StepReview'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getArchetype, getArchetypesForClass } from '@/data/archetypes/index'
import { armorClassFor, kitToInventoryItem, startingGearItems } from '@/lib/inventory'
import type { Stat } from '@/types/class.types'
import type { BackgroundDetails, CharacterRow, Impulses, KnowledgeArea, Relations } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { LevelEntry } from '@/types/progression.types'
import type { Talent } from '@/types/talent.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { discordIdOf } from '@/lib/discordId'
import { applyEffects, talentTotals } from '@/lib/talents'
import { blankDraft, clearDraft, readDraft, writeDraft, type CreatorDraft } from '@/lib/creatorDraft'

/** The creation chapters, in the order the rulebook lays them out. */
type StepId =
  | 'stats' | 'class' | 'archetype' | 'origin' | 'hp'
  | 'talents' | 'equipment' | 'spells' | 'narrative' | 'review'

interface StepDef {
  id: StepId
  /** Section number from the creation chapter. */
  chapter: string
  /** Short label for the tab strip. */
  label: string
  title: string
  flavor: string
}

const ALL_STEPS: StepDef[] = [
  { id: 'stats',     chapter: '1.1', label: 'Atributos',  title: 'Atributos',       flavor: 'Corpo e espírito revelados pela sorte do dado.' },
  { id: 'class',     chapter: '1.2', label: 'Classe',     title: 'Escolha uma Classe', flavor: 'A vocação que define como você luta, conjura e sobrevive.' },
  { id: 'archetype', chapter: '1.3', label: 'Arquétipo',  title: 'Escolha um Arquétipo', flavor: 'O tipo de pessoa que você é, antes das habilidades.' },
  { id: 'origin',    chapter: '2',   label: 'Origem',     title: 'Origem',          flavor: 'De qual sombra você emergiu — e no que ainda acredita.' },
  { id: 'hp',        chapter: '3',   label: 'Vida',       title: 'Pontos de Vida',  flavor: 'A vitalidade que resiste às trevas.' },
  { id: 'talents',   chapter: '4',   label: 'Talentos',   title: 'Talentos',        flavor: 'As habilidades especiais que o destino concede.' },
  { id: 'equipment', chapter: '5',   label: 'Pertences',  title: 'Equipamento',     flavor: 'O que você carrega ao partir rumo ao desconhecido.' },
  { id: 'spells',    chapter: '6',   label: 'Magias',     title: 'Spellcasting',    flavor: 'As palavras proibidas que habitam seu grimório.' },
  { id: 'narrative', chapter: '7',   label: 'Narrativa',  title: 'Sua Narrativa',   flavor: 'A história que nenhum arquivo pode apagar.' },
  { id: 'review',    chapter: '8',   label: 'Revisão',    title: 'Revise seu Herói', flavor: 'O selo final na ficha do viajante.' },
]

/** The talent roll owed at level 1 — plus the human's extra. */
function talentBudgetFor(ancestryId: string): number {
  return ancestryId === 'human' ? 2 : 1
}

interface TalentRollRecord {
  roll: number
  die1: number
  die2: number
  effect: string
}

const noSubscribe = () => () => {}

/**
 * The server has no storage, so it renders a blank form; once hydrated, the
 * form is mounted again from the stored draft. The remount is the point: the
 * fields start from the draft instead of being patched into it afterwards.
 */
export default function CharacterCreatorPage() {
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false)
  const draft = useMemo(() => (hydrated ? readDraft() : null), [hydrated])
  return <CreatorForm key={hydrated ? 'client' : 'server'} draft={draft} persist={hydrated} />
}

function CreatorForm({ draft, persist }: { draft: CreatorDraft | null; persist: boolean }) {
  const router = useRouter()
  const start = draft ?? blankDraft()
  const [tab, setTab] = useState<StepId>(start.tab as StepId)

  // Identity
  const [name, setName] = useState(start.name)
  const [classId, setClassId] = useState(start.classId)
  const [archetypeId, setArchetypeId] = useState(start.archetypeId)
  const [ancestryId, setAncestryId] = useState(start.ancestryId)

  // Attributes & vitality
  const [statRolls, setStatRolls] = useState<StatRoll[]>(start.statRolls)
  const [stats, setStats] = useState<Record<Stat, number>>(start.stats)
  const [hpMax, setHpMax] = useState(start.hpMax)

  // Origin
  const [domainId, setDomainId] = useState(start.domainId)
  const [languages, setLanguages] = useState<string[]>(start.languages)
  const [faith, setFaith] = useState(start.faith)

  // Talents, gear, spells
  const [talents, setTalents] = useState<Talent[]>(start.talents)
  const [talentRolls, setTalentRolls] = useState<Record<string, TalentRollRecord>>(start.talentRolls)
  const [extraItems, setExtraItems] = useState<InventoryItem[]>(start.extraItems)
  const [knowledgeAreas, setKnowledgeAreas] = useState<KnowledgeArea[]>(start.knowledgeAreas)
  const [spells, setSpells] = useState<string[]>(start.spells)

  // Narrative
  const [backgroundDetails, setBackgroundDetails] = useState<BackgroundDetails>(start.backgroundDetails)
  const [relations, setRelations] = useState<Relations>(start.relations)
  const [impulses, setImpulses] = useState<Impulses>(start.impulses)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Draft ────────────────────────────────────────────────────────────────
  /** A stored draft was put back, so the page says so and offers a way out. */
  const [resumed, setResumed] = useState(draft !== null)

  /** Puts every field back to a draft's value; "Começar do zero" passes a blank one. */
  function applyDraft(d: CreatorDraft) {
    setTab(d.tab as StepId)
    setName(d.name)
    setClassId(d.classId)
    setArchetypeId(d.archetypeId)
    setAncestryId(d.ancestryId)
    setStatRolls(d.statRolls)
    setStats(d.stats)
    setHpMax(d.hpMax)
    setDomainId(d.domainId)
    setLanguages(d.languages)
    setFaith(d.faith)
    setTalents(d.talents)
    setTalentRolls(d.talentRolls)
    setExtraItems(d.extraItems)
    setKnowledgeAreas(d.knowledgeAreas)
    setSpells(d.spells)
    setBackgroundDetails(d.backgroundDetails)
    setRelations(d.relations)
    setImpulses(d.impulses)
  }

  // The blank form the server rendered must not write: it would erase the
  // draft before the hydrated one could read it.
  useEffect(() => {
    if (!persist) return
    writeDraft({
      v: 1, tab, name, classId, archetypeId, ancestryId, statRolls, stats, hpMax,
      domainId, languages, faith, talents, talentRolls, extraItems, knowledgeAreas,
      spells, backgroundDetails, relations, impulses,
    })
  }, [tab, name, classId, archetypeId, ancestryId, statRolls, stats, hpMax, domainId, languages,
    faith, talents, talentRolls, extraItems, knowledgeAreas, spells, backgroundDetails, relations, impulses, persist])

  function startOver() {
    clearDraft()
    applyDraft(blankDraft())
    setResumed(false)
    setSaveError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cls = getClass(classId)
  const ancestry = getAncestry(ancestryId)
  const archetype = archetypeId ? getArchetype(archetypeId) : undefined
  const hasSpells = cls?.spellcasting != null
  const talentBudget = talentBudgetFor(ancestryId)
  // What the rolled talents add on top of the rolled attributes and the gear —
  // "+2 Força" is already in the Força the character is born with.
  const withTalents = applyEffects(
    { stats, meleeBonus: 0, rangedBonus: 0, spellcastingBonus: 0, ac: 0 },
    talentTotals(talents),
  )

  const steps = useMemo(
    () => ALL_STEPS.filter(s => s.id !== 'spells' || hasSpells),
    [hasSpells],
  )
  const tabIdx = Math.max(0, steps.findIndex(s => s.id === tab))
  const current = steps[tabIdx]
  const isLast = tabIdx === steps.length - 1

  /**
   * Gear the character carries without having picked it: the class's starting
   * equipment plus the archetype's kit. Rebuilt only when one of those two
   * changes, so the rows keep their ids while the player edits other steps.
   */
  const grantedItems = useMemo<InventoryItem[]>(() => {
    const fromClass = startingGearItems(cls?.startingGear ?? [])
    const fromArchetype = (archetype?.kit ?? []).map(kitToInventoryItem)
    return [...fromClass, ...fromArchetype]
  }, [cls, archetype])

  const equipment = useMemo(() => [...grantedItems, ...extraItems], [grantedItems, extraItems])

  // ── Step gating ──────────────────────────────────────────────────────────
  /** Whether a step has everything it needs before the next one opens. */
  function isComplete(id: StepId): boolean {
    switch (id) {
      case 'stats':     return Object.values(stats).every(v => v > 0)
      case 'class':     return classId !== ''
      case 'archetype': return archetypeId !== '' || getArchetypesForClass(classId).length === 0
      case 'origin':    return ancestryId !== ''
      case 'hp':        return hpMax > 0
      // Classes whose 2d6 table is still unwritten have nothing to roll.
      case 'talents':   return (cls?.talentTable.length ?? 0) === 0
        || (talents.filter(t => t.origin === 'class').length >= talentBudget && !talents.some(t => t.pending))
      case 'narrative': return name.trim().length > 0
      default:          return true
    }
  }

  /** The furthest tab reachable right now — the first unfinished step. */
  const openIdx = useMemo(() => {
    const blocked = steps.findIndex(s => !isComplete(s.id))
    return blocked === -1 ? steps.length - 1 : blocked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, stats, classId, cls, archetypeId, ancestryId, hpMax, talents, talentBudget, name])

  const canAdvance = isComplete(current.id)

  /** Why "Próximo" is off: a disabled button alone never says what is missing. */
  function blockedHint(id: StepId): string {
    switch (id) {
      case 'stats':     return 'Role os atributos e dê um valor a cada um dos seis.'
      case 'class':     return 'Escolha uma classe para seguir.'
      case 'archetype': return 'Escolha um arquétipo para seguir.'
      case 'origin':    return 'Escolha uma ancestralidade para seguir.'
      case 'hp':        return 'Role os pontos de vida para seguir.'
      case 'talents':   return talents.some(t => t.pending)
        ? 'Faça a escolha do talento para seguir.'
        : talentBudget > 1
          ? `Role os ${talentBudget} talentos de classe para seguir.`
          : 'Role o talento de classe para seguir.'
      case 'narrative': return 'Dê um nome ao personagem para seguir.'
      default:          return ''
    }
  }

  // The tab strip scrolls on narrow screens; keep the active tab in view.
  const stripRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  useEffect(() => {
    const strip = stripRef.current
    const el = tabRefs.current[tab]
    if (!strip || !el) return
    const target = el.offsetLeft - strip.clientWidth / 2 + el.offsetWidth / 2
    strip.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [tab])

  function goToTab(target: StepId) {
    const targetIdx = steps.findIndex(s => s.id === target)
    if (targetIdx < 0 || targetIdx > Math.max(openIdx, tabIdx)) return
    setTab(target)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function next() { goToTab(steps[Math.min(steps.length - 1, tabIdx + 1)].id) }
  function prev() { goToTab(steps[Math.max(0, tabIdx - 1)].id) }

  // ── Cascading choices ────────────────────────────────────────────────────
  function handleClassChange(id: string) {
    setClassId(id)
    // Archetypes, talents and spells all hang off the class.
    setArchetypeId('')
    setTalents([])
    setTalentRolls({})
    setSpells([])
  }

  function handleAncestryChange(id: string) {
    setAncestryId(id)
    const a = getAncestry(id)
    // The home domain survives unless the new ancestry cannot come from there.
    const options = a?.domainOptions
    const stillNative = domainId !== ''
      && (!options || options.includes('*') || options.includes(domainId))
    if (!stillNative) setDomainId('')
    setLanguages(a?.fixedLanguages ?? [])
    // Losing the human's extra roll must not leave an extra talent behind.
    const budget = talentBudgetFor(id)
    setTalents(prev => {
      const classTalents = prev.filter(t => t.origin === 'class')
      if (classTalents.length <= budget) return prev
      const keep = new Set(classTalents.slice(0, budget).map(t => t.id))
      return prev.filter(t => t.origin !== 'class' || keep.has(t.id))
    })
  }

  function handleDomainChange(id: string) {
    setDomainId(id)
    setLanguages(getAncestry(ancestryId)?.fixedLanguages ?? [])
  }

  function handleTalentRolled(talentId: string, record: TalentRollRecord) {
    setTalentRolls(prev => ({ ...prev, [talentId]: record }))
  }

  /**
   * Level 1 is a talent level, so creation already resolves it. The entry lets
   * the sheet's advancement track open on level 2 instead of re-offering a
   * roll the character has already made.
   */
  function levelOneProgress(): LevelEntry[] {
    const firstRolled = talents.find(t => t.origin === 'class' && talentRolls[t.id])
    if (!firstRolled) return []
    const record = talentRolls[firstRolled.id]
    return [{
      level: 1,
      talentId: firstRolled.id,
      talentRoll: record.roll,
      talentDie1: record.die1,
      talentDie2: record.die2,
      talentEffect: record.effect,
      sealedAt: new Date().toISOString(),
    }]
  }

  async function save() {
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const discordId = discordIdOf(user)
    // The row was written without this, so `campaign_roster()` handed every
    // card an `owner_name` of null and nobody knew whose character was whose.
    // `session_id` stays out on purpose: a character outlives any one session,
    // so joining a table is its own flow (see §4.1 do plano), not a field the
    // wizard guesses at creation.
    const playerName =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      user.user_metadata?.global_name ??
      user.user_metadata?.user_name ??
      null

    // The archetype's advantage rides along as a talent so it shows on the sheet.
    const allTalents: Talent[] = archetype
      ? [...talents, {
          id: `archetype-${archetype.id}`,
          name: archetype.name,
          origin: 'general',
          description: archetype.talent ?? archetype.summary,
        }]
      : talents

    const row: Partial<CharacterRow> = {
      user_id: discordId,
      player_name: playerName,
      name: name.trim(),
      class_id: classId,
      archetype_id: archetypeId || null,
      ancestry_id: ancestryId,
      level: 1,
      str: withTalents.stats.str, dex: withTalents.stats.dex, con: withTalents.stats.con,
      int: withTalents.stats.int, wis: withTalents.stats.wis, cha: withTalents.stats.cha,
      hp_max: hpMax, hp_current: hpMax,
      ac: armorClassFor(equipment, withTalents.stats.dex) + withTalents.ac,
      melee_bonus: withTalents.meleeBonus,
      ranged_bonus: withTalents.rangedBonus,
      spellcasting_bonus: withTalents.spellcastingBonus,
      luck_tokens: 0,
      equipment,
      spells,
      talents: allTalents,
      level_progress: levelOneProgress(),
      torch_end_at: null,
      xp: 0,
      domain_id: domainId || null,
      faith: faith || null,
      languages,
      knowledge_areas: knowledgeAreas,
      background_details: backgroundDetails,
      relations,
      impulses,
    }

    const { data, error } = await supabase.from('characters').insert(row).select('id').single()

    if (data) {
      clearDraft()
      router.push(`/sheet/${data.id}`)
    } else {
      console.error(error)
      // The draft is still stored, so nothing is lost by trying again later.
      setSaveError('Não deu para selar o registro. Nada se perdeu: confira a conexão e tente de novo.')
      setSaving(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center bg-[var(--background)] px-5"
      style={{ paddingBottom: 'calc(84px + var(--safe-bottom))' }}
    >
      {/* ── Header: exit link, identity line and the chapter strip ────────── */}
      <header className="bg-background/95 sticky top-0 z-20 -mx-5 w-[calc(100%+40px)] border-b border-[var(--border)] px-5 pt-3 backdrop-blur-[6px]">
        <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/home"
              className="font-mono font-semibold flex min-h-11 items-center py-2 text-[11px] tracking-[0.12em] text-[var(--muted-foreground)] uppercase transition-colors duration-200 hover:text-[var(--foreground)]"
            >
              ← Sair
            </Link>
            <span className="font-mono truncate text-[8px] tracking-[0.1em] text-[var(--muted-foreground)]">
              FORJAR · {name || 'Sem nome'} · {cls?.name ?? 'sem classe'} · NVL 1
            </span>
          </div>

          {/* View switches, not tab panels — the same call TabRail makes on the
              sheet. A chapter stays locked until the one before it is done. */}
          <nav
            ref={stripRef}
            aria-label="Capítulos da criação"
            className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {steps.map((s, i) => {
              const isActive = s.id === tab
              const locked = i > Math.max(openIdx, tabIdx)
              return (
                <button
                  key={s.id}
                  type="button"
                  ref={el => { tabRefs.current[s.id] = el }}
                  onClick={() => goToTab(s.id)}
                  disabled={locked}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'tactile font-mono h-10 shrink-0 border px-3 text-[11px] font-extrabold tracking-[0.06em] whitespace-nowrap uppercase',
                    'transition-colors duration-150 outline-none',
                    'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-ring'
                      : 'bg-input border-input-border text-muted-foreground',
                    locked
                      ? 'cursor-not-allowed opacity-40'
                      : 'cursor-pointer hover:border-sidebar-ring hover:text-foreground',
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {resumed && (
        <div className="mt-4 flex w-full max-w-[760px] flex-wrap items-center justify-between gap-x-3 gap-y-1 border border-[var(--border)] bg-[var(--card)] px-4 py-2">
          <p className="font-body text-[12px] text-[var(--muted-foreground)] italic">
            Rascunho retomado de onde você parou.
          </p>
          <button
            type="button"
            onClick={startOver}
            className="font-mono min-h-11 text-[10px] font-semibold tracking-[0.12em] text-[var(--muted-foreground)] uppercase underline-offset-4 outline-none hover:text-[var(--foreground)] hover:underline focus-visible:ring-[3px] focus-visible:ring-[var(--ring)]/50"
          >
            Começar do zero
          </button>
        </div>
      )}

      {/* ── Chapter heading ───────────────────────────────────────────────── */}
      <div key={current.id} className="animate-mist-rise mt-6 mb-5 w-full max-w-[760px] text-center">
        <div className="font-mono font-semibold mb-2 text-[9px] tracking-[0.26em] text-[var(--muted-foreground)] uppercase opacity-60">
          ✦ {current.chapter} ✦
        </div>
        <h2 className="font-heading mb-2.5 text-[30px] leading-none font-bold tracking-[0.04em] text-[var(--foreground)]">
          {current.title}
        </h2>
        <p className="font-sans text-[12px] tracking-[0.02em] text-[var(--muted-foreground)] italic">
          {current.flavor}
        </p>
      </div>

      {/* Decorative rule */}
      <div className="mb-6 flex w-full max-w-[760px] items-center gap-2.5">
        <div className="h-px flex-1 bg-[var(--border)]" />
        <span className="font-mono text-[7px] tracking-[0.14em] text-[var(--muted-foreground)]">✦</span>
        <div className="h-px flex-1 bg-[var(--border)]" />
      </div>

      {/* ── Step content ──────────────────────────────────────────────────── */}
      <div key={`content-${current.id}`} className="animate-ink-spread w-full max-w-[760px]">
        {current.id === 'stats' && (
          <StepStats
            stats={stats}
            onChange={setStats}
            rolls={statRolls}
            onRollsChange={setStatRolls}
          />
        )}
        {current.id === 'class' && (
          <StepClass classId={classId} onChange={handleClassChange} />
        )}
        {current.id === 'archetype' && (
          <StepArchetype classId={classId} archetypeId={archetypeId} onChange={setArchetypeId} />
        )}
        {current.id === 'origin' && (
          <StepOrigin
            ancestryId={ancestryId}
            intStat={stats.int}
            domainId={domainId}
            languages={languages}
            faith={faith}
            onAncestryChange={handleAncestryChange}
            onDomainChange={handleDomainChange}
            onLanguagesChange={setLanguages}
            onFaithChange={setFaith}
          />
        )}
        {current.id === 'hp' && (
          <StepHP classId={classId} con={stats.con} hpMax={hpMax} onRoll={setHpMax} />
        )}
        {current.id === 'talents' && (
          <StepTalents
            classId={classId}
            talents={talents}
            onChange={setTalents}
            onRolled={handleTalentRolled}
            rollBudget={talentBudget}
            showIntro
          />
        )}
        {current.id === 'equipment' && (
          <StepEquipment
            classId={classId}
            str={stats.str}
            grantedItems={grantedItems}
            extraItems={extraItems}
            onExtraItemsChange={setExtraItems}
            knowledgeAreas={knowledgeAreas}
            onKnowledgeAreasChange={setKnowledgeAreas}
          />
        )}
        {current.id === 'spells' && (
          <StepSpells classId={classId} selectedSpells={spells} onChange={setSpells} level={1} />
        )}
        {current.id === 'narrative' && (
          <StepNarrative
            name={name}
            onNameChange={setName}
            hook={archetype?.hook}
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
            archetypeId={archetypeId}
            ancestryId={ancestryId}
            stats={withTalents.stats}
            hpMax={hpMax}
            domainId={domainId}
            languages={languages}
            faith={faith}
            knowledgeAreas={knowledgeAreas}
            equipment={equipment}
            talents={talents}
            spells={spells}
            backgroundDetails={backgroundDetails}
            relations={relations}
            impulses={impulses}
          />
        )}
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <div className="mt-7 flex w-full max-w-[760px] gap-2.5">
        <Button
          variant="outline"
          onClick={prev}
          disabled={tabIdx === 0}
          className={cn(
            'h-auto flex-1 border-[var(--border)] bg-transparent px-4 py-3.5',
            'text-[9px] tracking-[0.16em] text-[var(--muted-foreground)] transition-all duration-200',
            'hover:border-[var(--border)] hover:text-[var(--foreground)]',
            tabIdx === 0 && 'cursor-default opacity-40',
          )}
        >
          ← Anterior
        </Button>

        {!isLast ? (
          <Button
            variant="outline"
            onClick={next}
            disabled={!canAdvance}
            aria-describedby={canAdvance ? undefined : 'creator-blocked'}
            className={cn(
              'h-auto flex-[2] px-4 py-3.5 text-[9px] tracking-[0.16em] transition-all duration-200',
              canAdvance
                ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)] shadow-[0_0_10px_color-mix(in_oklch,var(--primary),transparent_75%)]'
                : 'cursor-not-allowed border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]',
            )}
          >
            Próximo →
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={save}
            disabled={saving}
            className={cn(
              'h-auto flex-[2] px-4 py-3.5 text-[9px] tracking-[0.2em] transition-all duration-200',
              saving
                ? 'cursor-not-allowed border-[var(--chart-2)] bg-[var(--chart-2)]/15 text-[var(--muted-foreground)]'
                : 'border-[var(--chart-2)] bg-[var(--chart-2)]/15 text-[var(--foreground)] shadow-[0_0_12px_color-mix(in_oklch,var(--chart-2),transparent_70%)]',
            )}
          >
            {saving ? '⟳ Registrando...' : '✦ Selar o Registro'}
          </Button>
        )}
      </div>
      {!isLast && !canAdvance && (
        <p id="creator-blocked" className="font-body mt-2 w-full max-w-[760px] text-right text-[12px] text-[var(--muted-foreground)] italic">
          {blockedHint(current.id)}
        </p>
      )}
      <div role="alert" className="w-full max-w-[760px]">
        {saveError && (
          <p className="font-body mt-2 border border-[var(--destructive)] bg-[var(--card)] px-4 py-2 text-[13px] text-[var(--card-foreground)]">
            {saveError}
          </p>
        )}
      </div>

      {/* ── Bottom preview strip ──────────────────────────────────────────── */}
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-10 flex items-center gap-2.5 overflow-hidden border-t border-[var(--border)] px-5 py-2 pb-[calc(8px+var(--safe-bottom))] backdrop-blur-[6px]">
        <span
          className={cn(
            'font-mono font-semibold max-w-[140px] shrink-0 truncate text-[13px] transition-colors duration-300',
            name ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
          )}
        >
          {name || 'Sem nome'}
        </span>
        <span className="shrink-0 text-[10px] text-[var(--muted-foreground)]">·</span>
        <span className="font-sans min-w-0 flex-1 truncate text-[10px] text-[var(--muted-foreground)] italic">
          {ancestry?.name ?? 'sem ancestralidade'} · {cls?.name ?? 'sem classe'}
          {archetype && ` · ${archetype.name}`}
          {hpMax > 0 && ` · ${hpMax} HP`}
        </span>
        <span className="font-mono shrink-0 text-[8px] tracking-[0.1em] text-[var(--muted-foreground)]">
          {tabIdx + 1}/{steps.length}
        </span>
      </div>
    </div>
  )
}
