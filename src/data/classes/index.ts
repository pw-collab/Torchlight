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
import { artificer } from './artificer'
import { barbarian } from './barbarian'
import { druid } from './druid'
import { plagueDoctor } from './plague-doctor'
import { sorcerer } from './sorcerer'
import { warlock } from './warlock'
import { witch } from './witch'
import { commoner } from './commoner'

export type { ClassTechnique, TalentTableEntry } from '@/types/class.types'
export { CLASS_LORE, getClassLore, type ClassLore } from './lore'

/** Every base class in the campaign wiki, listed the way its table reads. */
export const classes: Class[] = [
  commoner,
  artificer,
  barbarian,
  bard,
  druid,
  warrior,
  monk,
  paladin,
  plagueDoctor,
  priest,
  psionicist,
  ranger,
  sorcerer,
  thief,
  warlock,
  witch,
  wizard,
]

const byId = new Map(classes.map(c => [c.id, c]))

/** Look up a class by its id. Returns undefined for unknown ids. */
export function getClass(id: string): Class | undefined {
  return byId.get(id)
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
