import type { LevelEntry } from '@/types/progression.types'

/** The advancement track runs 1 → 20. */
export const MIN_LEVEL = 1
export const MAX_LEVEL = 20

/** Every level on the track, in order — the boxes of the progress strip. */
export const LEVELS: number[] = Array.from({ length: MAX_LEVEL }, (_, i) => i + 1)

/** The two things a level can hand out. */
export type LevelRewardKind = 'hp' | 'talent'

/**
 * What a level grants:
 *   - every level-up rolls the class hit die for HP
 *   - odd levels additionally roll 2d6 on the class talent table
 *
 * Level 1 has no hit-die roll here: its HP is the base roll from creation,
 * which is also the one place the CON modifier is counted. Per-level HP is the
 * raw die, never re-adding CON.
 */
export function rewardsFor(level: number): LevelRewardKind[] {
  const rewards: LevelRewardKind[] = []
  if (level > MIN_LEVEL) rewards.push('hp')
  if (level % 2 === 1) rewards.push('talent')
  return rewards
}

/** XP needed to leave `level`. Mirrors the sheet's XP bar (`level * 10`). */
export function xpForLevel(level: number): number {
  return level * 10
}

export function isRewardDone(entry: LevelEntry | undefined, kind: LevelRewardKind): boolean {
  if (!entry) return false
  return kind === 'hp' ? entry.hpGain != null : entry.talentId != null
}

/**
 * Display state of one box on the track.
 * - `sealed`  — every reward the level offers has been rolled and applied
 * - `open`    — the character has reached the level with rolls still pending
 * - `locked`  — beyond the character's current level
 */
export type LevelStatus = 'sealed' | 'open' | 'locked'

export interface LevelState {
  level: number
  /** Everything this level offers, in display order. */
  rewards: LevelRewardKind[]
  /** The subset of `rewards` already rolled. */
  done: LevelRewardKind[]
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
  const rewards = rewardsFor(level)
  const done = rewards.filter(kind => isRewardDone(entry, kind))
  // A fully-rolled level stays sealed even if the character later steps back
  // below it — the HP and the talent are already on the sheet.
  const status: LevelStatus =
    done.length === rewards.length ? 'sealed' : level <= characterLevel ? 'open' : 'locked'

  return { level, rewards, done, status, isCurrent: level === characterLevel, entry }
}

/** The whole track, ready to render. */
export function buildTrack(characterLevel: number, entries: LevelEntry[]): LevelState[] {
  return LEVELS.map(level => levelState(level, characterLevel, entries))
}

/** How many of the reached levels are fully resolved — drives the header count. */
export function sealedCount(characterLevel: number, entries: LevelEntry[]): number {
  let count = 0
  for (let level = MIN_LEVEL; level <= characterLevel; level++) {
    const entry = findEntry(entries, level)
    if (rewardsFor(level).every(kind => isRewardDone(entry, kind))) count++
  }
  return count
}

/** Replaces the entry for `entry.level`, or appends it, keeping the array ordered. */
export function upsertEntry(entries: LevelEntry[], entry: LevelEntry): LevelEntry[] {
  const rest = entries.filter(e => e.level !== entry.level)
  return [...rest, entry].sort((a, b) => a.level - b.level)
}

export function removeEntry(entries: LevelEntry[], level: number): LevelEntry[] {
  return entries.filter(e => e.level !== level)
}

/**
 * Undo one reward. Odd levels carry two, so this trims a single roll off the
 * entry and returns null only once the level has nothing left to remember.
 */
export function clearReward(entry: LevelEntry, kind: LevelRewardKind): LevelEntry | null {
  const next: LevelEntry = { ...entry }
  if (kind === 'hp') {
    delete next.hpRoll
    delete next.hpDie
    delete next.hpGain
    delete next.conMod
  } else {
    delete next.talentId
    delete next.talentRoll
    delete next.talentDie1
    delete next.talentDie2
    delete next.talentEffect
  }
  return next.hpGain == null && next.talentId == null ? null : next
}
