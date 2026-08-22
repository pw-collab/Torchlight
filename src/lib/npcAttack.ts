/**
 * O que dá para aproveitar do statblock na hora do ataque.
 *
 * A linha de ATK de um NPC é prosa — "1 espada longa +2 (1d8)" —, então isto
 * não tenta entendê-la: pesca o bônus e o dano mais prováveis para preencher os
 * campos, e o Mestre corrige em cima se o palpite não servir. Adivinhar com
 * confiança seria pior do que não adivinhar.
 */

/** `1d8`, `2d6+1`, `d4` — a primeira que aparecer. */
const DICE = /\b\d*d\d+(?:[+-]\d+)?\b/gi

/** A fórmula de dano mais provável do texto. */
export function damageFrom(text: string): string | null {
  const match = text.match(DICE)
  return match?.[0] ?? null
}

/**
 * O bônus de ataque mais provável. As fórmulas de dado saem primeiro, senão o
 * `+1` de `1d4+1` passaria por bônus de ataque.
 */
export function attackBonusFrom(text: string): number {
  const withoutDice = text.replace(DICE, ' ')
  const match = withoutDice.match(/[+-]\s?\d+/)
  if (!match) return 0
  const value = parseInt(match[0].replace(/\s+/g, ''), 10)
  return Number.isFinite(value) ? value : 0
}
