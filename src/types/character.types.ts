import type { Stat } from './class.types'
import type { InventoryItem } from './inventory.types'
import type { LevelEntry } from './progression.types'
import type { Talent } from './talent.types'
import type { TechniqueState } from './technique.types'
import { getItem } from '@/data/equipment/index'
import { normalizeBackground, normalizeImpulses, normalizeRelations } from '@/lib/story'

export interface KnowledgeArea {
  name: string
  bonus: number
}

/**
 * Uma condição em vigor. `id` vem do catálogo (`src/data/conditions`) quando é
 * uma condição conhecida, ou é gerado quando o Mestre escreve uma à mão — a
 * lista do livro não fecha o que pode acontecer numa mesa.
 */
export interface ActiveCondition {
  id: string
  label: string
  note?: string
  appliedBy?: string
  appliedAt?: string
  /**
   * Quantas rodadas ainda restam, para as condições que correm contra o
   * relógio — hoje só "Morrendo" (ver `lib/dying`).
   */
  rounds?: number
}

export interface Character {
  id: string
  /** Bumped by the database on every save (migration 021). Undefined before it. */
  version?: number
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
  /** O que está em vigor sobre o personagem agora — ver §5.6. */
  conditions: ActiveCondition[]
  /**
   * O caderno do jogador (§5.9): o nome do NPC, a senha da porta, o que o
   * taverneiro deixou escapar. Antes disso ia para o WhatsApp e se perdia.
   */
  notes: string
  /** One record per level whose reward has been rolled — see the "Progresso" track. */
  levelProgress: LevelEntry[]
  techniqueStates: TechniqueState[]
  languages: string[]
  knowledgeAreas: KnowledgeArea[]
  domainId: string
  faith: string
  backgroundText: string
  backgroundDetails: BackgroundDetails
  relations: Relations
  impulses: Impulses
}

// ─── A aba História (ver lib/story) ───────────────────────────────────────────

/** Um fato curto da capa, com o rótulo que o jogador escolher: Patrono, Mentor, Declara vir de. */
export interface StoryFact {
  id: string
  label: string
  value: string
}

/** Alguém da vida do personagem, como o capítulo "Pessoas e instituições" o descreve. */
export interface StoryPerson {
  id: string
  name: string
  /** O que a pessoa é para o personagem, numa linha: "o irmão mais novo, 17 anos; rival". */
  role: string
  /** O que o personagem sabe dela, e como a vê. */
  note: string
}

/** Uma instituição: a academia que deixou para trás, a fé que o persegue. */
export interface StoryInstitution {
  id: string
  name: string
  note: string
}

export interface BackgroundDetails {
  /** O conceito, a apresentação logo abaixo do nome. Também é o texto do card no elenco da home. */
  concept?: string
  /** O título que abre o conceito, em destaque: "O Desertor Iluminado". */
  epithet?: string
  /** A linha em itálico sob o nome: "nascido Aoth Hahpet". */
  alias?: string
  /** A cidade de onde veio. Na capa, junto do domínio: "Origem: Toyalis, Hazlan". */
  hometown?: string
  theme?: string
  appearance?: string
  /** "De onde vem": a terra e a cultura que o formaram. */
  origin?: string
  /** O capítulo História, em Markdown. */
  backstory?: string
  /** Campo antigo. Hoje é um quadro dentro da História (ver `storyMarkdown`). */
  traumaticEvents?: string
  /** "Por que anda com eles", em Markdown. */
  companions?: string
  facts: StoryFact[]
}

/** O que o banco guarda: tudo opcional, e `facts` pode nem existir. */
export type RawBackgroundDetails = Partial<Omit<BackgroundDetails, 'facts'>> & {
  facts?: StoryFact[]
}

export interface Relations {
  people: StoryPerson[]
  institutions: StoryInstitution[]
}

/**
 * Relações como saem do banco. Antes das pessoas e instituições eram
 * Família, Aliados e Rivais em texto livre (e antes disso, listas de nomes)
 * e uma Facção; linhas antigas ainda chegam assim.
 */
export interface RawRelations {
  people?: StoryPerson[]
  institutions?: StoryInstitution[]
  family?: string | string[]
  allies?: string | string[]
  rivals?: string | string[]
  faction?: string
}

/** Cada impulso é uma lista de bullets de uma linha. */
export interface Impulses {
  /** "O que ele quer": na ficha, "O que Ralf quer", com o primeiro nome. */
  objectives: string[]
  secrets: string[]
  flaws: string[]
  fears: string[]
}

/** Impulsos como saem do banco: listas, ou o texto corrido de antes. */
export interface RawImpulses {
  objectives?: string | string[]
  secrets?: string | string[]
  flaws?: string | string[]
  fears?: string | string[]
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
  version?: number
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
  conditions?: ActiveCondition[]
  notes?: string | null
  level_progress?: LevelEntry[]
  technique_states?: TechniqueState[]
  languages?: string[]
  knowledge_areas?: KnowledgeArea[]
  domain_id?: string | null
  faith?: string | null
  background_text?: string | null
  background_details?: RawBackgroundDetails
  relations?: RawRelations
  impulses?: RawImpulses
  player_name?: string | null
}

export function rowToCharacter(row: CharacterRow): Character {
  const rawEquip: RawEquipItem[] = Array.isArray(row.equipment) ? row.equipment : []
  const inventory: InventoryItem[] = rawEquip.map(item =>
    isLegacy(item) ? convertLegacyItem(item) : item
  )

  return {
    id: row.id,
    version: row.version,
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
    conditions: Array.isArray(row.conditions) ? row.conditions : [],
    notes: row.notes ?? '',
    levelProgress: Array.isArray(row.level_progress) ? row.level_progress : [],
    techniqueStates: row.technique_states ?? [],
    languages: row.languages ?? [],
    knowledgeAreas: row.knowledge_areas ?? [],
    domainId: row.domain_id ?? '',
    faith: row.faith ?? '',
    backgroundText: row.background_text ?? '',
    backgroundDetails: normalizeBackground(row.background_details),
    relations: normalizeRelations(row.relations),
    impulses: normalizeImpulses(row.impulses),
  }
}
