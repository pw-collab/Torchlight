import type { RollResult } from '@/lib/dice'

/* ============================================================
   Dice animation design tokens — single source of truth for
   every timing, easing curve and spring in the roll experience.
   Tune the feel here, not inside components.
   ============================================================ */

/**
 * Phase durations in ms. The roll timeline is assembled from these.
 *
 * These are where the wait actually lives. A physics roll spends ~2.0s of
 * simulated time settling — measured, and near-constant whether one die is
 * thrown or twelve, and unmoved by the engine's throwSpeed/throwSpin knobs.
 * That part is the library's to own. Everything else on the clock is ours,
 * and it used to be 2.36s of it — more than half the roll. Trimmed hard:
 * the anticipation beat reads at half its old length, and the settled result
 * no longer holds the screen, because RollToasts keeps it in the corner for
 * 15s anyway.
 */
export const DICE_TIME = {
  /** Pre-roll rattle in the "hand" — anticipation beat. */
  charge: 120,
  /** Airborne tumble with decelerating spin. */
  tumble: 420,
  /** Extra slow-motion final bounce, crits/fumbles only. */
  slowmo: 360,
  /** How long the settled result lingers before the overlay fades. */
  linger: 1200,
  /** Shorter linger when the roll skipped the theatrics. */
  lingerReduced: 1000,
  /**
   * Physics rolls land when the table says the dice stopped, not on a clock.
   * This is only the watchdog: if a die wedges against a wall or the render
   * loop stalls, the result is shown anyway rather than hanging the overlay.
   */
  settleTimeout: 9000,
} as const

/** Cubic-bézier curves (framer-motion `ease` arrays). */
export const DICE_EASE = {
  /** Violent start, long deceleration — the throw. */
  throw: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Overshoot into rest — landings, pop-ins. */
  backOut: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
}

/** Spring configs (framer-motion `transition` objects). */
export const DICE_SPRING = {
  /** Die coming to rest: heavy, one visible overshoot. */
  settle: { type: 'spring', stiffness: 420, damping: 17, mass: 0.9 } as const,
  /** Result panel / toast pop-in: snappy but soft-edged. */
  panel: { type: 'spring', stiffness: 340, damping: 22, mass: 0.8 } as const,
  /** Button press feedback: near-instant. */
  tap: { type: 'spring', stiffness: 620, damping: 28 } as const,
}

/**
 * The press every tally button on the sheet shares: lift on hover, squash on
 * press, spring-driven so release snaps back with life. Spread onto the
 * `motion.button` a shadcn Button renders through.
 */
export const DICE_TAP = {
  whileHover: { scale: 1.05, y: -2 },
  whileTap: { scale: 0.9, y: 1 },
  transition: DICE_SPRING.tap,
}

/* ============================================================
   Roll lifecycle
   ============================================================ */

/**
 * idle    → nothing on screen
 * charge  → die rattles in place (anticipation)
 * tumble  → airborne, faces cycling, clatter SFX
 * slowmo  → crit/fumble only: final bounce at reduced speed, glow ramps
 * landed  → impact frame: burst + shake + settle spring + result panel
 */
export type RollPhase = 'idle' | 'charge' | 'tumble' | 'slowmo' | 'landed'

export type HeroKind = 'crit' | 'fumble' | null

/** Crits/fumbles are detected by roll logic (lib/dice.ts) and carried on the result. */
export function heroKind(roll: RollResult): HeroKind {
  if (roll.isCritical) return 'crit'
  if (roll.isFumble) return 'fumble'
  return null
}

/** Parse "d20" / "2d6+1" into count + sides for the visual scene. */
export function parseDie(die: string): { count: number; sides: number } {
  const m = die.toLowerCase().match(/(\d*)d(\d+)/)
  if (!m) return { count: 1, sides: 20 }
  return { count: m[1] ? parseInt(m[1]) : 1, sides: parseInt(m[2]) }
}

/** Deterministic per-roll randomness so a die's tumble arc is stable across re-renders. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822519)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}
