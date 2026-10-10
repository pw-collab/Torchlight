import { test, expect } from '@playwright/test'
import type { RollResult } from '../src/lib/dice'
import { describeRoll } from '../src/lib/rollSpeech'

// What a screen reader hears for a roll. Pure checks.
function roll(fields: Partial<RollResult>): RollResult {
  return { id: 'r', timestamp: 0, label: 'Ataque', die: 'd20', result: 10, total: 10, ...fields }
}

test.describe('F04 roll results are spoken', () => {
  test('F04-A1 label, detail and total', () => {
    expect(describeRoll(roll({ subLabel: 'Espada', total: 14 }))).toBe('Ataque, Espada: 14.')
  })

  test('F04-A2 a critical and a fumble are said in words, not only colour', () => {
    expect(describeRoll(roll({ total: 24, isCritical: true }))).toContain('Crítico!')
    expect(describeRoll(roll({ total: 1, isFumble: true }))).toContain('Falha crítica.')
  })

  test('F04-A3 both dice of an advantage roll, and the verdict against the DC', () => {
    const text = describeRoll(roll({ rolls: [7, 15], total: 17, dc: 12, success: true }))
    expect(text).toContain('Dados: 7 e 15.')
    expect(text).toContain('Sucesso contra DC 12.')
  })

  test('F04-A4 a Fortuna reroll says what it replaced', () => {
    expect(describeRoll(roll({ total: 18, rerollOf: 4 }))).toContain('antes, 4')
  })
})
