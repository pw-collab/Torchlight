import type { Stat } from './class.types'
import type { InventoryItem } from './inventory.types'
import type { LevelEntry } from './progression.types'
import type { Talent } from './talent.types'
import type { TechniqueState } from './technique.types'
import { getItem } from '@/data/equipment/index'

export interface KnowledgeArea {
  name: string
  bonus: number
}

export interface Character {
  id: string
  name: string
  classId: string
  /** Archetype id from the archetype catalog. Empty when none was chosen. */
  archetypeId: string
  ancestryId: string
  level: number
  xp: number
  stats: Record<Stat, number>
  hpMax: number
  hpCurrent: number
  ac: number
  luckTokens: number
  inventory: InventoryItem[]
  spells: string[]
  /**
   * Legacy single-torch clock, from before light became a per-item thing.
   * Nothing writes it and nothing reads it any more — light is derived from
   * the inventory (see `lib/light`). Kept so old rows still map cleanly.
   */
  torchEndAt: string | null
  // Extended
  gold: number
  silver: number
  copper: number
  portraitUrl: string | null
  meleeBonus: number
  rangedBonus: number
  spellcastingBonus: number
  castingAttr: string
  talents: Talent[]
  /** One record per level whose reward has been rolled — see the "Progresso" track. */
  levelProgress: LevelEntry[]
  techniqueStates: TechniqueState[]
  languages: string[]
  knowledgeAreas: KnowledgeArea[]
  domainId: string
  faith: string
  backgroundText: string
  backgroundDetails: {
    concept?: string
    origin?: string
    backstory?: string
    traumaticEvents?: string
  }
  relations: {
    family?: string
    allies?: string
    rivals?: string
    faction?: string
  }
  impulses: {
    secrets?: string
    flaws?: string
    fears?: string
    objectives?: string
  }
}

/**
 * Relations as they come out of the DB. Família, Aliados and Rivais were
 * rosters of names before they became free text, so old rows still hold
 * arrays where new ones hold a string.
 */
export interface RawRelations {
  family?: string | string[]
  allies?: string | string[]
  rivals?: string | string[]
  faction?: string
}

/** Joins a legacy roster back into text, one name per line. */
function relationText(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? value.join('\n') : value
}

export function normalizeRelations(raw: RawRelations | undefined): Character['relations'] {
  if (!raw) return {}
  return {
    family: relationText(raw.family),
    allies: relationText(raw.allies),
    rivals: relationText(raw.rivals),
    faction: raw.faction,
  }
}

// Legacy row format for equipment items coming from old DB rows
interface LegacyEquipItem { itemId: string; slots: number }
type RawEquipItem = InventoryItem | LegacyEquipItem

function isLegacy(item: RawEquipItem): item is LegacyEquipItem {
  return 'itemId' in item && !('id' in item)
}

function convertLegacyItem(leg: LegacyEquipItem): InventoryItem {
  const base = getItem(leg.itemId)
  if (!base) {
    return {
      id: leg.itemId,
      name: leg.itemId,
      description: '',
      slots: leg.slots,
      quantity: 1,
      type: 'gear',
    }
  }
  const item: InventoryItem = {
    id: base.id,
    name: base.name,
    description: '',
    slots: leg.slots,
    quantity: 1,
    type: base.type as InventoryItem['type'],
  }
  if (base.type === 'weapon' && (base as any).properties?.damage) {
    item.damageDie = (base as any).properties.damage
    item.weaponKind = 'melee'
  }
  if (base.type === 'armor' && (base as any).properties?.baseAC) {
    item.acBonus = (base as any).properties.baseAC
  }
  if (base.id === 'torch') {
    item.isLight = true
    item.lightKind = 'torch'
    item.lightMaxMinutes = 60
    item.lightMinutesLeft = 60
  }
  return item
}

export interface CharacterRow {
  id: string
  user_id: string
  session_id: string
  name: string
  class_id: string
  archetype_id?: string | null
  ancestry_id: string
  level: number
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  hp_max: number
  hp_current: number
  ac: number
  luck_tokens: number
  equipment: RawEquipItem[]
  spells: string[]
  /** Legacy — see `Character.torchEndAt`. */
  torch_end_at: string | null
  // Extended (nullable for backward compat)
  xp?: number
  gold?: number
  silver?: number
  copper?: number
  portrait_url?: string | null
  melee_bonus?: number
  ranged_bonus?: number
  spellcasting_bonus?: number
  casting_attr?: string
  talents?: Talent[]
  level_progress?: LevelEntry[]
  technique_states?: TechniqueState[]
  languages?: string[]
  knowledge_areas?: KnowledgeArea[]
  domain_id?: string | null
  faith?: string | null
  background_text?: string | null
  background_details?: Character['backgroundDetails']
  relations?: RawRelations
  impulses?: Character['impulses']
  player_name?: string | null
}

export function rowToCharacter(row: CharacterRow): Character {
  const rawEquip: RawEquipItem[] = Array.isArray(row.equipment) ? row.equipment : []
  const inventory: InventoryItem[] = rawEquip.map(item =>
    isLegacy(item) ? convertLegacyItem(item) : item
  )

  return {
    id: row.id,
    name: row.name,
    classId: row.class_id,
    archetypeId: row.archetype_id ?? '',
    ancestryId: row.ancestry_id,
    level: row.level,
    xp: row.xp ?? 0,
    stats: {
      str: row.str,
      dex: row.dex,
      con: row.con,
      int: row.int,
      wis: row.wis,
      cha: row.cha,
    },
    hpMax: row.hp_max,
    hpCurrent: row.hp_current,
    ac: row.ac,
    luckTokens: row.luck_tokens,
    inventory,
    spells: row.spells ?? [],
    torchEndAt: row.torch_end_at,
    gold: row.gold ?? 0,
    silver: row.silver ?? 0,
    copper: row.copper ?? 0,
    portraitUrl: row.portrait_url ?? null,
    meleeBonus: row.melee_bonus ?? 0,
    rangedBonus: row.ranged_bonus ?? 0,
    spellcastingBonus: row.spellcasting_bonus ?? 0,
    castingAttr: row.casting_attr ?? 'int',
    talents: row.talents ?? [],
    levelProgress: Array.isArray(row.level_progress) ? row.level_progress : [],
    techniqueStates: row.technique_states ?? [],
    languages: row.languages ?? [],
    knowledgeAreas: row.knowledge_areas ?? [],
    domainId: row.domain_id ?? '',
    faith: row.faith ?? '',
    backgroundText: row.background_text ?? '',
    backgroundDetails: row.background_details ?? {},
    relations: normalizeRelations(row.relations),
    impulses: row.impulses ?? {},
  }
}
