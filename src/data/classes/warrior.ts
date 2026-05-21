import type { Class } from '@/types/class.types'

export const warrior: Class = {
  id: 'warrior',
  name: 'Warrior',
  hitDie: 8,
  armorTraining: ['none', 'light', 'medium', 'heavy', 'shield'],
  weaponTraining: ['simple', 'martial', 'ranged'],
  talents: [
    { level: 2, description: '+2 to attack rolls' },
    { level: 2, description: '+1 to damage rolls' },
    { level: 4, description: 'Gain a combat maneuver' },
    { level: 6, description: 'Extra attack once per round' },
  ],
  startingGear: ['sword', 'chainmail', 'torch', 'rope'],
}
