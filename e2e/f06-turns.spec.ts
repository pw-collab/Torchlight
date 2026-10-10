import { test, expect } from '@playwright/test'
import type { Encounter, EncounterActor } from '../src/types/encounter.types'
import {
  NO_TURNS,
  combatStatus,
  combatTurn,
  explorationStatus,
  nextUp,
  sideDone,
  sideOrder,
  trackOrder,
  type TurnLedger,
} from '../src/lib/turns'

// F06: group initiative and the turn a player takes. Pure checks of the rule
// the screen reads; the database enforces the same one (migration 022), and
// the two have to agree on whose turn it is.

function encounter(fields: Partial<Encounter> = {}): Encounter {
  return {
    id: 'e1', sessionId: 's1', name: 'Goblins', round: 1,
    pcInitiative: 5, npcInitiative: 3, status: 'active', createdAt: '2026-10-10T00:00:00Z',
    ...fields,
  }
}

function actor(id: string, source: 'pc' | 'npc', fields: Partial<EncounterActor> = {}): EncounterActor {
  return {
    id, encounterId: 'e1', source, refId: source === 'pc' ? `char-${id}` : null, name: id,
    hpCurrent: 5, hpMax: 5, ac: 12, atkBonus: 1, damageDie: '1d6',
    conditions: [], defeated: false, sortKey: 0,
    ...fields,
  }
}

const corvo = actor('corvo', 'pc', { sortKey: 0 })
const hilda = actor('hilda', 'pc', { sortKey: 1 })
const goblin = actor('goblin', 'npc', { sortKey: 2 })
const goblin2 = actor('goblin2', 'npc', { sortKey: 3 })
const all = [goblin2, hilda, goblin, corvo]

const ledger = (fields: Partial<TurnLedger> = {}): TurnLedger => ({ ...NO_TURNS, ...fields })

test('the higher d6 goes first, and a tie goes to the party', () => {
  expect(sideOrder(encounter({ pcInitiative: 5, npcInitiative: 3 }))).toEqual(['pc', 'npc'])
  expect(sideOrder(encounter({ pcInitiative: 2, npcInitiative: 6 }))).toEqual(['npc', 'pc'])
  expect(sideOrder(encounter({ pcInitiative: 4, npcInitiative: 4 }))).toEqual(['pc', 'npc'])
  expect(sideOrder(encounter({ pcInitiative: null }))).toBeNull()
})

test('nobody takes a turn until both dice are in', () => {
  const turn = combatTurn(encounter({ pcInitiative: null }), all, NO_TURNS)
  expect(turn.stage).toBe('initiative')
  expect(combatStatus(turn, corvo)).toBe('waiting')
  expect(combatStatus(turn, undefined)).toBe('out')
})

test('within the party, anyone can take the turn, and the rest wait for it to end', () => {
  const free = combatTurn(encounter(), all, NO_TURNS)
  expect(free.stage === 'turns' && free.side).toBe('pc')
  expect(combatStatus(free, corvo)).toBe('ready')
  expect(combatStatus(free, hilda)).toBe('ready')
  expect(combatStatus(free, goblin)).toBe('waiting')

  const busy = combatTurn(encounter(), all, ledger({ actingKey: 'pc:char-hilda', actingName: 'hilda' }))
  expect(combatStatus(busy, hilda)).toBe('acting')
  expect(combatStatus(busy, corvo)).toBe('waiting')

  const after = combatTurn(encounter(), all, ledger({ acted: ['pc:char-hilda'] }))
  expect(combatStatus(after, hilda)).toBe('done')
  expect(combatStatus(after, corvo)).toBe('ready')
})

test('the whole party acts before the other side, then the GM moves the foes in order', () => {
  const turn = combatTurn(encounter(), all, ledger({ acted: ['pc:char-corvo', 'pc:char-hilda'] }))
  expect(turn.stage === 'turns' && turn.side).toBe('npc')
  expect(combatStatus(turn, goblin)).toBe('ready')
  expect(nextUp(turn, all, 'npc')?.id).toBe('goblin')

  const one = combatTurn(encounter(), all, ledger({ acted: ['pc:char-corvo', 'pc:char-hilda', 'npc:goblin'] }))
  expect(nextUp(one, all, 'npc')?.id).toBe('goblin2')
})

test('whoever is out of the fight does not hold the round', () => {
  const down = [corvo, { ...hilda, defeated: true }, goblin, goblin2]
  const turn = combatTurn(encounter(), down, ledger({ acted: ['pc:char-corvo'] }))
  expect(turn.stage === 'turns' && turn.side).toBe('npc')
  expect(combatStatus(turn, down[1])).toBe('out')
})

test('a round nobody turned over shows as the next one', () => {
  const everyone = ['pc:char-corvo', 'pc:char-hilda', 'npc:goblin', 'npc:goblin2']
  const turn = combatTurn(encounter({ round: 2 }), all, ledger({ acted: everyone }))
  expect(turn.stage === 'turns' && turn.round).toBe(3)
  expect(turn.stage === 'turns' && turn.side).toBe('pc')
  expect(combatStatus(turn, corvo)).toBe('ready')
})

test('when the foes won the d6, they open every round', () => {
  const foesFirst = encounter({ pcInitiative: 2, npcInitiative: 6 })
  expect(trackOrder(foesFirst, all).map(a => a.id)).toEqual(['goblin', 'goblin2', 'corvo', 'hilda'])
  const turn = combatTurn(foesFirst, all, NO_TURNS)
  expect(turn.stage === 'turns' && turn.side).toBe('npc')
  expect(combatStatus(turn, corvo)).toBe('waiting')
})

test('a newcomer whose side already went waits for the next round', () => {
  const partyDone = combatTurn(encounter(), all, ledger({ acted: ['pc:char-corvo', 'pc:char-hilda'] }))
  expect(sideDone(partyDone, 'pc')).toBe(true)
  expect(sideDone(partyDone, 'npc')).toBe(false)

  const partyUp = combatTurn(encounter(), all, NO_TURNS)
  expect(sideDone(partyUp, 'pc')).toBe(false)
  expect(sideDone(partyUp, 'npc')).toBe(false)
})

test('exploration runs on turns too: one each, one at a time', () => {
  expect(explorationStatus(NO_TURNS, 'pc:a', false)).toBe('ready')
  expect(explorationStatus(ledger({ actingKey: 'pc:a' }), 'pc:a', false)).toBe('acting')
  expect(explorationStatus(ledger({ actingKey: 'pc:a' }), 'pc:b', false)).toBe('waiting')
  expect(explorationStatus(ledger({ acted: ['pc:a'] }), 'pc:a', false)).toBe('done')
  expect(explorationStatus(NO_TURNS, 'pc:a', true)).toBe('out')
})
