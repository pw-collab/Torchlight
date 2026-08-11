import type { InventoryItem, ItemType } from '@/types/inventory.types'
import type { ArchetypeKitItem } from '@/types/archetype.types'
import type { Item as CatalogItem } from '@/data/inventory/types'
import { getInventoryItem } from '@/data/inventory/index'

/** Two inventory rows for the same catalog item still need distinct ids. */
function uniqueId(base: string): string {
  return `${base}-${Math.random().toString(36).substring(2, 6)}`
}

/**
 * Turn a catalog entry into an inventory row — the shape the sheet stores and
 * `InventoryView` renders. Mirrors the sheet's own converter so an item added
 * during creation is indistinguishable from one picked up later.
 */
export function catalogToInventoryItem(cat: CatalogItem): InventoryItem {
  const name = cat.name.toLowerCase()
  const isLantern = name.includes('lamp')
  const isCandle = name.includes('vela')
  const isLight = Boolean(cat.isTorch) || isLantern

  return {
    id: uniqueId(cat.id),
    name: cat.name,
    description: cat.description === '-' ? '' : cat.description,
    slots: cat.weight,
    quantity: 1,
    type: cat.type as ItemType,
    cost: cat.cost,
    ...(cat.weaponType && { weaponKind: cat.weaponType }),
    ...(cat.damageDie && cat.damageDie !== '-' && { damageDie: cat.damageDie }),
    ...(cat.acBonus && { acBonus: cat.acBonus }),
    ...(cat.range && { range: cat.range }),
    ...(isLight && {
      isLight: true,
      lightKind: (isLantern ? 'lantern' : isCandle ? 'candle' : 'torch') as InventoryItem['lightKind'],
      lightMaxMinutes: isLantern ? 120 : isCandle ? 30 : 60,
      lightMinutesLeft: isLantern ? 120 : isCandle ? 30 : 60,
    }),
  }
}

/**
 * Resolve one entry of an archetype's kit. Entries that name a catalog item
 * come back as that item; the rest — a silvered dagger, a reliquary — are
 * carried as written.
 */
export function kitToInventoryItem(kit: ArchetypeKitItem): InventoryItem {
  const catalog = kit.itemId ? getInventoryItem(kit.itemId) : undefined
  if (catalog) return catalogToInventoryItem(catalog)

  return {
    id: uniqueId(kit.itemId ?? 'kit'),
    name: kit.name,
    description: kit.description ?? '',
    slots: kit.slots ?? 1,
    quantity: 1,
    type: (kit.type ?? 'gear') as ItemType,
    ...(kit.damageDie && { damageDie: kit.damageDie, weaponKind: 'melee' as const }),
  }
}

/** Starting gear granted by a class id list, resolved against the catalog. */
export function startingGearItems(itemIds: string[]): InventoryItem[] {
  return itemIds
    .map(id => getInventoryItem(id))
    .filter((item): item is CatalogItem => item != null)
    .map(catalogToInventoryItem)
}

/**
 * Armor class from the carried gear. Armor sets the base (adding DEX only for
 * the lighter kinds), a shield adds on top — the same rule the sheet applies
 * once the character is playing.
 */
export function armorClassFor(items: InventoryItem[], dex: number): number {
  const dexMod = Math.floor((dex - 10) / 2)
  let ac = 10 + dexMod

  const armor = items.find(i => i.type === 'armor' && i.acBonus != null)
  if (armor?.acBonus) {
    ac = armor.acBonus + (armor.acBonus < 14 ? dexMod : 0)
  }

  const shield = items.find(i => i.type === 'shield' && i.acBonus != null)
  if (shield?.acBonus) ac += shield.acBonus

  return ac
}
