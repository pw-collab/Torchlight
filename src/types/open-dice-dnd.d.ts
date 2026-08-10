/* Type declarations for `open-dice-dnd`, which ships JavaScript only.
   Hand-written against v1.3.1 — covers the surface Torchlight actually
   uses. Widen it here if we start using more of the engine. */

declare module 'open-dice-dnd' {
  export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'

  /** A single die on the table. `d100` is the exception: it spawns two. */
  export interface DiceConfig {
    dice: DieType
    /** Authoritative face. The engine paints it onto whichever face lands up. */
    rolled?: number
    /** Body color, numeric hex (0xrrggbb) — not a string. */
    diceColor?: number
    /** Face text color, hex string. */
    textColor?: string
    /** Face background color, hex string. */
    backgroundColor?: string
    /** Renders every face as `?`. */
    isSecret?: boolean
    /** Keyed by face *value*, not face index. */
    decals?: Record<string, { src: string; scale?: number; offsetX?: number; offsetY?: number; rotation?: number }>
    /** Roll-time effects (fire, frost, …) that run while the die is airborne. */
    effects?: EffectSpec[]
  }

  export interface PerDieResult {
    type: DieType
    /** Authoritative value — what the total is built from. */
    value: number
    /** The face actually showing, which can differ if the die got bumped. */
    visible: number
    target?: number
  }

  export interface RollOutcome {
    total: number
    variances: Array<{ type: DieType; expected: number; visible: number }>
    results: PerDieResult[]
  }

  /** Opaque handle to a die in the scene; only ever passed back to the engine. */
  export type Die = unknown

  export interface EffectSpec {
    scope: 'die' | 'once'
    create(ctx: { die: Die; roller: DiceRoller }): { update(): boolean; cleanup?(): void }
  }

  export type MatchClause =
    | 'any'
    | 'clean'
    | 'variance'
    | Partial<Pick<PerDieResult, 'type' | 'visible' | 'value' | 'target'>>
    | ((result: PerDieResult, die: Die) => boolean)

  export interface EffectRule {
    match?: MatchClause
    play: EffectSpec | EffectSpec[]
  }

  export interface DiceRollerOptions {
    container: HTMLElement
    width?: number
    height?: number
    throwSpeed?: number
    throwSpin?: number
    onRollComplete?: (total: number, result: RollOutcome) => void
    onBatchSettled?: (batch: unknown, result: RollOutcome, roller: DiceRoller) => void
    /** URLs of collision sound effects; one is picked at random per impact. */
    sounds?: string[]
    soundVolume?: number
    effects?: EffectRule[]
  }

  export class DiceRoller {
    constructor(options: DiceRollerOptions)
    /**
     * Drives the render/physics loop. The engine starts it on the first roll
     * and never stops it on its own, so setting this to `false` is the only
     * way to idle a roller you intend to keep alive; the next `roll()` turns
     * it back on. `destroy()` sets it too.
     */
    isAnimating: boolean
    /** Clears the table and throws a fresh batch. Resolves with the total. */
    roll(dice: DiceConfig[]): Promise<number>
    /** Throws an extra batch into a live or settled scene. */
    addDice(dice: DiceConfig[]): Promise<RollOutcome>
    reset(): Promise<void>
    getCurrentResults(): RollOutcome
    isRolling(): boolean
    setEffectRules(rules: EffectRule[]): void
    preloadDecals(srcs: string[]): Promise<unknown>
    setThrowSpeed(n: number): void
    setThrowSpin(n: number): void
    playEffect(spec: EffectSpec, die: Die): void
    glow(die: Die, options?: { color?: number; duration?: number; intensity?: number }): void
    scalePulse(die: Die, options?: { peak?: number; duration?: number }): void
    haloRing(die: Die, options?: { color?: number; duration?: number; startRadius?: number; endRadius?: number }): void
    destroy(): void
  }

  interface ColorOption { color?: number; duration?: number }

  export const effects: {
    // Settled-state primitives
    glow(options?: ColorOption & { intensity?: number }): EffectSpec
    scalePulse(options?: { peak?: number; duration?: number }): EffectSpec
    haloRing(options?: ColorOption & { startRadius?: number; endRadius?: number }): EffectSpec
    screenShake(options?: { intensity?: number; duration?: number }): EffectSpec
    slowMoZoom(options?: { duration?: number; zoomLevel?: number }): EffectSpec
    particleBurst(options?: { color?: number; count?: number }): EffectSpec
    confetti(options?: { colors?: number[]; count?: number }): EffectSpec
    // Roll-time damage-type effects
    fire(options?: ColorOption): EffectSpec
    frost(options?: ColorOption): EffectSpec
    electric(options?: ColorOption): EffectSpec
    acidSplat(options?: ColorOption): EffectSpec
    bloodSplat(options?: ColorOption): EffectSpec
    psychic(options?: ColorOption): EffectSpec
    necrotic(options?: ColorOption): EffectSpec
    radiant(options?: ColorOption): EffectSpec
    thunder(options?: ColorOption): EffectSpec
    slashing(options?: ColorOption): EffectSpec
    trail(options?: ColorOption): EffectSpec
  }

  export const presets: {
    classicCrit: EffectRule[]
    subtle: EffectRule[]
    festive: EffectRule[]
  }
}
