'use client'

import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, animate, motion, useReducedMotion } from 'framer-motion'
import type { RollResult } from '@/lib/dice'
import { DICE_SPRING, DICE_TIME, heroKind, parseDie, type RollPhase } from '@/lib/diceMotion'
import { discardedIndex } from '@/lib/diceEngine'
import type { RollMode } from '@/hooks/useDiceRoll'
import { DiceScene, type SceneDie } from '@/components/dice/DiceScene'
import { DiceStage } from '@/components/dice/DiceStage'
import { ResultBurst } from '@/components/dice/ResultBurst'

/* ============================================================
   DiceOverlay — the cinematic layer for a roll, staged the way
   Baldur's Gate 3 stages one.

   The screen dims and everything gathers on a single column in the
   middle: what is being rolled and the number to beat above, a dais
   where the die spins in place, and underneath it the arithmetic —
   the face, the modifier folding into it, then the verdict stamped
   on. A click anywhere (or Escape) carries on without waiting.

   Owns no timing of its own: it renders whatever phase useDiceRoll
   says we're in. Two things can stand on the dais:

   physics — DiceStage, real dice from open-dice-dnd, framed as a
             close-up arena by lib/diceArena. The engine brings its
             own impact audio, glow and camera work.

   timed   — DiceScene, the hand-animated SVG dice, with the camera
             shake and the ResultBurst landing on the same beat. Used
             for reduced motion, dice the engine can't draw, and any
             WebGL failure.
   ============================================================ */

/**
 * Side of the dais. One value, shared by the canvas (which lives for the
 * whole session and so can't sit inside the animated HUD) and the HUD that
 * hangs its text above and below it — both centre the same box on screen.
 * The `vh` term keeps room for that text on a phone held sideways.
 */
const ARENA = 'min(78vw, 44vh, 340px)'

/** A fixed box of ARENA size, dead centre. `margin: auto` rather than a
    transform, so the canvas inside never lands on a half pixel. */
const CENTERED: React.CSSProperties = {
  position: 'fixed', inset: 0, margin: 'auto',
  width: ARENA, height: ARENA,
  pointerEvents: 'none',
}

const CAPS: React.CSSProperties = {
  fontFamily: 'var(--font-mono)', fontWeight: 600,
  letterSpacing: '0.3em', textTransform: 'uppercase',
}

const TEXT_SHADOW = '0 2px 12px rgba(0,0,0,0.9)'

interface Props {
  phase: RollPhase
  roll: RollResult | null
  mode: RollMode
  /** The roll DiceStage should throw; null outside a physics roll. */
  throwRoll: RollResult | null
  /** DiceStage reporting that the dice stopped. */
  onSettled: (rollId: string) => void
  /** DiceStage reporting it can't perform the roll. */
  onUnavailable: () => void
  /** The player clicked through — close the overlay now. */
  onDismiss: () => void
}

