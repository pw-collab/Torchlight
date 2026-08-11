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

export function getSpell(id: string): Spell | undefined {
  const resolved = LEGACY_ALIASES[id] ?? id
  return spellById.get(resolved)
}

/**
 * Full spell catalog available to a character, regardless of class — any
 * character can learn any spell (no wizard/priest tradition restriction).
 * Keeps the `classId` parameter for call-site compatibility.
 */
export function getSpellsForClass(classId?: string): Spell[] {
  void classId
  return SPELLS
}

export function getSpellsByTradition(tradition: SpellTradition): Spell[] {
  return SPELLS.filter((spell) => spell.classes.includes(tradition))
}

/**
 * Highest spell tier a character of `level` may learn — one new tier every two
 * levels, capped at 5 (the top tier a player character reaches).
 */
export function maxSpellTier(level: number): number {
  return Math.min(5, Math.max(1, Math.ceil(level / 2)))
}

/**
 * The spells a character may pick from: those on the given list, at or below
 * the tier their level allows. Both filters are optional — leaving `tradition`
 * out returns every list, which is what the sheet's editor wants.
 */
export function getLearnableSpells(
  { tradition, maxTier }: { tradition?: SpellTradition; maxTier?: number } = {},
): Spell[] {
  return SPELLS.filter((spell) => {
    if (tradition && !spell.classes.includes(tradition)) return false
    if (maxTier != null && spell.tier > maxTier) return false
    return true
  }).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
}

export function getSpellsByTier(tier: number): Spell[] {
  return SPELLS.filter((spell) => spell.tier === tier)
}
