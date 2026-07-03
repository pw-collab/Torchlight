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
    }
  | { type: 'torch_lit'; player: string; minutesLeft: number }
  | { type: 'torch_warning'; player: string; minutesLeft: number }
  | { type: 'torch_out'; player: string }
