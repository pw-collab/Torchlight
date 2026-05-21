import type { Ancestry } from '@/types/ancestry.types'

export const halfling: Ancestry = {
  id: 'halfling',
  name: 'Halfling',
  traits: [
    { name: 'Stealthy', description: '+2 to Stealth checks.' },
    { name: 'Lucky', description: 'Once per day, reroll any die and keep the new result.' },
  ],
}
