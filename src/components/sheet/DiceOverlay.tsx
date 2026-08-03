'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_SPRING, heroKind, parseDie, type RollPhase } from '@/lib/diceMotion'
import { DiceScene, type SceneDie } from '@/components/dice/DiceScene'
import { ResultBurst } from '@/components/dice/ResultBurst'

/* ============================================================
   DiceOverlay — the cinematic layer for a roll.

   Owns no timing of its own: it renders whatever phase
   useDiceRoll says we're in. Charge/tumble/slow-mo show the
   DiceScene; the landing frame adds the camera shake, the
   ResultBurst and the spring pop-in of the result panel, so
   every impact cue hits on the same beat.
   ============================================================ */

interface Props {
  phase: RollPhase
  roll: RollResult | null
}

/** Total counts up from the raw die result to the modified total. */
function CountUpTotal({ from, to, color, shadow, reduced }: {
  from: number
  to: number
  color: string
  shadow: string
  reduced: boolean
}) {
  const skip = reduced || from === to
  const [animated, setAnimated] = useState(from)
  useEffect(() => {
    if (skip) return
    const controls = animate(from, to, {
      duration: 0.35,
      delay: 0.22,
      ease: 'easeOut',
      onUpdate: v => setAnimated(Math.round(v)),
    })
    return () => controls.stop()
  }, [from, to, skip])
  const value = skip ? to : animated

  return (
    <motion.span
      initial={reduced ? { opacity: 0 } : { scale: 0.4, rotate: -8, opacity: 0 }}
      animate={reduced ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
      transition={reduced ? { duration: 0.25 } : DICE_SPRING.panel}
      style={{
        display: 'inline-block',
        fontFamily: 'var(--font-heading)',
        fontSize: 72,
        fontWeight: 700,
        lineHeight: 1,
        color,
        textShadow: shadow,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </motion.span>
  )
}

export function DiceOverlay({ phase, roll }: Props) {
  const reduced = !!useReducedMotion()
  const visible = phase !== 'idle' && roll !== null

  const hero = roll ? heroKind(roll) : null
  const isCritical = hero === 'crit'
  const isFumble = hero === 'fumble'
  const landed = phase === 'landed'

  const { sides } = roll ? parseDie(roll.die) : { sides: 20 }
  const dice: SceneDie[] =
    roll?.rolls && roll.rolls.length > 1
      ? roll.rolls.map(v => ({ finalValue: v, kept: v === roll.result }))
      : [{ finalValue: roll?.result ?? 20, kept: true }]
  // Advantage can roll doubles — make sure exactly one die reads as kept.
  if (dice.filter(d => d.kept).length > 1) {
    let found = false
    for (const d of dice) {
      if (d.kept && found) d.kept = false
      if (d.kept) found = true
    }
  }

  const borderColor = isCritical && landed
    ? 'var(--chart-1)'
    : isFumble && landed
    ? 'var(--destructive)'
    : 'var(--border)'

  const numberColor = isCritical ? 'var(--gold-bright)' : isFumble ? 'var(--primary)' : 'var(--muted-foreground)'
  const numberShadow = isCritical
    ? '0 0 24px var(--chart-1)'
    : isFumble
    ? '0 0 24px var(--destructive)'
    : 'none'

  // Camera reaction on impact: jitter + a small zoom punch, stronger on crits/fumbles.
  const cameraAnimate = !reduced && landed
    ? {
        x: hero ? [0, -10, 9, -7, 5, -3, 0] : [0, -6, 5, -3, 2, 0],
        y: hero ? [0, 5, -4, 3, -2, 0] : [0, 3, -2, 1, 0],
        scale: hero ? [1.05, 0.995, 1] : [1.03, 1],
        transition: { duration: hero ? 0.46 : 0.32, ease: 'easeOut' as const },
      }
    : { x: 0, y: 0, scale: 1 }

  return (
    <AnimatePresence>
      {visible && roll && (
        <motion.div
          key="dice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
          }} />

          {/* Camera rig — everything inside shakes together on impact */}
          <motion.div
            animate={cameraAnimate}
            style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              willChange: 'transform',
            }}
          >
            <div style={{ position: 'relative' }}>
              <DiceScene
                key={roll.id}
                phase={phase}
                sides={sides}
                dice={dice}
                hero={hero}
                seed={roll.id}
                size={dice.length > 1 ? 88 : 100}
              />
              {landed && !reduced && <ResultBurst key={`burst-${roll.id}`} hero={hero} seed={roll.id} />}
            </div>

            {/* Label chip — present from the first frame so the roll reads as intentional */}
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--bone-muted)',
              }}
            >
              {landed ? roll.label : 'Rolando...'}
            </motion.span>

            {/* Result panel — spring pop, never a linear fade */}
            {landed && (
              <motion.div
                key={`panel-${roll.id}`}
                className="worn-border"
                initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -3, y: 14 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={reduced ? { duration: 0.3 } : DICE_SPRING.panel}
                style={{
                  position: 'relative',
                  marginTop: 6,
                  background: isCritical
                    ? 'linear-gradient(148deg, var(--chart-1) 0%, var(--card) 42%, var(--secondary) 100%), var(--background)'
                    : isFumble
                    ? 'linear-gradient(148deg, var(--primary) 0%, var(--card) 42%, var(--secondary) 100%), var(--background)'
                    : 'var(--background)',
                  border: `1px solid ${borderColor}`,
                  borderTop: `2px solid ${isCritical ? 'var(--chart-1)' : isFumble ? 'var(--destructive)' : 'var(--border)'}`,
                  boxShadow: isCritical
                    ? '0 8px 40px var(--chart-1), 0 4px 20px rgba(0,0,0,0.8)'
                    : isFumble
                    ? '0 8px 40px var(--destructive), 0 4px 20px rgba(0,0,0,0.8)'
                    : '0 8px 40px rgba(0,0,0,0.8)',
                  padding: '18px 44px 20px',
                  minWidth: 200,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  willChange: 'transform',
                }}
              >
                <CountUpTotal
                  from={roll.result}
                  to={roll.total}
                  color={numberColor}
                  shadow={numberShadow}
                  reduced={reduced}
                />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bone-muted)' }}>
                    {roll.die}
                    {roll.modifier !== undefined && roll.modifier !== 0
                      ? (roll.modifier > 0 ? ` +${roll.modifier}` : ` ${roll.modifier}`)
                      : ''}
                  </span>

                  {roll.advantage && roll.rolls && roll.rolls.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <span style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 7,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: roll.advantage === 'advantage' ? 'var(--verdigris-light)' : 'var(--blood-bright)',
                      }}>
                        {roll.advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}
                      </span>
                      {roll.rolls.map((r, idx) => {
                        const kept = dice[idx]?.kept ?? r === roll.result
                        return (
                          <span
                            key={idx}
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 14,
                              fontWeight: kept ? 700 : 400,
                              color: kept ? 'var(--parchment-pale)' : 'var(--bone-muted)',
                              textDecoration: kept ? 'none' : 'line-through',
                              opacity: kept ? 1 : 0.55,
                            }}
                          >
                            {r}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  {(isCritical || isFumble) && (
                    <motion.span
                      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5, rotate: isCritical ? 5 : -5 }}
                      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
                      transition={reduced ? { duration: 0.3, delay: 0.1 } : { ...DICE_SPRING.panel, delay: 0.16 }}
                      className={isCritical ? 'animate-crit' : 'animate-fumble'}
                      style={{
                        display: 'inline-block',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 10,
                        letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: isCritical ? 'var(--gold-bright)' : 'var(--blood-bright)',
                        textShadow: isCritical ? '0 0 8px var(--chart-1)' : 'none',
                        marginTop: 2,
                      }}
                    >
                      {isCritical ? '✦ Crítico!' : '☠ Falha Crítica!'}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
