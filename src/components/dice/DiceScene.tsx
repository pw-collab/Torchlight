'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DieGlyph } from '@/components/dice/DieGlyph'
import { DICE_EASE, DICE_SPRING, DICE_TIME, seededRandom, type HeroKind, type RollPhase } from '@/lib/diceMotion'

/* ============================================================
   DiceScene — pseudo-3D tumbling dice.

   Each die is an SVG glyph tossed with CSS 3D rotations
   (rotateX/Y/Z + translate + scale, all compositor-friendly),
   with its face value cycling at a decelerating rate while
   airborne. Physics is faked, feel is real: throw uses a hard
   ease-out (violent launch, long decel), landing is a spring
   with one visible overshoot. Crits/fumbles insert a slow-motion
   final bounce while a colored halo ramps up behind the die.
   ============================================================ */

export interface SceneDie {
  finalValue: number
  /** Each die carries its own shape, so a mixed pool draws as one. */
  sides: number
  /** false for the discarded advantage/disadvantage die. */
  kept: boolean
}

interface Props {
  phase: RollPhase
  dice: SceneDie[]
  hero: HeroKind
  /** Roll id — seeds each die's tumble arc so re-renders don't reshuffle it. */
  seed: string
  size?: number
}

const HALO = {
  crit:   'radial-gradient(circle, var(--chart-1) 0%, var(--primary) 45%, transparent 70%)',
  fumble: 'radial-gradient(circle, var(--destructive) 0%, var(--destructive) 45%, transparent 70%)',
  normal: 'radial-gradient(circle, var(--border) 0%, transparent 65%)',
}

function dieColors(hero: HeroKind, landed: boolean, kept: boolean) {
  if (landed && hero === 'crit' && kept) return { shape: 'var(--chart-1)', num: 'var(--secondary)' }
  if (landed && hero === 'fumble' && kept) return { shape: 'var(--destructive)', num: 'var(--foreground)' }
  return { shape: 'var(--primary)', num: 'var(--secondary)' }
}

