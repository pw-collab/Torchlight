import type { ActiveCondition, Character } from '@/types/character.types'

/** Um lugar na mesa: o personagem e de quem ele é. */
export interface Seat {
  character: Character
  playerName: string | null
}

/**
 * O que o Mestre entrega de uma vez: moedas, um item e o XP que o tesouro vale
 * (ver `lib/treasure`). Tudo opcional — um saco de moedas sem item é tesouro,
 * um item sem moeda também.
 */
export interface TreasureGrant {
  gold: number
  silver: number
  copper: number
  xp: number
  item?: {
    name: string
    description: string
    slots: number
    quantity: number
  }
}

/** O que o Mestre pode fazer com um personagem da mesa. */
export type GmAction =
  | { type: 'hp'; delta: number }
  | { type: 'luck'; delta: number }
  | { type: 'xp'; delta: number }
  | { type: 'snuff' }
  /** Aplica se não estiver ativa, remove se estiver — o mesmo gesto nos dois sentidos. */
  | { type: 'condition'; condition: ActiveCondition }
  /** Um aliado passou no INT DC 15: o relógio da morte para (ver `lib/dying`). */
  | { type: 'stabilize' }
  /** A vez de quem está morrendo, rolada pelo Mestre para quem está fora do app. */
  | { type: 'death-roll' }
  /** Moedas, item e XP de tesouro de uma vez (ver `lib/treasure`). */
  | { type: 'treasure'; grant: TreasureGrant }
  /** O grupo acampa: cada um come uma ração e recupera o que o descanso devolve. */
  | { type: 'rest' }
