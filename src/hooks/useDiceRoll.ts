'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_TIME, heroKind, parseDie, type RollPhase } from '@/lib/diceMotion'
import { useDiceSound } from '@/hooks/useDiceSound'

/* ============================================================
   useDiceRoll — the roll lifecycle state machine.

   Drives the phase timeline for a roll result and fires sound +
   haptics on each beat. Roll math stays in lib/dice.ts; render
   work stays in DiceScene / DiceOverlay. This hook only owns time.

   Normal roll:      charge → tumble → landed
   Crit/fumble roll: charge → tumble → slowmo → landed
   Reduced motion:   straight to landed (gentle fade, no theatrics)
   ============================================================ */

function haptic(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern) } catch { /* unsupported */ }
  }
}

interface Options {
  /** Fired on the landing frame — push history/toasts here. */
  onSettled?: (result: RollResult) => void
}

export function useDiceRoll({ onSettled }: Options = {}) {
  const [phase, setPhase] = useState<RollPhase>('idle')
  const [roll, setRoll] = useState<RollResult | null>(null)
  const reduced = useReducedMotion()
  const sound = useDiceSound()

  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const settledRef = useRef(onSettled)
  useEffect(() => { settledRef.current = onSettled }, [onSettled])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])
  useEffect(() => clearTimers, [clearTimers])

  const startRoll = useCallback((result: RollResult) => {
    clearTimers()
    setRoll(result)
    const kind = heroKind(result)
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms))

    if (reduced) {
      setPhase('landed')
      settledRef.current?.(result)
      at(DICE_TIME.lingerReduced, () => setPhase('idle'))
      return
    }

    const diceCount = result.rolls?.length ?? parseDie(result.die).count
    const tumbleStart = DICE_TIME.charge
    const landAt = tumbleStart + DICE_TIME.tumble + (kind ? DICE_TIME.slowmo : 0)

    setPhase('charge')
    sound.rattle()
    haptic(8)

    at(tumbleStart, () => {
      setPhase('tumble')
      sound.clatter(diceCount, DICE_TIME.tumble)
    })
    if (kind) at(tumbleStart + DICE_TIME.tumble, () => setPhase('slowmo'))
    at(landAt, () => {
      setPhase('landed')
      sound.land(kind)
      haptic(kind === 'crit' ? [30, 40, 60] : kind === 'fumble' ? 80 : 20)
      settledRef.current?.(result)
    })
    at(landAt + DICE_TIME.linger, () => setPhase('idle'))
  }, [clearTimers, reduced, sound])

  return { phase, roll, startRoll }
}
