export type { Spell } from './wizard/index'
import { wizardSpells } from './wizard/index'
import { priestSpells } from './priest/index'

export { wizardSpells, priestSpells }

export function getSpellsForClass(classId: string) {
  if (classId === 'wizard') return wizardSpells
  if (classId === 'priest') return priestSpells
  return []
}
