import type { DiceConfig, DieType, EffectRule } from 'open-dice-dnd'
import type { RollResult } from '@/lib/dice'
import { parseDie } from '@/lib/diceMotion'

/* ============================================================
   diceEngine — the seam between Torchlight's roll math and the
   open-dice-dnd physics renderer.

   The engine is *authoritative-result friendly*: you tell it which
   face each die must end on (`rolled`) and it pre-simulates the
   throw, then paints that value onto whichever face lands up. So
   lib/dice.ts stays the single source of truth for what was rolled —
   the 3D layer only performs it. Nothing here decides an outcome.

   Everything in this module is browser-only and lazily loaded: the
   engine drags in three + cannon-es, which must never reach the
   server bundle or the initial client chunk.
   ============================================================ */

/** Dice the engine can render *and* Torchlight actually rolls. */
const DIE_TYPES: Record<number, DieType> = {
  4: 'd4', 6: 'd6', 8: 'd8', 10: 'd10', 12: 'd12', 20: 'd20',
}

/**
 * Above this the pre-simulation (up to 5000 physics steps per throw)
 * starts to cost more than the spectacle is worth, so we fall back to
 * the lightweight SVG scene. The dice pool caps itself here too, so a
 * handful built in the UI always gets the physics table.
 */
export const MAX_DICE = 12

/* ─── Loading ──────────────────────────────────────────────────────────── */

type Engine = typeof import('open-dice-dnd')

let enginePromise: Promise<Engine | null> | null = null

/**
 * Loads the engine on demand. Resolves to `null` — permanently — if the
 * chunk fails, so a broken CDN degrades to the SVG dice instead of
 * retrying on every roll.
 */
export function loadDiceEngine(): Promise<Engine | null> {
  if (!enginePromise) {
    enginePromise = import('open-dice-dnd').catch((err: unknown) => {
      console.warn('open-dice-dnd failed to load; falling back to 2D dice.', err)
      return null
    })
  }
  return enginePromise
}

let webgl: boolean | null = null

export function supportsWebGL(): boolean {
  if (webgl !== null) return webgl
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    webgl = !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    webgl = false
  }
  return webgl
}

/* ─── Theme ────────────────────────────────────────────────────────────── */

export interface DiceTheme {
  /** Face background, hex string. */
  face: string
  /** Numeral color, hex string. */
  text: string
  /** Numeric hex, for effect tinting. */
  crit: number
  fumble: number
  neutral: number
}

const FALLBACK_THEME: DiceTheme = {
  face: '#9f0712',
  text: '#fef2f2',
  crit: 0xd0d6d8,
  fumble: 0xff6467,
  neutral: 0x9ca8ab,
}

let probe: HTMLSpanElement | null = null
let swatch: CanvasRenderingContext2D | null | undefined

/**
 * Resolves a CSS custom property to `#rrggbb`.
 *
 * Two hops, both necessary: a probe element turns `var(--x)` into a real
 * computed color (the tokens are chained aliases), and a 1×1 canvas turns
 * that into sRGB — the palette is authored in `oklch()`, which the engine's
 * hex parser would reject outright.
 */
