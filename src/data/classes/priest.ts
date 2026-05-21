import type { Class } from '@/types/class.types'

export const priest: Class = {
  id: 'priest',
  name: 'Priest',
  hitDie: 6,
  armorTraining: ['none', 'light', 'medium', 'shield'],
  weaponTraining: ['simple'],
  spellcasting: {
    stat: 'wis',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
  },
  talents: [
    { level: 2, description: 'Turn undead (WIS check)' },
    { level: 2, description: '+2 to healing spells' },
    { level: 4, description: 'Divine intervention once per day' },
    { level: 6, description: 'Heal extra d6 per day' },
  ],
  startingGear: ['mace', 'chainmail', 'torch', 'rope'],
}
