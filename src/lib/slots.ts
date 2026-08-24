/**
 * Gear slots: a character carries their Strength score in slots, and never
 * fewer than ten.
 *
 * This is the only place the rule lives. The wizard read it here while the
 * sheet kept its own copy (`maxSlots = str`), so a character with FOR 8 had
 * ten slots during creation and eight at the table.
 */
export function maxSlots(str: number): number {
  return Math.max(str, 10)
}

/** Carried weight. A stack of three torches weighs three slots, not one. */
export function usedSlots(equipment: { slots: number; quantity?: number }[]): number {
  return equipment.reduce((sum, item) => sum + item.slots * (item.quantity ?? 1), 0)
}

/** Coins ride free until they pile up: a hundred of them fill one slot. */
export const COINS_PER_SLOT = 100

/**
 * What the purse weighs. Under a hundred coins it weighs nothing at all, which
 * is why the pack can carry one and still show every slot free.
 */
export function coinSlots(coins: { gold?: number; silver?: number; copper?: number }): number {
  const total = (coins.gold ?? 0) + (coins.silver ?? 0) + (coins.copper ?? 0)
  return Math.floor(Math.max(0, total) / COINS_PER_SLOT)
}
