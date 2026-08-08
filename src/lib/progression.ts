import type { LevelEntry, LevelRewardKind } from '@/types/progression.types'

/** The advancement track runs 1 → 20. */
export const MIN_LEVEL = 1
export const MAX_LEVEL = 20

/** Every level on the track, in order — the boxes of the progress strip. */
export const LEVELS: number[] = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)

/**
 * House rule: even levels roll the class hit die for HP, odd levels roll 2d6
 * on the class talent table. Level 1 counts as odd — the founding talent. The
 * *base* HP a character starts with is rolled during creation and stays on the
 * "Vitalidade" tab, so it is deliberately not duplicated here.
 */
export function rewardKindFor(level: number): LevelRewardKind {
  return level % 2 === 0 ? 'hp' : 'talent'
}

/** XP needed to leave `level`. Mirrors the sheet's XP bar (`level * 10`). */
export function xpForLevel(level: number): number {
  return level * 10
}

/**
 * Display state of one box on the track.
 * - `sealed`  — the level's reward has been rolled and applied
 * - `open`    — the character has reached the level but not rolled it yet
 * - `locked`  — beyond the character's current level
 */
export type LevelStatus = 'sealed' | 'open' | 'locked'

export interface LevelState {
  level: number
  kind: LevelRewardKind
  status: LevelStatus
  /** True for the box the character is standing on right now. */
  isCurrent: boolean
  entry?: LevelEntry
}

export function findEntry(entries: LevelEntry[], level: number): LevelEntry | undefined {
  return entries.find(e => e.level === level)
}

export function levelState(
  level: number,
  characterLevel: number,
  entries: LevelEntry[],
): LevelState {
  const entry = findEntry(entries, level)
  const reached = level <= characterLevel
  return {
    level,
    kind: rewardKindFor(level),
    status: entry ? 'sealed' : reached ? 'open' : 'locked',
    isCurrent: level === characterLevel,
    entry,
  }
}

/** The whole track, ready to render. */
export function buildTrack(characterLevel: number, entries: LevelEntry[]): LevelState[] {
  return LEVELS.map(level => levelState(level, characterLevel, entries))
}

/** How many of the reached levels have been resolved — drives the header count. */
export function sealedCount(characterLevel: number, entries: LevelEntry[]): number {
  return entries.filter(e => e.level <= characterLevel).length
}

/** Replaces the entry for `entry.level`, or appends it, keeping the array ordered. */
export function upsertEntry(entries: LevelEntry[], entry: LevelEntry): LevelEntry[] {
  const rest = entries.filter(e => e.level !== entry.level)
  return [...rest, entry].sort((a, b) => a.level - b.level)
}

export function removeEntry(entries: LevelEntry[], level: number): LevelEntry[] {
  return entries.filter(e => e.level !== level)
}
