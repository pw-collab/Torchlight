export function maxSlots(str: number): number {
  return Math.max(str, 10)
}

export function usedSlots(equipment: { slots: number }[]): number {
  return equipment.reduce((sum, item) => sum + item.slots, 0)
}
