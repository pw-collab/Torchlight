import type { Class, TalentTableEntry } from '@/types/class.types'
import type { TechniqueState } from '@/types/technique.types'
import { warrior } from './warrior'
import { thief } from './thief'
import { wizard } from './wizard'
import { priest } from './priest'
import { ranger } from './ranger'
import { bard } from './bard'
import { monk } from './monk'
import { paladin } from './paladin'
import { psionicist } from './psionicist'

export type { ClassTechnique, TalentTableEntry } from '@/types/class.types'

export const classes: Class[] = [warrior, thief, wizard, priest, ranger, bard, monk, paladin, psionicist]

const byId = new Map(classes.map(c => [c.id, c]))

/** Look up a class by its id. Returns undefined for unknown ids. */
export function getClass(id: string): Class | undefined {
  return byId.get(id)
}

/**
 * Find the talent table entry that matches a given 2d6 roll result.
 * Returns undefined if the class is unknown or the roll is out of range.
 */
export function getTalentForRoll(classId: string, roll: number): TalentTableEntry | undefined {
  const cls = byId.get(classId)
  if (!cls) return undefined
  return cls.talentTable.find(e => roll >= e.min && roll <= e.max)
}

/**
 * Compute all active passive modifiers granted by a class's techniques.
 *
 * Returns an array of { applyTo, value } pairs that other components can
 * consume (e.g. SlotTracker adding Hauler's CON mod to gear capacity).
 *
 * @param classId - The character's class id
 * @param stats   - The character's current ability scores
 * @param _states - Technique states (reserved for future gating logic)
 */
export function getTechniqueModifiers(
  classId: string,
  stats: Record<string, number>,
  _states: TechniqueState[] = [],
): { techniqueId: string; applyTo: string; value: number }[] {
  const cls = byId.get(classId)
  if (!cls) return []

  const results: { techniqueId: string; applyTo: string; value: number }[] = []

  for (const technique of cls.techniques) {
    if (!technique) continue
    if ((technique.kind ?? 'passive') !== 'passive') continue
    if (!technique.modifier) continue

    const { stat, applyTo, onlyIfPositive } = technique.modifier
    const score = stats[stat] ?? 10
    const bonus = Math.floor((score - 10) / 2)

    if (onlyIfPositive && bonus <= 0) continue

    results.push({ techniqueId: technique.id, applyTo, value: bonus })
  }

  return results
}

/**
 * Simulate a 2d6 roll and return the matching talent table entry for a class.
 * Returns undefined if the class is unknown.
 */
export function rollClassTalent(
  classId: string,
): { roll: number; die1: number; die2: number; entry: TalentTableEntry } | undefined {
  const cls = byId.get(classId)
  if (!cls) return undefined

  const die1 = Math.floor(Math.random() * 6) + 1
  const die2 = Math.floor(Math.random() * 6) + 1
  const roll = die1 + die2
  const entry = cls.talentTable.find(e => roll >= e.min && roll <= e.max)
  if (!entry) return undefined

  return { roll, die1, die2, entry }
}
