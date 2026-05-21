export type ArmorType = 'none' | 'light' | 'medium' | 'heavy' | 'shield'
export type WeaponType = 'simple' | 'martial' | 'ranged'
export type Stat = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export interface Talent {
  level: number
  description: string
}

export interface SpellcastingConfig {
  stat: Stat
  spellsPerDay: number[] // indexed by level (0-indexed = level 1)
}

export interface Class {
  id: string
  name: string
  hitDie: number
  armorTraining: ArmorType[]
  weaponTraining: WeaponType[]
  spellcasting?: SpellcastingConfig
  talents: Talent[]
  startingGear: string[] // item ids
}
