'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { seededRandom, type HeroKind } from '@/lib/diceMotion'

/* ============================================================
   ResultBurst — the impact frame.

   Rendered once, on the landing beat: a radial flash, an
   expanding shockwave ring and a handful of sparks thrown
   outward. Color-coded: gold for crits, blood for fumbles,
   bone/amber for everything else. Transform/opacity only, and
   a hard cap on particle count, so multiple rapid rolls stay
   cheap. Not rendered at all under prefers-reduced-motion
   (the overlay simply doesn't mount it).
   ============================================================ */

const COLORS: Record<'crit' | 'fumble' | 'normal', string[]> = {
  crit:   ['#C9A84C', '#E0A040', '#F0E8D0'],
  fumble: ['#C42020', '#8B1515', '#FF444C'],
  normal: ['#C8B890', '#C4782A', '#8A7A5A'],
}

interface Props {
  hero: HeroKind
  /** Roll id — keeps the burst geometry stable across re-renders. */
  seed: string
}

export function ResultBurst({ hero, seed }: Props) {
  const kind = hero ?? 'normal'
  const count = hero ? 16 : 10

  const sparks = useMemo(() => {
    const rand = seededRandom(seed)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + rand() * 0.6
      const dist = (hero ? 66 : 48) + rand() * (hero ? 60 : 40)
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        size: 3 + rand() * 3.5,
        duration: 0.45 + rand() * 0.3,
        color: COLORS[kind][i % COLORS[kind].length],
      }
    })
  }, [seed, count, hero, kind])

  const ringColor = kind === 'crit' ? 'rgba(201,168,76,0.8)' : kind === 'fumble' ? 'rgba(196,32,32,0.75)' : 'rgba(200,184,144,0.55)'
  const flash = kind === 'crit'
    ? 'radial-gradient(circle, rgba(240,232,208,0.9) 0%, rgba(201,168,76,0.45) 40%, transparent 70%)'
    : kind === 'fumble'
    ? 'radial-gradient(circle, rgba(255,68,76,0.7) 0%, rgba(139,21,21,0.35) 40%, transparent 70%)'
    : 'radial-gradient(circle, rgba(240,232,208,0.6) 0%, rgba(196,120,42,0.25) 40%, transparent 70%)'

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'visible' }}>
      {/* Light flash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0, 0.9, 0], scale: [0.5, 1.4, 1.6] }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ position: 'absolute', width: 180, height: 180, background: flash, borderRadius: '50%' }}
      />
      {/* Shockwave ring */}
      <motion.div
        initial={{ opacity: 0.9, scale: 0.25 }}
        animate={{ opacity: 0, scale: hero ? 1.9 : 1.5 }}
        transition={{ duration: hero ? 0.55 : 0.45, ease: 'easeOut' }}
        style={{ position: 'absolute', width: 120, height: 120, border: `2px solid ${ringColor}`, borderRadius: '50%' }}
      />
      {/* Sparks */}
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: s.x, y: s.y, opacity: [1, 1, 0], scale: 0.35 }}
          transition={{ duration: s.duration, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: s.color,
            boxShadow: hero ? `0 0 6px ${s.color}` : 'none',
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}
