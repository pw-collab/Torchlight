import { test, expect } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CharacterRow } from '../src/types/character.types'
import { rowToCharacter } from '../src/types/character.types'
import { changeCharacter } from '../src/lib/characterWrite'
import { createCharacterSaver } from '../src/lib/characterSaver'

// F06: the GM and the player edit the same character at the same moment, and
// neither edit is lost. Pure checks against a fake `characters` table that
// behaves like migration 021: every update bumps `version`, and an update
// filtered on a stale version matches nothing.

function baseRow(fields: Partial<CharacterRow> = {}): CharacterRow {
  return {
    id: 'c1', user_id: 'u1', session_id: 's1', name: 'Hilda', class_id: 'warrior', ancestry_id: 'human',
    level: 1, str: 12, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    hp_max: 20, hp_current: 10, ac: 12, luck_tokens: 1, xp: 0, gold: 0, silver: 0, copper: 0,
    equipment: [], spells: [], talents: [], conditions: [], version: 1,
    ...fields,
  } as unknown as CharacterRow
}

/** An in-memory `characters` row with version semantics, and a hook to slip a write in first. */
function fakeTable(initial: CharacterRow) {
  const state = { row: initial, writes: 0, beforeNextWrite: null as null | (() => void) }

  function apply(patch: Partial<CharacterRow>, expected: number | undefined) {
    const sneak = state.beforeNextWrite
    state.beforeNextWrite = null
    sneak?.()
    if (expected !== undefined && expected !== state.row.version) return null
    state.row = { ...state.row, ...patch, version: (state.row.version ?? 0) + 1 }
    state.writes += 1
    return state.row
  }

  /** Someone else's save, straight to the table. */
  function foreign(patch: Partial<CharacterRow>) {
    state.row = { ...state.row, ...patch, version: (state.row.version ?? 0) + 1 }
  }

  const client = {
    from: () => ({
      update: (patch: Partial<CharacterRow>) => {
        const filters: Record<string, unknown> = {}
        const builder = {
          eq: (key: string, value: unknown) => { filters[key] = value; return builder },
          select: () => ({
            maybeSingle: async () => ({ data: apply(patch, filters.version as number | undefined), error: null }),
          }),
        }
        return builder
      },
      select: () => {
        const builder = { eq: () => builder, single: async () => ({ data: state.row, error: null }) }
        return builder
      },
    }),
  } as unknown as SupabaseClient

  return { state, client, apply, foreign }
}

test.describe('F06 GM actions are worked out from the row as it stands', () => {
  test('F06-E1 damage lands on the HP the player just healed to', async () => {
    const t = fakeTable(baseRow({ hp_current: 10 }))
    const gmCopy = rowToCharacter(t.state.row)          // the GM's card: 10 HP
    t.foreign({ hp_current: 15 })                        // player heals to 15 first

    const outcome = await changeCharacter(t.client, gmCopy, c => ({
      patch: { hp_current: c.hpCurrent - 3 },
      result: null,
    }))

    expect(outcome.ok).toBe(true)
    expect(t.state.row.hp_current).toBe(12)              // not 7: the heal survives
  })

  test('F06-E2 a condition the GM adds keeps the one the player just removed off', async () => {
    const poisoned = { id: 'poisoned', label: 'Envenenado' }
    const t = fakeTable(baseRow({ conditions: [poisoned] as never }))
    const gmCopy = rowToCharacter(t.state.row)
    t.foreign({ conditions: [] as never })               // player clears poison

    await changeCharacter(t.client, gmCopy, c => ({
      patch: { conditions: [...c.conditions, { id: 'blind', label: 'Cego' }] as never },
      result: null,
    }))

    expect((t.state.row.conditions as unknown as { id: string }[]).map(x => x.id)).toEqual(['blind'])
  })

  test('F06-E3 without a version (before migration 021) it writes as before', async () => {
    const t = fakeTable(baseRow({ version: undefined }))
    const outcome = await changeCharacter(t.client, rowToCharacter(t.state.row), () => ({
      patch: { xp: 5 },
      result: null,
    }))
    expect(outcome.ok).toBe(true)
    expect(t.state.row.xp).toBe(5)
  })

  test('F06-N1 gives up, without writing, if it keeps losing', async () => {
    const t = fakeTable(baseRow())
    const outcome = await changeCharacter(t.client, rowToCharacter(t.state.row), c => {
      t.state.beforeNextWrite = () => t.foreign({ luck_tokens: c.luckTokens + 1 })
      return { patch: { xp: 1 }, result: null }
    })
    expect(outcome).toEqual({ ok: false, reason: 'conflict' })
    expect(t.state.row.xp).toBe(0)
  })
})

