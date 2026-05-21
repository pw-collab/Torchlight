import type { Class } from '@/types/class.types'

export const ranger: Class = {
  id: 'ranger',
  name: 'Ranger',
  hitDie: 8,
  armorTraining: ['none', 'light', 'medium'],
  weaponTraining: ['simple', 'martial', 'ranged'],
  talents: [
    { level: 2, description: 'Favored enemy: +2 to attacks vs chosen type' },
    { level: 2, description: '+2 to Survival and Tracking checks' },
    { level: 4, description: 'Extra attack with ranged weapons' },
    { level: 6, description: 'Vanish: Hide even when observed' },
  ],
  startingGear: ['shortbow', 'leather', 'dagger', 'torch'],
}
