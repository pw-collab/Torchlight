import type { ArmorItem } from '@/types/equipment.types'

export const leather: ArmorItem = {
  id: 'leather',
  name: 'Leather Armor',
  slots: 1,
  type: 'armor',
  properties: { baseAC: 11, dexModApplies: true },
}