test.describe('F06 the player sheet never overwrites the GM silently', () => {
  function saverFor(t: ReturnType<typeof fakeTable>) {
    const seen = { rows: [] as CharacterRow[], saved: 0, conflicts: 0 }
    const saver = createCharacterSaver({
      write: async (updates, expected) => ({ row: t.apply(updates, expected), error: null }),
      read: async () => t.state.row,
      onRow: row => seen.rows.push(row),
      onSaved: () => { seen.saved += 1 },
      onConflict: () => { seen.conflicts += 1 },
    })
    saver.loaded(t.state.row)
    return { saver, seen }
  }

  test('F06-H1 three quick clicks are three saves, not conflicts', async () => {
    const t = fakeTable(baseRow({ hp_current: 10 }))
    const { saver, seen } = saverFor(t)
    const results = await Promise.all([
      saver.save({ hp_current: 9 }),
      saver.save({ hp_current: 8 }),
      saver.save({ hp_current: 7 }),
    ])
    expect(results).toEqual([true, true, true])
    expect(t.state.row.hp_current).toBe(7)
    expect(seen.conflicts).toBe(0)
  })

  test('F06-E4 the echo of our own save, arriving early, causes no conflict', async () => {
    const t = fakeTable(baseRow())
    const { saver, seen } = saverFor(t)
    const first = saver.save({ xp: 1 })
    saver.observed({ ...t.state.row, version: (t.state.row.version ?? 0) + 1 })  // echo before the reply
    const second = saver.save({ xp: 2 })
    expect(await first).toBe(true)
    expect(await second).toBe(true)
    expect(seen.conflicts).toBe(0)
  })

  test('F06-N2 a GM save in between makes ours miss, and it says so', async () => {
    const t = fakeTable(baseRow({ hp_current: 10 }))
    const { saver, seen } = saverFor(t)
    t.state.beforeNextWrite = () => t.foreign({ hp_current: 4 })   // GM's damage lands first

    expect(await saver.save({ hp_current: 11 })).toBe(false)
    expect(t.state.row.hp_current).toBe(4)                          // the GM's damage stands
    expect(seen.conflicts).toBe(1)
    expect(seen.rows.at(-1)?.hp_current).toBe(4)                    // the sheet now shows it
  })

  test('F06-N3 saves queued behind a miss are dropped, not written', async () => {
    const t = fakeTable(baseRow({ hp_current: 10 }))
    const { saver, seen } = saverFor(t)
    t.state.beforeNextWrite = () => t.foreign({ hp_current: 4 })

    const results = await Promise.all([saver.save({ hp_current: 9 }), saver.save({ hp_current: 8 })])
    expect(results).toEqual([false, false])
    expect(t.state.row.hp_current).toBe(4)
    expect(t.state.writes).toBe(0)
    expect(seen.conflicts).toBe(1)
  })

  test('F06-H2 after a miss, the next save works from the fresh row', async () => {
    const t = fakeTable(baseRow({ hp_current: 10 }))
    const { saver } = saverFor(t)
    t.state.beforeNextWrite = () => t.foreign({ hp_current: 4 })
    await saver.save({ hp_current: 11 })
    expect(await saver.save({ hp_current: 5 })).toBe(true)
    expect(t.state.row.hp_current).toBe(5)
  })
})
