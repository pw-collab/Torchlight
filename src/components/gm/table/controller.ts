import type { Character } from '@/types/character.types'
import type { NPC } from '@/types/npc.types'
import type { RollMode, RollResult } from '@/lib/dice'
import type { TableClock } from '@/lib/dungeonClock'
import type { GmAction, Seat, TreasureGrant } from '@/lib/gmActions'
import type { EncounterControls } from '@/hooks/useEncounterControls'
import type { useCrawl } from '@/hooks/useCrawl'

/**
 * O que está no ar enquanto o Mestre escolhe em quem clicar.
 *
 *   attack  um monstro ataca: o próximo card clicado é o alvo
 *   damage  um dano já rolado (o do jogador, no feed) espera o alvo
 *   area    a bola de fogo, a armadilha: vários cards, um número só
 */
export type Targeting =
  | { kind: 'attack'; attackerId: string; mode: RollMode }
  | { kind: 'damage'; amount: number; label: string; eventId?: string }
  | { kind: 'area'; amount: number; picked: string[] }

/**
 * Tudo o que o menu de comandos precisa da mesa, num objeto só — a tela
 * passa isto adiante em vez de vinte props soltas.
 */
export interface TableController {
  sessionId: string
  gmName: string
  seats: Seat[]
  presentIds: ReadonlySet<string>
  clock: TableClock
  /** O personagem com uma escrita em andamento. */
  busyId: string | null
  enc: EncounterControls
  crawl: ReturnType<typeof useCrawl>
  bestiary: NPC[]
  act: (character: Character, action: GmAction) => Promise<void>
  /** Rolagem do Mestre: nasce escondida da mesa, e o feed oferece revelar. */
  onRoll: (roll: RollResult) => void
  beginTargeting: (targeting: Targeting) => void
  focus: (key: string | null) => void
  sendPrompt: (request: import('@/components/gm/PromptComposer').PromptRequest) => void
  openHandouts: () => void
  toggleRecap: () => void
  narrate: (text: string) => void
  giveTreasure: (characterIds: string[], grant: TreasureGrant) => Promise<void>
  partyRest: () => Promise<void>
  grantXpToAll: (amount: number) => Promise<void>
}
