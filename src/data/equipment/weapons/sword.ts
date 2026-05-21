import type { WeaponItem } from '@/types/equipment.types'

export const sword: WeaponItem = {
  id: 'sword',
  name: 'Sword',
  slots: 1,
  type: 'weapon',
  properties: { damage: '1d8', twoHanded: false },
}
