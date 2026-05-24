export type DiscordEvent =
  | { type: 'roll'; player: string; die: string; result: number; modifier: number; total: number; dc?: number; success?: boolean }
  | { type: 'torch_lit'; player: string; minutesLeft: number }
  | { type: 'torch_warning'; player: string; minutesLeft: number }
  | { type: 'torch_out'; player: string }
  | { type: 'hp_change'; player: string; from: number; to: number; delta: number }
  | { type: 'player_down'; player: string }
  | { type: 'luck_used'; player: string; remaining: number }
  | { type: 'session_start'; gm: string }