/** What the roll amounted to, in the words the table uses. */
function verdictFor(roll: RollResult): { text: string; color: string } | null {
  if (roll.isCritical) return { text: 'Sucesso Crítico', color: 'var(--chart-1)' }
  if (roll.isFumble) return { text: 'Falha Crítica', color: 'var(--destructive)' }
  if (roll.dc === undefined) return null
  return roll.success
    ? { text: 'Sucesso', color: 'var(--spirit)' }
    : { text: 'Falha', color: 'var(--destructive)' }
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
      delay: DICE_TIME.tally / 1000,
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
        fontSize: 'clamp(44px, 9vh, 72px)',
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

export function DiceOverlay({ phase, roll, mode, throwRoll, onSettled, onUnavailable, onDismiss }: Props) {
  const reduced = !!useReducedMotion()
  const visible = phase !== 'idle' && roll !== null

  // `mode` holds its value between rolls, so this keeps the dais — and with
  // it the WebGL context, which is slow to build and capped per document —
  // mounted from the first physics roll onwards. It only comes down if the
  // engine reports it can't run, which latches the hook into timed mode too.
  const [tableFailed, setTableFailed] = useState(false)
  const handleUnavailable = useCallback(() => {
    setTableFailed(true)
    onUnavailable()
  }, [onUnavailable])

  // Escape carries on, same as a click. Enter and Space are left alone: they
  // are what fired the roll, and a held key would dismiss it on arrival.
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onDismiss])

  const physics = mode === 'physics' && !tableFailed

  const hero = roll ? heroKind(roll) : null
  const landed = phase === 'landed'
  const verdict = roll ? verdictFor(roll) : null
  const modifier = roll?.modifier ?? 0

  // Advantage shows both faces with the loser struck through; every other roll
  // — a lone die or a whole pool — shows each die it actually threw.
  const advSides = roll?.sides ?? (roll ? parseDie(roll.die).sides : 20)
  const discarded = roll ? discardedIndex(roll) : null
  const dice: SceneDie[] =
    roll?.rolls && roll.rolls.length > 1
      ? roll.rolls.map((v, i) => ({ finalValue: v, sides: advSides, kept: i !== discarded }))
      : roll?.dice?.length
      ? roll.dice.map(d => ({ finalValue: d.value, sides: d.sides, kept: true }))
      : [{ finalValue: roll?.result ?? 20, sides: advSides, kept: true }]

  // The dais takes the colour of the outcome once there is one.
  const accent = landed && verdict ? verdict.color : 'var(--border)'
  const numberColor = verdict?.color ?? 'var(--foreground)'

  // Camera reaction on impact: jitter + a small zoom punch, stronger on crits/fumbles.
  // Physics rolls skip it — the engine shakes its own camera.
  const cameraAnimate = !reduced && landed && !physics
    ? {
        x: hero ? [0, -10, 9, -7, 5, -3, 0] : [0, -6, 5, -3, 2, 0],
        y: hero ? [0, 5, -4, 3, -2, 0] : [0, 3, -2, 1, 0],
        scale: hero ? [1.05, 0.995, 1] : [1.03, 1],
        transition: { duration: hero ? 0.46 : 0.32, ease: 'easeOut' as const },
      }
    : { x: 0, y: 0, scale: 1 }

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0, transition: { duration: 0.28, ease: 'easeIn' as const } },
    transition: { duration: 0.18 },
  }

  return (
    <>
      {/* What takes the click: one press anywhere carries on. Kept out of the
          fading layers on purpose — those linger for their exit animation, and
          a catcher that lingered with them would swallow the next roll's click. */}
      {visible && (
        <div
          data-testid="dice-backdrop"
          onClick={onDismiss}
          style={{ position: 'fixed', inset: 0, zIndex: 200 }}
        />
      )}

      <AnimatePresence>
        {visible && (
          <motion.div
            key="dice-backdrop"
            {...fade}
            style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}
          >
            {/* The dim. */}
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.62) 45%, rgba(0,0,0,0.42) 100%)',
                backdropFilter: 'blur(3px)',
                WebkitBackdropFilter: 'blur(3px)',
              }}
            />
            {/* The dais: a lit disc and a ring, under the dice. */}
            <div style={CENTERED}>
              <motion.div
                animate={{ borderColor: accent, boxShadow: landed && verdict
                  ? `0 0 44px -6px ${verdict.color}, inset 0 0 36px -10px ${verdict.color}`
                  : '0 0 30px -12px var(--primary), inset 0 0 30px -14px var(--primary)' }}
                transition={{ duration: 0.35 }}
                style={{
                  position: 'absolute', inset: '4%',
                  borderRadius: '50%',
                  border: '1px solid var(--border)',
                  background: 'radial-gradient(circle, color-mix(in oklch, var(--primary), transparent 86%) 0%, rgba(0,0,0,0.35) 62%, rgba(0,0,0,0.1) 100%)',
                }}
              />
              {/* Slow outer ring — the only thing moving while the dice load. */}
              {!reduced && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
                  style={{
                    position: 'absolute', inset: 0,
                    borderRadius: '50%',
                    border: '1px dashed color-mix(in oklch, var(--muted-foreground), transparent 55%)',
                  }}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The physics dais. Mounted for the page's life once used, and always
          present in the tree so the WebGL context survives between rolls —
          only its opacity follows the overlay. */}
      {physics && (
        <div
          style={{
            ...CENTERED,
            zIndex: 201,
            opacity: visible ? 1 : 0,
            transition: `opacity ${visible ? 180 : 280}ms ease`,
          }}
        >
          <DiceStage
            throwRoll={throwRoll}
            visible={visible}
            onSettled={onSettled}
            onUnavailable={handleUnavailable}
          />
        </div>
      )}

      <AnimatePresence>
        {visible && roll && (
        <motion.div
          key="dice-hud"
          {...fade}
          role="status"
          aria-live="polite"
          style={{ ...CENTERED, zIndex: 202 }}
        >
          {/* Above the dais: what is being rolled, and the number to beat. */}
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 'min(92vw, 460px)', paddingBottom: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            textAlign: 'center', textShadow: TEXT_SHADOW,
          }}>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                fontFamily: 'var(--font-heading)', fontWeight: 700,
                fontSize: 'clamp(16px, 3.4vh, 22px)', lineHeight: 1.15,
                color: 'var(--foreground)',
              }}
            >
              {roll.label}
            </motion.span>
            {roll.dc !== undefined && (
              <>
                <span style={{ ...CAPS, fontSize: 8, color: 'var(--muted-foreground)', marginTop: 4 }}>
                  Classe de Dificuldade
                </span>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontWeight: 700,
                  fontSize: 'clamp(24px, 5.2vh, 34px)', lineHeight: 1,
                  color: 'var(--foreground)',
                }}>
                  {roll.dc}
                </span>
              </>
            )}
          </div>

          {/* On the dais, when the engine isn't: the hand-animated dice. */}
          {!physics && (
            <motion.div
              animate={cameraAnimate}
              style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                willChange: 'transform',
              }}
            >
              <div style={{ position: 'relative' }}>
                <DiceScene
                  key={roll.id}
                  phase={phase}
                  dice={dice}
                  hero={hero}
                  seed={roll.id}
                  size={dice.length > 1 ? 88 : 100}
                />
                {landed && !reduced && <ResultBurst key={`burst-${roll.id}`} hero={hero} seed={roll.id} />}
              </div>
            </motion.div>
          )}

          {/* Below the dais: the arithmetic, then the verdict. */}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 'min(92vw, 460px)', paddingTop: 8,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            textAlign: 'center', textShadow: TEXT_SHADOW,
          }}>
            {!landed && (
              <motion.span
                animate={reduced ? { opacity: 1 } : { opacity: [0.45, 1, 0.45] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                style={{ ...CAPS, fontSize: 9, color: 'var(--muted-foreground)' }}
              >
                Rolando...
              </motion.span>
            )}

            {landed && (
              <div key={`tally-${roll.id}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ position: 'relative' }}>
                  <CountUpTotal
                    from={roll.result}
                    to={roll.total}
                    color={numberColor}
                    shadow={verdict ? `0 0 26px ${verdict.color}, ${TEXT_SHADOW}` : TEXT_SHADOW}
                    reduced={reduced}
                  />
                  {/* The modifier flies up into the number as it starts to count. */}
                  {modifier !== 0 && !reduced && (
                    <motion.span
                      initial={{ opacity: 0, x: '-50%', y: 34, scale: 1 }}
                      animate={{ opacity: [0, 1, 1, 0], x: '-50%', y: [34, 30, 4, -6], scale: [1, 1.1, 0.9, 0.5] }}
                      transition={{ duration: (DICE_TIME.tally + 260) / 1000, times: [0, 0.25, 0.8, 1], ease: 'easeIn' }}
                      style={{
                        position: 'absolute', left: '50%', top: '50%',
                        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18,
                        color: 'var(--primary)', whiteSpace: 'nowrap',
                      }}
                    >
                      {modifier > 0 ? `+${modifier}` : modifier}
                    </motion.span>
                  )}
                </div>

                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted-foreground)' }}>
                  {roll.die}
                  {modifier !== 0 ? (modifier > 0 ? ` +${modifier}` : ` ${modifier}`) : ''}
                </span>

                {roll.advantage && roll.rolls && roll.rolls.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      ...CAPS, fontSize: 8, letterSpacing: '0.16em',
                      color: roll.advantage === 'advantage' ? 'var(--spirit)' : 'var(--destructive)',
                    }}>
                      {roll.advantage === 'advantage' ? 'Vantagem' : 'Desvantagem'}
                    </span>
                    {roll.rolls.map((r, idx) => {
                      const kept = idx !== discarded
                      return (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 14,
                            fontWeight: kept ? 700 : 400,
                            color: kept ? 'var(--foreground)' : 'var(--muted-foreground)',
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

                {/* The verdict is stamped last, once the total has been read. */}
                {verdict && (
                  <motion.span
                    initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.7, y: -4 }}
                    animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                    transition={reduced
                      ? { duration: 0.3, delay: 0.1 }
                      : { ...DICE_SPRING.panel, delay: DICE_TIME.verdict / 1000 }}
                    className={hero === 'crit' ? 'animate-crit' : hero === 'fumble' ? 'animate-fumble' : undefined}
                    style={{
                      display: 'inline-block',
                      marginTop: 2,
                      fontFamily: 'var(--font-heading)', fontWeight: 700,
                      fontSize: 'clamp(16px, 3.6vh, 24px)',
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                      color: verdict.color,
                    }}
                  >
                    {verdict.text}
                  </motion.span>
                )}

                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.3, delay: reduced ? 0.2 : 0.9 }}
                  style={{ ...CAPS, fontSize: 7, letterSpacing: '0.22em', color: 'var(--muted-foreground)', marginTop: 4 }}
                >
                  Toque para continuar
                </motion.span>
              </div>
            )}
          </div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
