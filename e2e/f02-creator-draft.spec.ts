import { test, expect } from '@playwright/test'
import { blankDraft, isBlank, parseDraft } from '../src/lib/creatorDraft'

// Pure rules checks: no browser, no database.
test.describe('F02 creator draft survives a refresh', () => {
  test('F02-E1 a draft with choices round-trips', () => {
    const draft = { ...blankDraft(), tab: 'hp', classId: 'fighter', name: 'Corvo', hpMax: 9 }
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft)
  })

  test('F02-E1b an untouched form is not kept', () => {
    expect(isBlank(blankDraft())).toBe(true)
    expect(parseDraft(JSON.stringify(blankDraft()))).toBeNull()
  })

  test('F02-N1 nothing, junk or another version reads as no draft', () => {
    for (const raw of [null, '', 'not json', 'null', '42', JSON.stringify({ v: 2, name: 'x' })]) {
      expect(parseDraft(raw), String(raw)).toBeNull()
    }
  })

  test('F02-E6 a draft missing newer fields still opens with blanks', () => {
    const parsed = parseDraft(JSON.stringify({ v: 1, name: 'Corvo' }))
    expect(parsed?.name).toBe('Corvo')
    expect(parsed?.impulses).toEqual(blankDraft().impulses)
    expect(parsed?.statRolls).toEqual([])
  })
})
