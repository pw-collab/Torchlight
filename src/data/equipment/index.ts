import { ALL_ITEMS, getInventoryItem } from '@/data/inventory'
import type { Item as CatalogItem } from '@/data/inventory/types'
import type { Item } from '@/types/equipment.types'

function armorDexModApplies(entry: CatalogItem): boolean {
  if (entry.acBonus == null) return false
  const desc = entry.description.toLowerCase()
  if (entry.name === 'None') return true
  if (desc.includes('dex mod')) return true
  if (entry.acBonus === 11) return true
  if (entry.acBonus >= 15 && !desc.includes('dex')) return false
  return false
}

function toSheetItem(entry: CatalogItem): Item {
  const sheetType: Item['type'] =
    entry.type === 'shield' ? 'gear' : entry.type

  const properties: Record<string, unknown> = {
    cost: entry.cost,
    description: entry.description,
    catalogType: entry.type,
  }

  if (entry.type === 'weapon') {
    properties.damage = entry.damageDie ?? '-'
    properties.twoHanded = entry.description.includes('2 Handed')
    properties.range = entry.range
    properties.weaponType = entry.weaponType
  }

  if (entry.type === 'armor') {
    properties.baseAC = entry.acBonus ?? 10
    properties.dexModApplies = armorDexModApplies(entry)
  }

  if (entry.type === 'shield') {
    properties.acBonus = entry.acBonus
    properties.isShield = true
  }

  if (entry.type === 'gear' && entry.isTorch) {
    properties.isTorch = true
  }

  return {
    id: entry.id,
    name: entry.name,
    slots: entry.weight,
    type: sheetType,
    properties,
  }
}

export const items: Item[] = ALL_ITEMS.map(toSheetItem)

export function getItem(id: string): Item | undefined {
  const catalog = getInventoryItem(id)
  return catalog ? toSheetItem(catalog) : undefined
}
