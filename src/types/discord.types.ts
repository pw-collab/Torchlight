export type DiscordEvent =
  | {
      type: 'roll'
      player: string
      label: string
      subLabel?: string
      die: string
      result: number
      modifier?: number
      total: number
      isCritical?: boolean
      isFumble?: boolean
      rolls?: number[]
      /** Target number the roll was made against, when one was set. */
      dc?: number
      /** Whether the roll beat its DC. Undefined when no DC was set. */
      success?: boolean
    }
  | { type: 'torch_lit'; player: string; minutesLeft: number }
  | { type: 'torch_warning'; player: string; minutesLeft: number }
  | { type: 'torch_out'; player: string }

/** Distributes `Omit` over a union instead of collapsing it to its shared keys. */
type WithoutPlayer<T> = T extends unknown ? Omit<T, 'player'> : never

/**
 * What the browser is allowed to send. `player` is absent on purpose: the relay
 * resolves who is speaking from the session cookie, because a name carried in
 * the request body is a name anyone with devtools can choose.
 */
export type DiscordEventInput = WithoutPlayer<DiscordEvent>
