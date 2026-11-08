import type { Stat } from '@/types/class.types'
import type { BackgroundDetails, Impulses, KnowledgeArea, Relations } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'
import type { StatRoll } from '@/components/creator/StepStats'

/**
 * The character creator's work in progress, kept in the browser.
 *
 * Ten chapters of dice and choices used to live only in React state, so a
 * refresh, a phone killing the tab, a slip on "← Sair" or the login bounce on
 * save threw all of it away. It is written on every change and dropped once
 * the character is sealed. Bump `v` when the shape changes: an old draft is
 * then ignored instead of half-restored.
 */
export interface CreatorDraft {
  v: 1
  tab: string
  name: string
  classId: string
  archetypeId: string
  ancestryId: string
  statRolls: StatRoll[]
  stats: Record<Stat, number>
  hpMax: number
  domainId: string
  languages: string[]
  faith: string
  talents: Talent[]
  talentRolls: Record<string, { roll: number; die1: number; die2: number; effect: string }>
  extraItems: InventoryItem[]
  knowledgeAreas: KnowledgeArea[]
  spells: string[]
  backgroundDetails: BackgroundDetails
  relations: Relations
  impulses: Impulses
}

export const DRAFT_KEY = 'torchlight:creator-draft'

export function blankDraft(): CreatorDraft {
  return {
    v: 1,
    tab: 'stats',
    name: '',
    classId: '',
    archetypeId: '',
    ancestryId: '',
    statRolls: [],
    stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    hpMax: 0,
    domainId: '',
    languages: [],
    faith: '',
    talents: [],
    talentRolls: {},
    extraItems: [],
    knowledgeAreas: [],
    spells: [],
    backgroundDetails: { facts: [] },
    relations: { people: [], institutions: [] },
    impulses: { objectives: [], secrets: [], flaws: [], fears: [] },
  }
}

/** Nothing chosen yet: not worth keeping, and not worth a "resumed" banner. */
export function isBlank(d: CreatorDraft): boolean {
  return (
    d.statRolls.length === 0 &&
    Object.values(d.stats).every(v => v === 0) &&
    !d.name.trim() && !d.classId && !d.ancestryId
  )
}

/**
 * A stored draft, or null when there is none, it is from another version, or
 * it is not ours to read. Missing fields fall back to blank ones, so a draft
 * saved before a field existed still opens.
 */
export function parseDraft(raw: string | null): CreatorDraft | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<CreatorDraft> | null
    if (!data || typeof data !== 'object' || data.v !== 1) return null
    const draft = { ...blankDraft(), ...data, v: 1 as const }
    return isBlank(draft) ? null : draft
  } catch {
    return null
  }
}

// Storage can be missing or throw (private mode, blocked site data, quota):
// the creator must keep working without it.

export function readDraft(): CreatorDraft | null {
  try {
    return parseDraft(window.localStorage.getItem(DRAFT_KEY))
  } catch {
    return null
  }
}

export function writeDraft(draft: CreatorDraft): void {
  try {
    if (isBlank(draft)) window.localStorage.removeItem(DRAFT_KEY)
    else window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* no storage: the draft just isn't kept */
  }
}

export function clearDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* nothing to clear */
  }
}
