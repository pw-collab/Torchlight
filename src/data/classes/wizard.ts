import type { Class } from '@/types/class.types'

export const wizard: Class = {
  id: 'wizard',
  name: 'Wizard',
  hitDie: 4,
  armorTraining: ['none'],
  weaponTraining: ['simple'],
  spellcasting: {
    stat: 'int',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
  },
  talents: [
    { level: 2, description: '+2 to spell check rolls' },
    { level: 2, description: 'Learn one extra spell' },
    { level: 4, description: 'Cast spells in armor' },
    { level: 6, description: 'Arcane recovery: regain 1 spell slot/day' },
  ],
  startingGear: ['dagger', 'torch', 'rope'],
}
