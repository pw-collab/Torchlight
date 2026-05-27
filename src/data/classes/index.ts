import type { Class, TalentTableEntry } from '@/types/class.types'
import { warrior } from './warrior'
import { thief } from './thief'
import { wizard } from './wizard'
import { priest } from './priest'
import { ranger } from './ranger'

export type { ClassTechnique, TalentTableEntry } from '@/types/class.types'

export const classes: Class[] = [warrior, thief, wizard, priest, ranger]

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
