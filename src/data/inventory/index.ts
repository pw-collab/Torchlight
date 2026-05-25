import type { Item as CatalogItem } from './types'
import { ALL_ITEMS, ARMORS, GEAR, WEAPONS } from './items'

export type { Item, InventoryItemType, ItemInput, WeaponType } from './types'
export { slugFromName } from './ids'
export { WEAPONS, ARMORS, GEAR, ALL_ITEMS } from './items'

const byId = new Map(ALL_ITEMS.map((item) => [item.id, item]))

/** Legacy ids used in class starting gear before the full catalog existed. */
const LEGACY_ALIASES: Record<string, string> = {
  sword: 'longsword',
  torch: 'tocha',
  rope: 'corda-18m',
  leather: 'leather-armor',
}

export function getInventoryItem(id: string): CatalogItem | undefined {
  const resolved = LEGACY_ALIASES[id] ?? id
  return byId.get(resolved)
}

export function getItemsByType(type: CatalogItem['type']): CatalogItem[] {
  return ALL_ITEMS.filter((item) => item.type === type)
}
