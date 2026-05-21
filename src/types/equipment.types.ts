export type ItemType = 'weapon' | 'armor' | 'gear'

export interface Item {
  id: string
  name: string
  slots: number
  type: ItemType
  properties?: Record<string, unknown>
}

export interface ArmorItem extends Item {
  type: 'armor'
  properties: {
    baseAC: number
    dexModApplies: boolean
  }
}

export interface WeaponItem extends Item {
  type: 'weapon'
  properties: {
    damage: string
    twoHanded: boolean
  }
}
