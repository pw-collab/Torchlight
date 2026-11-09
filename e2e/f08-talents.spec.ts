import { test, expect } from '@playwright/test'
import { classes, getClass } from '../src/data/classes/index'
import {
  applyTalentChange,
  chooseTalent,
  pickableRows,
  resolveChoice,
  rowForRoll,
  rowForTalent,
  rowNeedsChoice,
  talentFromRoll,
  talentListPatch,
  targetsPatch,
  type TalentTargets,
} from '../src/lib/talents'
import type { Talent } from '../src/types/talent.types'

// F08: talents that change numbers. A talent applies its bonus when it lands
// (or when its choice is made) and takes it back when it is deleted. Pure
// checks against the class tables and lib/talents.

const warrior = getClass('warrior')!

function base(): TalentTargets {
  return {
    stats: { str: 12, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    meleeBonus: 0,
    rangedBonus: 0,
    spellcastingBonus: 0,
    ac: 12,
  }
}

function rolled(roll: number): Talent {
  return talentFromRoll({ classData: warrior, roll, row: rowForRoll(warrior.talentTable, roll)!, description: '' })
}

test('a fixed row lands with its bonus already applied', () => {
  const talent = rolled(4) // 3-6: +1 to melee and ranged attacks
  expect(talent.pending).toBeUndefined()
  const after = applyTalentChange(base(), [], [talent])
  expect(after.meleeBonus).toBe(1)
  expect(after.rangedBonus).toBe(1)
})

test('a choice row lands pending and adds nothing until chosen', () => {
  const talent = rolled(8) // 7-9: +2 to STR, DEX or CON
  expect(talent.pending).toBe(true)
  expect(applyTalentChange(base(), [], [talent])).toEqual(base())

  const row = rowForTalent(talent, warrior)!
  const chosen = chooseTalent(talent, row, warrior.talentTable, { optionId: 'stat-dex' })!
  expect(chosen.pending).toBeUndefined()
  expect(chosen.choiceLabel).toBe('+2 Destreza')
  const after = applyTalentChange(base(), [talent], [chosen])
  expect(after.stats.dex).toBe(12)
})

test('deleting a talent takes its bonus back off', () => {
  const talent = chooseTalent(rolled(8), rowForRoll(warrior.talentTable, 8)!, warrior.talentTable, { optionId: 'stat-str' })!
  const withIt = applyTalentChange(base(), [], [talent])
  expect(withIt.stats.str).toBe(14)
  const without = applyTalentChange(withIt, [talent], [])
  expect(without).toEqual(base())
})

test('changing a choice swaps the old bonus for the new one', () => {
  const row = rowForRoll(warrior.talentTable, 8)!
  const dex = chooseTalent(rolled(8), row, warrior.talentTable, { optionId: 'stat-dex' })!
  const con = chooseTalent(dex, row, warrior.talentTable, { optionId: 'stat-con' })!
  const start = applyTalentChange(base(), [], [dex])
  const after = applyTalentChange(start, [dex], [con])
  expect(after.stats.dex).toBe(10)
  expect(after.stats.con).toBe(12)
})

test('points to distribute must all be spent', () => {
  const row = rowForRoll(warrior.talentTable, 12)!
  expect(resolveChoice(row, warrior.talentTable, { optionId: 'distribute', points: { str: 1 } })).toBeNull()
  const done = resolveChoice(row, warrior.talentTable, { optionId: 'distribute', points: { str: 1, wis: 1 } })!
  expect(done.effects).toEqual([
    { kind: 'stat', stat: 'str', amount: 1 },
    { kind: 'stat', stat: 'wis', amount: 1 },
  ])
})

test('"choose a talent" takes another row of the table, with its own choice', () => {
  const row = rowForRoll(warrior.talentTable, 12)!
  expect(resolveChoice(row, warrior.talentTable, { optionId: 'table', row: '7-9' })).toBeNull()
  const done = resolveChoice(row, warrior.talentTable, { optionId: 'table', row: '7-9', rowOptionId: 'stat-con' })!
  expect(done.effects).toEqual([{ kind: 'stat', stat: 'con', amount: 2 }])
  expect(done.label).toBe('7-9: +2 Constituição')
  // The row that sends you to the table is not on offer from itself.
  expect(pickableRows(warrior.talentTable).some(r => r.roll === '12')).toBe(false)
})

test('a written choice is required and kept', () => {
  const row = rowForRoll(warrior.talentTable, 2)!
  expect(rowNeedsChoice(row)).toBe(true)
  expect(resolveChoice(row, warrior.talentTable, { optionId: 'note', note: '  ' })).toBeNull()
  expect(resolveChoice(row, warrior.talentTable, { optionId: 'note', note: 'machados' })?.label).toBe('machados')
})

test('talents from before effects existed move nothing when deleted', () => {
  const legacy: Talent = { id: 'old', name: '+1 to melee and ranged attacks.', origin: 'class', description: '' }
  expect(applyTalentChange(base(), [legacy], [])).toEqual(base())
  // ...but still find their row by name, so the choice can be made later.
  expect(rowForTalent(legacy, warrior)?.roll).toBe('3-6')
})

test('the save patch only carries the columns that moved', () => {
  const talent = rolled(4)
  const patch = talentListPatch({ ...base(), talents: [] }, [talent])
  expect(patch).toEqual({ talents: [talent], melee_bonus: 1, ranged_bonus: 1 })
  expect(targetsPatch(base(), base())).toEqual({})
})

test('every class table option resolves once answered', () => {
  for (const cls of classes) {
    for (const row of cls.talentTable) {
      const ids = (row.options ?? []).map(o => o.id)
      expect(new Set(ids).size, `${cls.id} ${row.roll} option ids`).toBe(ids.length)
      for (const option of row.options ?? []) {
        if (option.fromTable) {
          expect(pickableRows(cls.talentTable).length, `${cls.id} has rows to pick`).toBeGreaterThan(0)
          continue
        }
        const points = option.distribute
          ? { [(option.distribute.stats ?? ['str'])[0]]: option.distribute.points }
          : undefined
        const resolved = resolveChoice(row, cls.talentTable, { optionId: option.id, points, note: 'x' })
        expect(resolved, `${cls.id} ${row.roll} ${option.id}`).not.toBeNull()
      }
    }
  }
})
