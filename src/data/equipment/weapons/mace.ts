import type { WeaponItem } from '@/types/equipment.types'

export const mace: WeaponItem = {
  id: 'mace',
  name: 'Mace',
  slots: 1,
  type: 'weapon',
  properties: { damage: '1d6', twoHanded: false },
}
