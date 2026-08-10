'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_TIME, heroKind, parseDie, type RollPhase } from '@/lib/diceMotion'
import { canRenderIn3D, supportsWebGL } from '@/lib/diceEngine'
import { useDiceSound } from '@/hooks/useDiceSound'

/* ============================================================
   useDiceRoll — the roll lifecycle state machine.

   Drives the phase timeline for a roll result and fires sound +
   haptics on each beat. Roll math stays in lib/dice.ts; render
   work stays in DiceStage / DiceScene / DiceOverlay. This hook
   only owns time.

   Two ways a roll can be performed:

   physics — open-dice-dnd throws real dice on a WebGL table.
             charge → tumble → landed, where "landed" is whenever
             the dice actually stop, reported by DiceStage. The
             engine supplies its own impact audio and crit drama,
             so no clatter beat and no slow-mo phase here.

   timed   — the hand-animated SVG scene, on a fixed clock:
             charge → tumble → landed, plus a slowmo beat for
             crits and fumbles. Used for reduced motion, dice the
             engine can't render, and any WebGL failure.
   ============================================================ */

function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch { /* unsupported */ }
  }
}

/** Which renderer is performing the current roll. */
export type RollMode = 'timed' | 'physics'

interface Options {
  /** Fired on the landing frame — push history/toasts here. */
  onSettled?: (result: RollResult) => void
}

export function useDiceRoll({ onSettled }: Options = {}) {
  const [phase, setPhase] = useState<RollPhase>('idle')
  const [roll, setRoll] = useState<RollResult | null>(null)
  const [mode, setMode] = useState<RollMode>('timed')
  const reduced = useReducedMotion()
  const sound = useDiceSound()

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const settledRef = useRef(onSettled)
  useEffect(() => { settledRef.current = onSettled }, [onSettled])

  // The roll in flight, readable from callbacks the table calls back into.
  const rollRef = useRef<RollResult | null>(null)
  // Id of the roll that already landed, so a late settle callback racing the
  // watchdog can't fire the landing beat twice.
  const landedRef = useRef<string | null>(null)
  // Latches on the first WebGL failure: once the table is known broken, every
  // later roll goes straight to the SVG scene instead of retrying.
  const tableBroken = useRef(false)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])
  useEffect(() => clearTimers, [clearTimers])

  const schedule = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms))
  }, [])

  /** The impact frame: sound, haptics, result panel, history. */
  const land = useCallback((result: RollResult) => {
    if (landedRef.current === result.id) return
    landedRef.current = result.id
    const kind = heroKind(result)

    setPhase('landed')
    sound.land(kind)
    haptic(kind === 'crit' ? [30, 40, 60] : kind === 'fumble' ? 80 : 20)
    settledRef.current?.(result)
    schedule(DICE_TIME.linger, () => setPhase('idle'))
  }, [schedule, sound])

  /**
   * The clock-driven timeline. `fromCharge` is false when we're rescuing a
   * physics roll that failed after the anticipation beat already played.
   */
  const runTimed = useCallback((result: RollResult, fromCharge: boolean) => {
    const kind = heroKind(result)
    const diceCount = result.dice?.length ?? parseDie(result.die).count
    const tumbleStart = fromCharge ? DICE_TIME.charge : 0
    const landAt = tumbleStart + DICE_TIME.tumble + (kind ? DICE_TIME.slowmo : 0)

    if (fromCharge) {
      setPhase('charge')
      sound.rattle()
      haptic(8)
    }
    schedule(tumbleStart, () => {
      setPhase('tumble')
      sound.clatter(diceCount, DICE_TIME.tumble)
    })
    if (kind) schedule(tumbleStart + DICE_TIME.tumble, () => setPhase('slowmo'))
    schedule(landAt, () => land(result))
  }, [land, schedule, sound])

  const startRoll = useCallback((result: RollResult) => {
    clearTimers()
    landedRef.current = null
    rollRef.current = result
    setRoll(result)

    if (reduced) {
      setMode('timed')
      landedRef.current = result.id
      setPhase('landed')
      settledRef.current?.(result)
      schedule(DICE_TIME.lingerReduced, () => setPhase('idle'))
      return
    }

    const physics = !tableBroken.current && supportsWebGL() && canRenderIn3D(result)
    setMode(physics ? 'physics' : 'timed')

    if (!physics) {
      runTimed(result, true)
      return
    }

    // Anticipation, then hand off: DiceStage throws once we reach 'tumble'
    // and calls settle() when the dice stop.
    setPhase('charge')
    sound.rattle()
    haptic(8)
    schedule(DICE_TIME.charge, () => setPhase('tumble'))
    schedule(DICE_TIME.charge + DICE_TIME.settleTimeout, () => land(result))
  }, [clearTimers, reduced, runTimed, land, schedule, sound])

  /** Called by DiceStage when the dice come to rest. */
  const settle = useCallback((rollId: string) => {
    const current = rollRef.current
    if (!current || current.id !== rollId) return
    // A slow table can settle *after* the watchdog already landed the roll.
    // Bail before clearing timers — the linger countdown that fades the
    // overlay is one of them, and cancelling it would strand the result
    // on screen forever.
    if (landedRef.current === current.id) return
    clearTimers()
    land(current)
  }, [clearTimers, land])

  /** Called by DiceStage when the table can't perform the roll after all. */
  const fallBackToTimed = useCallback(() => {
    tableBroken.current = true
    setMode('timed')
    const current = rollRef.current
    if (!current || landedRef.current === current.id) return
    clearTimers()
    runTimed(current, false)
  }, [clearTimers, runTimed])

  return {
    phase,
    roll,
    mode,
    startRoll,
    settle,
    fallBackToTimed,
    /** The roll DiceStage should throw — set once the anticipation beat ends. */
    throwRoll: mode === 'physics' && phase !== 'idle' && phase !== 'charge' ? roll : null,
  }
}
