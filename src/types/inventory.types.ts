export type ItemType = 'weapon' | 'armor' | 'gear' | 'treasure' | 'shield' | 'document'
export type EquipSlot = 'mainHand' | 'offHand' | 'armor'
export type WeaponKind = 'melee' | 'ranged'
export type LightKind = 'torch' | 'candle' | 'lantern'

export interface InventoryItem {
  id: string
  name: string
  description: string
  slots: number
  quantity: number
  type: ItemType
  equipped?: boolean
  slot?: EquipSlot
  weaponKind?: WeaponKind
  attackBonus?: number
  damageDie?: string
  acBonus?: number
  isLight?: boolean
  lightKind?: LightKind
  lightMaxMinutes?: number
  /**
   * Minutes banked on the source. While it burns this is the reading taken at
   * `litAt`, not the reading now — `lib/light` subtracts the elapsed time.
   */
  lightMinutesLeft?: number
  isLit?: boolean
  /** When the source was last lit. Null while it is out. */
  litAt?: string | null
  cost?: string
  range?: string
  content?: string
}
