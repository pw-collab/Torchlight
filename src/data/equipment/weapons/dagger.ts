import type { WeaponItem } from '@/types/equipment.types'

export const dagger: WeaponItem = {
  id: 'dagger',
  name: 'Dagger',
  slots: 1,
  type: 'weapon',
  properties: { damage: '1d4', twoHanded: false },
}
