export type SpellTradition =
  | 'Arcane'
  | 'Divine'
  | 'Witchcraft'
  | 'Primal'
  | 'Necromancer'
  | 'Priest'
  | 'Grave Warden'
  | string

export interface Spell {
  id: string
  name: string
  tier: number
  type: string
  range: string | null
  duration: string | null
  castingTime: string
  description: string
  /** One line for the card's face; the description is the far side. */
  summary?: string
  classes: string[]
  school: string
}
