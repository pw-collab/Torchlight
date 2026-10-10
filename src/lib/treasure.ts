import type { InventoryItem } from '@/types/inventory.types'
import type { TreasureGrant } from '@/lib/gmActions'

/**
 * Tesouro em Shadowdark.
 *
 * O XP vem do que se leva para casa, não de quantos monstros caíram: cada
 * achado vale pela qualidade. O Mestre escolhe a faixa e o app soma o XP a quem
 * recebe — até aqui ele dava "+1 XP" de clique em clique e o resto ia de cabeça.
 */
export const TREASURE_TIERS = [
  { id: 'poor', label: 'Pobre', xp: 0 },
  { id: 'normal', label: 'Comum', xp: 1 },
  { id: 'fabulous', label: 'Fabuloso', xp: 3 },
  { id: 'legendary', label: 'Lendário', xp: 10 },
] as const

export type TreasureTier = (typeof TREASURE_TIERS)[number]['id']

export const EMPTY_GRANT: TreasureGrant = { gold: 0, silver: 0, copper: 0, xp: 0 }

export function isEmptyGrant(grant: TreasureGrant): boolean {
  return grant.gold <= 0 && grant.silver <= 0 && grant.copper <= 0 && grant.xp <= 0 && !grant.item?.name.trim()
}

/** O item entregue, pronto para a mochila — com id próprio, como os da ficha. */
export function treasureItem(item: NonNullable<TreasureGrant['item']>): InventoryItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: item.name.trim(),
    description: item.description.trim(),
    slots: Math.max(0, item.slots),
    quantity: Math.max(1, item.quantity),
    type: 'treasure',
  }
}

/** "30 PO, 5 PP · Cálice de prata" — o que a mesa lê no feed. */
export function describeGrant(grant: TreasureGrant): string {
  const coins = [
    grant.gold > 0 && `${grant.gold} PO`,
    grant.silver > 0 && `${grant.silver} PP`,
    grant.copper > 0 && `${grant.copper} PC`,
  ].filter(Boolean)

  const parts: string[] = []
  if (coins.length > 0) parts.push(coins.join(', '))
  const name = grant.item?.name.trim()
  if (name) parts.push(grant.item!.quantity > 1 ? `${grant.item!.quantity}× ${name}` : name)
  return parts.join(' · ')
}
