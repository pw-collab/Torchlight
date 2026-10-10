import { test, expect } from '@playwright/test'
import type { InventoryItem } from '../src/types/inventory.types'
import { extinguishSource, lightSource, minutesLeft } from '../src/lib/light'
import { tableNow, type TableClock } from '../src/lib/dungeonClock'

// F05: a torch is lit, read and put out on one clock, the table's.
// These were the three ways it went wrong while lighting used the bare
// device clock and reading used the table clock.
const torch = { id: 't', name: 'Tocha', isLight: true, isLit: false, equipped: true, lightMaxMinutes: 60 } as InventoryItem
const T = Date.parse('2026-10-10T20:00:00Z')
const MIN = 60_000
const clock = (shiftSeconds: number): TableClock => ({ pausedAt: null, shiftSeconds })

test.describe('F05 torch time follows the table clock', () => {
  test('F05-E1 after a 30-minute break, a new torch still burns', () => {
    const lit = lightSource(torch, tableNow(clock(-1800), T))
    expect(minutesLeft(lit, tableNow(clock(-1800), T + 20 * MIN))).toBe(40)
  })

  test('F05-E2 turns advanced before lighting do not burn a new torch', () => {
    const lit = lightSource(torch, tableNow(clock(1200), T))
    expect(minutesLeft(lit, tableNow(clock(1200), T))).toBe(60)
  })

  test('F05-E3 a turn advanced after lighting does burn it', () => {
    const lit = lightSource(torch, tableNow(clock(0), T))
    expect(minutesLeft(lit, tableNow(clock(600), T))).toBe(50)
  })

  test('F05-E4 putting a torch out banks what the table showed', () => {
    const lit = lightSource(torch, tableNow(clock(0), T))
    const shown = minutesLeft(lit, tableNow(clock(600), T + MIN))
    const out = extinguishSource(lit, tableNow(clock(600), T + MIN))
    expect(out.lightMinutesLeft).toBe(shown)
    expect(shown).toBe(49)
  })
})
