import type { ArmorItem } from '@/types/equipment.types'

export const chainmail: ArmorItem = {
  id: 'chainmail',
  name: 'Chainmail',
  slots: 2,
  type: 'armor',
  properties: { baseAC: 14, dexModApplies: false },
}
