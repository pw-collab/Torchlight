import type { InventoryItem } from '@/types/inventory.types'

/**
 * The illustration that stands for an item in the pack (Figma 339:738, the
 * "Item art" layer). The Figma carries eight watercolours, not one per item,
 * so a drawing is picked by what the thing is: a few by name, the rest by kind.
 * A kind with no drawing yet (a shield, a bow, a book) answers `null` and the
 * pack draws its icon on a plain ground instead.
 *
 * Files live in `public/items`, 320px WebP: the Figma exports are 1024px, far
 * more than a ~100px cell ever shows.
 */
export const ITEM_ART = {
  purse: '/items/bolsa-de-moedas.webp',
  backpack: '/items/mochila.webp',
  holySymbol: '/items/simbolo-sagrado.webp',
  light: '/items/tocha.webp',
  armor: '/items/armadura.webp',
  blade: '/items/espada.webp',
  supplies: '/items/suprimentos.webp',
  tools: '/items/ferramentas.webp',
} as const

type ArtInput = Pick<InventoryItem, 'name' | 'type'> &
  Partial<Pick<InventoryItem, 'isLight' | 'weaponKind'>>

/** Names first: they are the most specific thing known about an item. */
const BY_NAME: { test: RegExp; art: string }[] = [
  { test: /\b(tocha|vela|lampi[ãa]o|torch|candle|lantern)\b/i, art: ITEM_ART.light },
  { test: /\bmochila\b|backpack/i, art: ITEM_ART.backpack },
  { test: /s[ií]mbolo sagrado|holy symbol/i, art: ITEM_ART.holySymbol },
  { test: /\bra[cç](?:[ãa]o|[õo]es)\b|\bration/i, art: ITEM_ART.supplies },
  { test: /bolsa de moedas|coin purse/i, art: ITEM_ART.purse },
]

export function itemArt(item: ArtInput): string | null {
  if (item.isLight) return ITEM_ART.light
  const named = BY_NAME.find(({ test }) => test.test(item.name))
  if (named) return named.art

  switch (item.type) {
    case 'weapon':
      // Only the blade is drawn: a bow shown as a sword would be a wrong name
      // under the right picture.
      return item.weaponKind === 'ranged' ? null : ITEM_ART.blade
    case 'armor':
      return ITEM_ART.armor
    case 'gear':
      return ITEM_ART.tools
    default:
      return null
  }
}
