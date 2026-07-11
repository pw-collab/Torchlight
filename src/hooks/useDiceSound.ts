'use client'

import { useCallback, useMemo, useRef } from 'react'
import type { HeroKind } from '@/lib/diceMotion'

/* ============================================================
   Dice SFX — synthesized with WebAudio, zero binary assets.
   Everything is quiet by design: table-feel, not fanfare.
   The AudioContext is created lazily on the first roll, which
   always happens inside a user gesture (autoplay-policy safe).
   ============================================================ */

const MASTER_GAIN = 0.8

export function useDiceSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const noiseRef = useRef<AudioBuffer | null>(null)

  const ensure = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null
    try {
      if (!ctxRef.current) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AC) return null
        ctxRef.current = new AC()
      }
      const ctx = ctxRef.current
      if (ctx.state === 'suspended') void ctx.resume()
      if (!noiseRef.current) {
        const len = Math.floor(ctx.sampleRate * 0.12)
        const buf = ctx.createBuffer(1, len, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
        noiseRef.current = buf
      }
      return ctx
    } catch {
      return null
    }
  }, [])

  /** One filtered noise tick — a die edge striking the table. */
  const tap = useCallback((ctx: AudioContext, when: number, freq: number, gain: number, dur = 0.05) => {
    const src = ctx.createBufferSource()
    src.buffer = noiseRef.current!
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = freq
    bp.Q.value = 1.1
    const g = ctx.createGain()
    g.gain.setValueAtTime(gain * MASTER_GAIN, when)
    g.gain.exponentialRampToValueAtTime(0.0008, when + dur)
    src.connect(bp)
    bp.connect(g)
    g.connect(ctx.destination)
    src.start(when)
    src.stop(when + dur)
  }, [])

  /** Pre-roll: dice rattling in a cupped hand. */
  const rattle = useCallback(() => {
    const ctx = ensure()
    if (!ctx) return
    const t = ctx.currentTime
    for (let i = 0; i < 4; i++) {
      tap(ctx, t + i * 0.055 + Math.random() * 0.015, 2600 + Math.random() * 900, 0.045, 0.035)
    }
  }, [ensure, tap])

  /** Airborne clatter — burst count scales with number of dice. */
  const clatter = useCallback((diceCount: number, durationMs: number) => {
    const ctx = ensure()
    if (!ctx) return
    const t = ctx.currentTime
    const hits = Math.min(3 + diceCount * 2, 9)
    for (let i = 0; i < hits; i++) {
      const p = i / hits
      tap(ctx, t + p * (durationMs / 1000) * 0.9, 1400 + Math.random() * 1200, 0.085 * (1 - p * 0.55), 0.06)
    }
  }, [ensure, tap])

  /** Impact: low thunk, plus a sting (crit) or an ominous drone (fumble). */
  const land = useCallback((kind: HeroKind) => {
    const ctx = ensure()
    if (!ctx) return
    const t = ctx.currentTime

    // The thunk — pitch-dropping sine with a noise click on top.
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, t)
    osc.frequency.exponentialRampToValueAtTime(48, t + 0.13)
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.3 * MASTER_GAIN, t)
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.17)
    tap(ctx, t, 900, 0.11, 0.04)

    if (kind === 'crit') {
      // Ascending triad sting — a small golden fanfare.
      const notes = [880, 1108.73, 1318.51, 1760]
      notes.forEach((f, i) => {
        const o = ctx.createOscillator()
        o.type = 'triangle'
        o.frequency.value = f
        const og = ctx.createGain()
        const start = t + 0.06 + i * 0.07
        og.gain.setValueAtTime(0.0001, start)
        og.gain.exponentialRampToValueAtTime(0.07 * MASTER_GAIN, start + 0.02)
        og.gain.exponentialRampToValueAtTime(0.0008, start + 0.5)
        o.connect(og)
        og.connect(ctx.destination)
        o.start(start)
        o.stop(start + 0.55)
      })
    } else if (kind === 'fumble') {
      // Two barely-detuned saws through a lowpass — a short dread chord.
      ;[98, 101.5].forEach(f => {
        const o = ctx.createOscillator()
        o.type = 'sawtooth'
        o.frequency.value = f
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 420
        const og = ctx.createGain()
        og.gain.setValueAtTime(0.09 * MASTER_GAIN, t + 0.05)
        og.gain.exponentialRampToValueAtTime(0.0008, t + 0.75)
        o.connect(lp)
        lp.connect(og)
        og.connect(ctx.destination)
        o.start(t + 0.05)
        o.stop(t + 0.8)
      })
    }
  }, [ensure, tap])

  return useMemo(() => ({ rattle, clatter, land }), [rattle, clatter, land])
}
