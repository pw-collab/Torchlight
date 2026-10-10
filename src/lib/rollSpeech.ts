import type { RollResult } from '@/lib/dice'

/**
 * A roll as one spoken sentence, for screen readers.
 *
 * The card says the same things, but partly in colour: a critical is gold and
 * a fumble red, with no words. Here they are words.
 */
export function describeRoll(roll: RollResult): string {
  const parts: string[] = []

  const what = roll.subLabel ? `${roll.label}, ${roll.subLabel}` : roll.label
  parts.push(`${what}: ${roll.total}.`)

  if (roll.rolls && roll.rolls.length === 2) {
    parts.push(`Dados: ${roll.rolls[0]} e ${roll.rolls[1]}.`)
  }
  if (roll.isCritical) parts.push('Crítico!')
  if (roll.isFumble) parts.push('Falha crítica.')
  if (roll.dc !== undefined) {
    parts.push(`${roll.success ? 'Sucesso' : 'Falha'} contra DC ${roll.dc}.`)
  }
  if (roll.rerollOf !== undefined) {
    parts.push(`Rolado de novo com Fortuna; antes, ${roll.rerollOf}.`)
  }

  return parts.join(' ')
}
