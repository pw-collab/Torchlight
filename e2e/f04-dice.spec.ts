import { test, expect } from '@playwright/test'
import { rollFormula } from '../src/lib/dice'
import { damageRoll } from '../src/lib/attacks'
import { WEAPONS } from '../src/data/inventory/items'

// Pure rules checks: no browser, no database.
test.describe('F04 rolling in play', () => {
  for (const f of ['d20', '1d6+2', '2d6 + 1', '3d6-1', 'D20']) {
    test(`F04-H1 ${f} rolls a number`, () => {
      expect(Number.isFinite(rollFormula(f, 'x').total)).toBe(true)
    })
  }

  test('F04-E1 every catalogue weapon rolls numeric damage', () => {
    for (const item of WEAPONS.filter(i => i.damageDie)) {
      const r = damageRoll(item as never)
      expect(Number.isFinite(r?.total), `${item.name} (${item.damageDie})`).toBe(true)
    }
  })

  test('F04-E2 versatile weapon rolls its one-handed die', () => {
    for (let i = 0; i < 50; i++) {
      const r = rollFormula('1d8/1d10', 'x')
      expect(r.total).toBeGreaterThanOrEqual(1)
      expect(r.total).toBeLessThanOrEqual(8)
    }
  })

  test('F04-N1 unparseable formula never returns NaN', () => {
    for (const f of ['2d6+1d4', '1d8+STR', 'abc']) {
      expect(Number.isNaN(rollFormula(f, 'x').total), f).toBe(false)
    }
  })
})

test('F04-E3 flat damage (Blowgun "1") deals exactly 1', () => {
  for (let i = 0; i < 20; i++) expect(rollFormula('1', 'x').total).toBe(1)
})
