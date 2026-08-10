'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { DiceRoller } from 'open-dice-dnd'
import type { RollResult } from '@/lib/dice'
import {
  diceConfigFor,
  effectRulesFor,
  loadDiceEngine,
  readDiceTheme,
  supportsWebGL,
} from '@/lib/diceEngine'
import { collisionSfx } from '@/lib/diceSfx'

/* ============================================================
   DiceStage — the physics table.

   Owns one open-dice-dnd roller for the lifetime of the sheet: the
   WebGL context is expensive to build and browsers cap how many can
   exist, so it is created on the first throw and then reused, never
   torn down between rolls.

   The stage renders an outcome, it never picks one. Each die is given
   the face lib/dice.ts already rolled, and the engine pre-simulates a
   throw that lands on it.
   ============================================================ */

interface Props {
  /**
   * The roll to throw. Each distinct `id` is thrown once; hold the same
   * object across re-renders and nothing is re-thrown.
   */
  throwRoll: RollResult | null
  /** False once the overlay has faded — clears the table and idles the loop. */
  visible: boolean
  /** Fired when the dice come to rest. Carries the id that was thrown. */
  onSettled: (rollId: string) => void
  /** Fired when this roll can't be staged in 3D, so the caller can fall back. */
  onUnavailable: () => void
}

export function DiceStage({ throwRoll, visible, onSettled, onUnavailable }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rollerRef = useRef<DiceRoller | null>(null)
  const effectsRef = useRef<typeof import('open-dice-dnd')['effects'] | null>(null)
  const thrownRef = useRef<string | null>(null)
  const goneRef = useRef(false)

  // Callbacks are read through refs so a caller re-creating them inline
  // can't re-trigger a throw.
  const settledRef = useRef(onSettled)
  const unavailableRef = useRef(onUnavailable)
  useEffect(() => { settledRef.current = onSettled }, [onSettled])
  useEffect(() => { unavailableRef.current = onUnavailable }, [onUnavailable])

  useEffect(() => {
    goneRef.current = false
    return () => {
      goneRef.current = true
      rollerRef.current?.destroy()
      rollerRef.current = null
    }
  }, [])

  const ensureRoller = useCallback(async (): Promise<DiceRoller | null> => {
    if (rollerRef.current) return rollerRef.current
    if (!supportsWebGL()) return null

    const engine = await loadDiceEngine()
    if (!engine || goneRef.current) return null
    // Another throw may have built the roller while we awaited.
    if (rollerRef.current) return rollerRef.current

    const container = containerRef.current
    // The engine reads clientWidth/clientHeight once, in the constructor;
    // building against a zero-sized container yields a broken camera.
    if (!container?.clientWidth || !container.clientHeight) return null

    const sounds = await collisionSfx()
    if (goneRef.current) return null
    if (rollerRef.current) return rollerRef.current

    try {
      effectsRef.current = engine.effects
      rollerRef.current = new engine.DiceRoller({
        container,
        sounds,
        soundVolume: 0.45,
      })
    } catch (err) {
      console.warn('Could not start the 3D dice table.', err)
      return null
    }
    return rollerRef.current
  }, [])

  useEffect(() => {
    if (!throwRoll || thrownRef.current === throwRoll.id) return
    thrownRef.current = throwRoll.id

    const roll = throwRoll
    let cancelled = false

    void (async () => {
      const roller = await ensureRoller()
      if (cancelled || goneRef.current) return
      if (!roller) { unavailableRef.current(); return }

      const theme = readDiceTheme()
      const config = diceConfigFor(roll, theme)
      if (!config) { unavailableRef.current(); return }

      try {
        if (effectsRef.current) {
          roller.setEffectRules(effectRulesFor(roll, theme, effectsRef.current))
        }
        await roller.roll(config)
      } catch (err) {
        console.warn('The 3D dice throw failed.', err)
        if (!cancelled && !goneRef.current) unavailableRef.current()
        return
      }
      if (!cancelled && !goneRef.current) settledRef.current(roll.id)
    })()

    return () => { cancelled = true }
  }, [throwRoll, ensureRoller])

  // Clear the table once the overlay is gone, then stop the loop. The engine
  // keeps stepping physics and re-rendering every frame for as long as it is
  // animating, and never idles itself — left alone it would burn a core for
  // the whole session. The next roll() restarts it.
  useEffect(() => {
    if (visible) return
    const roller = rollerRef.current
    if (!roller) return

    let cancelled = false
    void roller.reset()
      .catch(() => {})
      .then(() => {
        if (!cancelled && !goneRef.current) roller.isAnimating = false
      })
    return () => { cancelled = true }
  }, [visible])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} aria-hidden />
}