function readColor(token: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    if (!probe || !probe.isConnected) {
      probe = document.createElement('span')
      probe.setAttribute('aria-hidden', 'true')
      probe.style.cssText = 'position:fixed;width:0;height:0;opacity:0;pointer-events:none'
      document.body.appendChild(probe)
    }
    probe.style.color = `var(${token})`
    const computed = getComputedStyle(probe).color
    if (!computed) return null

    if (swatch === undefined) {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 1
      swatch = canvas.getContext('2d', { willReadFrequently: true })
    }
    if (!swatch) return null

    swatch.clearRect(0, 0, 1, 1)
    swatch.fillStyle = computed
    swatch.fillRect(0, 0, 1, 1)
    const [r, g, b] = swatch.getImageData(0, 0, 1, 1).data
    return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`
  } catch {
    return null
  }
}

const asNumber = (hex: string) => parseInt(hex.slice(1), 16)

/**
 * Samples the live palette. Read per roll rather than cached, so dice
 * follow a light/dark theme switch without a reload.
 */
export function readDiceTheme(): DiceTheme {
  // Blood red with pale numerals: the same pairing the SVG dice and the
  // roller buttons use, and the only one that holds contrast against a
  // near-black backdrop.
  const face = readColor('--primary')
  const text = readColor('--primary-foreground')
  const crit = readColor('--chart-1')
  const fumble = readColor('--destructive')
  const neutral = readColor('--muted-foreground')

  return {
    face: face ?? FALLBACK_THEME.face,
    text: text ?? FALLBACK_THEME.text,
    crit: crit ? asNumber(crit) : FALLBACK_THEME.crit,
    fumble: fumble ? asNumber(fumble) : FALLBACK_THEME.fumble,
    neutral: neutral ? asNumber(neutral) : FALLBACK_THEME.neutral,
  }
}

/* ─── Roll → scene ─────────────────────────────────────────────────────── */

/**
 * Builds the per-die config for a finished roll, or `null` when this roll
 * can't be staged in 3D (unsupported die, too many dice, values out of
 * range) — callers fall back to the SVG scene.
 *
 * Every die keeps its own shape and face, so a mixed pool throws a real
 * `2d6 + d20` rather than three of anything. Dice are deliberately
 * *identical in colour* in the air — tinting the crit die before it lands
 * would give the result away mid-flight. The reveal is left to the settle
 * effects below.
 */
export function diceConfigFor(roll: RollResult, theme: DiceTheme): DiceConfig[] | null {
  const thrown = roll.dice?.length
    ? roll.dice
    : [{ sides: roll.sides ?? parseDie(roll.die).sides, value: roll.result }]

  if (thrown.length === 0 || thrown.length > MAX_DICE) return null

  const config: DiceConfig[] = []
  for (const { sides, value } of thrown) {
    const type = DIE_TYPES[sides]
    if (!type) return null
    // A formula total (e.g. 2d6 → 9) would be an impossible face; bail rather
    // than let the engine silently land on something that isn't the result.
    if (!Number.isInteger(value) || value < 1 || value > sides) return null
    config.push({
      dice: type,
      rolled: value,
      textColor: theme.text,
      backgroundColor: theme.face,
    })
  }
  return config
}

/**
 * Settle-time effects, rebuilt per roll so the payoff matches the outcome
 * this app already decided on: gold bloom and confetti on a crit, a red
 * flare and a camera kick on a fumble, a quiet tint otherwise.
 *
 * Rules match on the face showing, which is the only handle the engine
 * gives us — so on a crit the effect lands on whichever die reads 20,
 * which is exactly the die the player is looking at.
 */
export function effectRulesFor(roll: RollResult, theme: DiceTheme, fx: Engine['effects']): EffectRule[] {
  // Crits and fumbles are only ever flagged for a lone d20 (see rollPool), so
  // the rule can name that die directly rather than deriving a type that a
  // mixed pool wouldn't have.
  if (roll.isCritical) {
    return [{
      match: { type: 'd20', visible: roll.result },
      play: [
        fx.glow({ color: theme.crit, intensity: 1.4 }),
        fx.haloRing({ color: theme.crit }),
        fx.particleBurst({ color: theme.crit }),
        fx.slowMoZoom(),
      ],
    }]
  }

  if (roll.isFumble) {
    return [{
      match: { type: 'd20', visible: roll.result },
      play: [
        fx.glow({ color: theme.fumble, intensity: 1.2 }),
        fx.screenShake({ intensity: 0.5 }),
      ],
    }]
  }

  return [{ match: 'any', play: fx.glow({ color: theme.neutral, intensity: 0.5 }) }]
}

/** True when this roll can be staged with the physics engine. */
export function canRenderIn3D(roll: RollResult): boolean {
  return diceConfigFor(roll, FALLBACK_THEME) !== null
}
