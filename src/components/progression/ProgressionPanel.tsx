'use client'

import { useMemo, useState } from 'react'
import { getClass, rollClassTalent } from '@/data/classes/index'
import { modifier } from '@/lib/dice'
import {
  MAX_LEVEL,
  MIN_LEVEL,
  buildTrack,
  removeEntry,
  sealedCount,
  upsertEntry,
  xpForLevel,
} from '@/lib/progression'
import type { LevelEntry } from '@/types/progression.types'
import type { Talent } from '@/types/talent.types'
import { LevelCard } from './LevelCard'
import { LevelTrack } from './LevelTrack'

/** Everything a progression action can change. Only the touched keys are sent. */
export interface ProgressionCommit {
  level?: number
  hpMax?: number
  hpGain?: number
  talents?: Talent[]
  levelProgress?: LevelEntry[]
}

interface Props {
  classId: string
  level: number
  xp: number
  con: number
  hpMax: number
  talents: Talent[]
  levelProgress: LevelEntry[]
  onCommit: (patch: ProgressionCommit) => Promise<void>
}

/**
 * The "Progresso" tab — a battlepass-style climb from level 1 to 20.
 *
 * The strip of level boxes is pinned to the bottom of the viewport (the page
 * shell hides its own preview strip while this tab is open) and the body shows
 * the card for whichever level is selected. Rolls apply the moment they land:
 * HP is added to the maximum, talents are pushed onto the character's talents.
 */
export function ProgressionPanel({
  classId,
  level,
  xp,
  con,
  hpMax,
  talents,
  levelProgress,
  onCommit,
}: Props) {
  const [selected, setSelected] = useState(level)
  const [busy, setBusy] = useState(false)

  const classData = getClass(classId)
  const conMod = modifier(con)
  const track = useMemo(() => buildTrack(level, levelProgress), [level, levelProgress])
  const state = track[selected - 1] ?? track[0]
  const xpNeeded = xpForLevel(level)
  const done = sealedCount(level, levelProgress)

  /** Short pause so the roll reads as a roll rather than an instant number swap. */
  function withRollDelay(apply: () => Promise<void>) {
    setBusy(true)
    setTimeout(async () => {
      try {
        await apply()
      } finally {
        setBusy(false)
      }
    }, 260)
  }

  function handleRoll() {
    if (!classData || busy || state.status !== 'open') return

    if (state.kind === 'hp') {
      withRollDelay(async () => {
        const roll = Math.floor(Math.random() * classData.hitDie) + 1
        const gain = Math.max(1, roll + conMod)
        const entry: LevelEntry = {
          level: state.level,
          kind: 'hp',
          hpRoll: roll,
          hpDie: classData.hitDie,
          conMod,
          hpGain: gain,
          sealedAt: new Date().toISOString(),
        }
        await onCommit({
          hpMax: hpMax + gain,
          hpGain: gain,
          levelProgress: upsertEntry(levelProgress, entry),
        })
      })
      return
    }

    withRollDelay(async () => {
      const result = rollClassTalent(classData.id)
      if (!result) return
      const talent: Talent = {
        id: Math.random().toString(36).substring(2, 9),
        name: result.entry.effect,
        origin: 'class',
        description: `Nível ${state.level} — 2d6: ${result.roll} (${result.die1}+${result.die2}) — ${classData.name}`,
      }
      const entry: LevelEntry = {
        level: state.level,
        kind: 'talent',
        talentId: talent.id,
        talentRoll: result.roll,
        talentDie1: result.die1,
        talentDie2: result.die2,
        talentEffect: result.entry.effect,
        sealedAt: new Date().toISOString(),
      }
      await onCommit({
        talents: [...talents, talent],
        levelProgress: upsertEntry(levelProgress, entry),
      })
    })
  }

  async function handleUndo() {
    const entry = state.entry
    if (!entry || busy) return
    setBusy(true)
    try {
      if (entry.kind === 'hp') {
        const gain = entry.hpGain ?? 0
        await onCommit({
          hpMax: Math.max(1, hpMax - gain),
          hpGain: -gain,
          levelProgress: removeEntry(levelProgress, entry.level),
        })
      } else {
        await onCommit({
          talents: talents.filter(t => t.id !== entry.talentId),
          levelProgress: removeEntry(levelProgress, entry.level),
        })
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleAdvance() {
    if (busy || level >= MAX_LEVEL) return
    setBusy(true)
    try {
      const next = level + 1
      await onCommit({ level: next })
      setSelected(next)
    } finally {
      setBusy(false)
    }
  }

  async function handleRegress() {
    if (busy || level <= MIN_LEVEL) return
    setBusy(true)
    try {
      const previous = level - 1
      await onCommit({ level: previous })
      setSelected(previous)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="flex w-full flex-col items-center gap-5">
        {/* Season header — where the character stands on the whole track */}
        <div className="flex w-full max-w-[520px] items-end justify-between gap-4 border-b border-[var(--border)] pb-3">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[8px] tracking-[0.24em] text-[var(--muted-foreground)] uppercase">
              Progresso · {classData?.name ?? classId}
            </span>
            <span className="font-heading text-[26px] leading-none font-black text-[var(--parchment-pale)]">
              Nível {level}
              <span className="font-mono ml-2 align-middle text-[10px] tracking-[0.12em] text-[var(--muted-foreground)]">
                / {MAX_LEVEL}
              </span>
            </span>
          </div>
          <span className="font-mono pb-1 text-[8px] tracking-[0.12em] text-[var(--muted-foreground)]">
            {done} de {level} resolvidos
          </span>
        </div>

        <LevelCard
          state={state}
          classData={classData}
          con={con}
          conMod={conMod}
          hpMax={hpMax}
          xp={xp}
          xpNeeded={xpNeeded}
          characterLevel={level}
          busy={busy}
          onRoll={handleRoll}
          onUndo={handleUndo}
          onAdvance={handleAdvance}
          onRegress={handleRegress}
        />
      </div>

      {/* The strip lives at the bottom edge, the way a battlepass track does. */}
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border)] px-2 pt-1 pb-[calc(10px+var(--safe-bottom))] backdrop-blur-[6px]">
        <div className="mx-auto w-full max-w-[1100px]">
          <LevelTrack
            track={track}
            selected={selected}
            hitDie={classData?.hitDie ?? 8}
            currentProgress={xpNeeded > 0 ? xp / xpNeeded : 1}
            onSelect={setSelected}
          />
        </div>
      </div>
    </>
  )
}
