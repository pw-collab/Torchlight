import type { Spell, SpellTradition } from './types'
import { SPELLS } from './spells'

export type { Spell, SpellTradition } from './types'
export { SPELLS } from './spells'

const spellById = new Map(SPELLS.map((spell) => [spell.id, spell]))

/** Legacy ids from the placeholder spell lists before the full catalog existed. */
const LEGACY_ALIASES: Record<string, string> = {
  wiz_magic_missile: 'magic-missile',
  wiz_sleep: 'sleep',
  wiz_detect_magic: 'detect-magic',
  wiz_charm: 'charm-person',
  wiz_fireball: 'fireball',
  wiz_fly: 'fly',
  pri_cure_wounds: 'cure-wounds',
  pri_bless: 'bless',
  pri_turn_undead: 'turn-undead',
  pri_hold_person: 'hold-person',
  pri_raise_dead: 'raise-dead',
}

/** Shadowdark traditions available to each playable class in this app. */
const CLASS_TRADITIONS: Record<string, SpellTradition[]> = {
  wizard: ['Arcane'],
  priest: ['Divine', 'Priest'],
}

export function getSpell(id: string): Spell | undefined {
  const resolved = LEGACY_ALIASES[id] ?? id
  return spellById.get(resolved)
}

export function getSpellsForClass(classId: string): Spell[] {
  const traditions = CLASS_TRADITIONS[classId]
  if (!traditions) return []
  return SPELLS.filter((spell) =>
    spell.classes.some((tradition) => traditions.includes(tradition as SpellTradition)),
  )
}

export function getSpellsByTradition(tradition: SpellTradition): Spell[] {
  return SPELLS.filter((spell) => spell.classes.includes(tradition))
}

export function getSpellsByTier(tier: number): Spell[] {
  return SPELLS.filter((spell) => spell.tier === tier)
}
