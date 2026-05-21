import type { Class } from '@/types/class.types'

export const thief: Class = {
  id: 'thief',
  name: 'Thief',
  hitDie: 6,
  armorTraining: ['none', 'light'],
  weaponTraining: ['simple', 'ranged'],
  talents: [
    { level: 2, description: 'Backstab: +1d6 sneak attack damage' },
    { level: 2, description: '+2 to Stealth checks' },
    { level: 4, description: 'Evasion: DEX save to avoid area effects' },
    { level: 6, description: 'Improved backstab: +2d6 sneak damage' },
  ],
  startingGear: ['dagger', 'leather', 'torch', 'rope'],
}
