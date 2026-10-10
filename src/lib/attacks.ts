import type { InventoryItem } from '@/types/inventory.types'
import { doubledDice, modifier, rollFormula, rollWithMode } from '@/lib/dice'
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
  const roll = rollWithMode('d20', `Ataque: ${item.name}`, item.weaponKind ?? 'melee', bonus, mode)
  // The damage rides along so the card can offer it the moment the attack
  // lands — and double it on a natural 20 without anyone remembering to.
  return item.damageDie ? { ...roll, damage: { formula: item.damageDie, label: `Dano: ${item.name}` } } : roll
}

/** Damage: the weapon's die as written. Null for a weapon that has none. */
export function damageRoll(item: InventoryItem): RollResult | null {
  if (!item.damageDie) return null
  return { ...rollFormula(item.damageDie, `Dano: ${item.name}`, 'Arma'), isDamage: true }
}

/**
 * The damage an attack roll carries, rolled. A natural 20 doubles the weapon's
 * dice (Shadowdark's critical); a natural 1 missed, so there is nothing to roll.
 */
export function damageFollowUp(attack: RollResult): RollResult | null {
  if (!attack.damage || attack.isFumble) return null
  const crit = attack.isCritical === true
  const formula = crit ? doubledDice(attack.damage.formula) : attack.damage.formula
  const roll = rollFormula(formula, crit ? `${attack.damage.label} (crítico)` : attack.damage.label, crit ? `Crítico · ${formula}` : 'Arma')
  return { ...roll, isDamage: true }
}

/** Parry with a shield: one d6 per point of DEX modifier, never fewer than one. */
export function parryRoll(item: InventoryItem, dex: number): RollResult {
  const n = Math.max(1, modifier(dex))
  return rollFormula(`${n}d6`, `Aparar: ${item.name}`, `Bloqueio (${n}d6)`)
}
