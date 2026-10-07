import type { InventoryItem } from '@/types/inventory.types'
import { modifier, rollFormula, rollWithMode } from '@/lib/dice'
import type { RollMode, RollResult } from '@/lib/dice'

/**
 * Weapon rolls, written once. The inventory rolls them off the equipped slots
 * and the sheet's quick attack menu off the same items, so a bonus counted in
 * one place is counted in the other.
 */

export interface AttackContext {
  str: number
  dex: number
  meleeBonus: number
  rangedBonus: number
}

/** What is in hand and can be rolled: equipped weapons, then the shield. */
export function heldForCombat(inventory: InventoryItem[]): InventoryItem[] {
  const held = inventory.filter(i => i.equipped && (i.type === 'weapon' || i.type === 'shield'))
  return [...held.filter(i => i.type === 'weapon'), ...held.filter(i => i.type === 'shield')]
}

/** Attack: d20 + STR (melee) or DEX (ranged), the sheet's bonus, the weapon's own. */
export function attackRoll(item: InventoryItem, ctx: AttackContext, mode: RollMode = 'normal'): RollResult {
  const isRanged = item.weaponKind === 'ranged'
  const attrMod = modifier(isRanged ? ctx.dex : ctx.str)
  const bonus = attrMod + (isRanged ? ctx.rangedBonus : ctx.meleeBonus) + (item.attackBonus ?? 0)
  return rollWithMode('d20', `Ataque: ${item.name}`, item.weaponKind ?? 'melee', bonus, mode)
}

/** Damage: the weapon's die as written. Null for a weapon that has none. */
export function damageRoll(item: InventoryItem): RollResult | null {
  if (!item.damageDie) return null
  return rollFormula(item.damageDie, `Dano: ${item.name}`, 'Arma')
}

/** Parry with a shield: one d6 per point of DEX modifier, never fewer than one. */
export function parryRoll(item: InventoryItem, dex: number): RollResult {
  const n = Math.max(1, modifier(dex))
  return rollFormula(`${n}d6`, `Aparar: ${item.name}`, `Bloqueio (${n}d6)`)
}
