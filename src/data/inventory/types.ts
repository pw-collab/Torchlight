export type InventoryItemType = 'weapon' | 'armor' | 'gear' | 'shield'

export type WeaponType = 'melee' | 'ranged'

export interface Item {
  id: string
  name: string
  cost: string
  description: string
  type: InventoryItemType
  weight: number
  damageDie?: string
  range?: string
  weaponType?: WeaponType
  acBonus?: number
  isTorch?: boolean
}

export type ItemInput = Omit<Item, 'id'> & { id?: string }