function TumblingDie({ phase, die, hero, seed, index, size, reduced }: {
  phase: RollPhase
  die: SceneDie
  hero: HeroKind
  seed: string
  index: number
  size: number
  reduced: boolean
}) {
  const sides = die.sides
  // Per-die stable randomness: spin magnitudes and direction.
  const arc = useMemo(() => {
    const rand = seededRandom(`${seed}:${index}`)
    const dir = index % 2 === 0 ? 1 : -1
    return {
      dir,
      spinX: dir * Math.round(400 + rand() * 280),
      spinY: -dir * Math.round(260 + rand() * 220),
      spinZ: dir * Math.round(480 + rand() * 240),
      drift: dir * Math.round(14 + rand() * 18),
    }
  }, [seed, index])

  // Face value cycles while airborne, decelerating like a real die losing
  // energy. State only holds the cycling value; at rest we render the final
  // value directly, so no effect ever has to "reset" it synchronously.
  const airborne = phase === 'tumble' || phase === 'slowmo'
  const [cyclingFace, setCyclingFace] = useState(1)
  useEffect(() => {
    if (!airborne) return
    let delay = phase === 'tumble' ? 45 : 150
    let timeout: ReturnType<typeof setTimeout>
    const tick = () => {
      setCyclingFace(1 + Math.floor(Math.random() * sides))
      if (phase === 'tumble') delay = Math.min(delay * 1.16, 130)
      timeout = setTimeout(tick, delay)
    }
    timeout = setTimeout(tick, 0)
    return () => clearTimeout(timeout)
  }, [airborne, phase, sides])
  const face = airborne ? cyclingFace : die.finalValue

  const landed = phase === 'landed'
  const colors = dieColors(hero, landed, die.kept)

  const animate =
    reduced || landed
      ? {
          x: 0, y: 0, rotateX: 0, rotateY: 0, rotateZ: 0,
          scale: die.kept ? (reduced ? [0.96, 1] : [1.16, 1]) : 0.86,
          opacity: die.kept ? 1 : 0.45,
          transition: reduced ? { duration: 0.3, ease: 'easeOut' as const } : DICE_SPRING.settle,
        }
      : phase === 'charge'
      ? {
          x: [0, -3, 3, -2, 2, 0],
          y: [0, 3, 5],
          rotateZ: [0, -4, 4, -3, 0],
          scale: 0.9,
          opacity: 1,
          transition: { duration: DICE_TIME.charge / 1000, ease: 'easeInOut' as const },
        }
      : phase === 'tumble'
      ? {
          x: [-arc.drift * 2, arc.drift, 0],
          y: [14, -76, 0],
          rotateX: [0, arc.spinX],
          rotateY: [0, arc.spinY],
          rotateZ: [0, arc.spinZ],
          scale: [0.9, 1.18, 1.02],
          opacity: 1,
          transition: {
            duration: DICE_TIME.tumble / 1000,
            ease: DICE_EASE.throw,
            y: { duration: DICE_TIME.tumble / 1000, times: [0, 0.42, 1], ease: ['easeOut', 'easeIn'] as const },
          },
        }
      : phase === 'slowmo'
      ? {
          x: 0,
          y: [0, -34, 0],
          rotateX: 0,
          rotateY: 0,
          rotateZ: [0, arc.dir * 16, arc.dir * 5],
          scale: [1.02, 1.1, 1.04],
          opacity: 1,
          transition: {
            duration: DICE_TIME.slowmo / 1000,
            ease: 'easeInOut' as const,
            y: { duration: DICE_TIME.slowmo / 1000, times: [0, 0.5, 1], ease: ['easeOut', 'easeIn'] as const },
          },
        }
      : { x: 0, y: 0, scale: 1, opacity: 1 }

  // Halo behind the die: ramps during slow-mo, blooms on a hero landing,
  // gives a single soft pulse on a normal landing.
  const haloAnimate = landed
    ? hero && die.kept
      ? { opacity: [1, 0.55], scale: [1.5, 1.15], transition: { duration: 0.7, ease: 'easeOut' as const } }
      : { opacity: [0.5, 0], scale: [1.1, 1.35], transition: { duration: 0.5, ease: 'easeOut' as const } }
    : phase === 'slowmo'
    ? { opacity: [0, 0.85], scale: [0.7, 1.3], transition: { duration: DICE_TIME.slowmo / 1000, ease: 'easeIn' as const } }
    : { opacity: 0, scale: 0.7 }

  return (
    <div style={{ position: 'relative', width: size, height: size, perspective: 600 }}>
      {!reduced && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={haloAnimate}
          style={{
            position: 'absolute', inset: -size * 0.45,
            background: HALO[hero ?? 'normal'],
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
      )}
      <motion.div
        initial={false}
        animate={animate}
        style={{ width: size, height: size, transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <DieGlyph sides={sides} value={face} size={size} shapeColor={colors.shape} numberColor={colors.num} />
      </motion.div>
    </div>
  )
}

export function DiceScene({ phase, dice, hero, seed, size = 96 }: Props) {
  const reduced = !!useReducedMotion()
  // A handful needs to fit the tray, so dice shrink as the pool grows.
  const scale = dice.length > 4 ? 0.6 : dice.length > 2 ? 0.7 : dice.length > 1 ? 0.82 : 1
  const dieSize = Math.round(size * scale)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexWrap: 'wrap', gap: 14, maxWidth: 'min(90vw, 460px)', minHeight: size + 24,
    }}>
      {dice.map((die, i) => (
        <TumblingDie
          key={`${seed}:${i}`}
          phase={phase}
          die={die}
          hero={hero}
          seed={seed}
          index={i}
          size={dieSize}
          reduced={reduced}
        />
      ))}
    </div>
  )
}
