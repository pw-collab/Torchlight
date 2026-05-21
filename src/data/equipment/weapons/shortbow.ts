import type { WeaponItem } from '@/types/equipment.types'

export const shortbow: WeaponItem = {
  id: 'shortbow',
  name: 'Shortbow',
  slots: 2,
  type: 'weapon',
  properties: { damage: '1d6', twoHanded: true },
}
