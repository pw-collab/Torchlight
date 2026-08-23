/**
 * A cena preparada (§6.11).
 *
 * A preparação de uma sessão mora fora do app: uma nota no celular com o que
 * vai acontecer e quais monstros estão ali. A cena traz isso para dentro e liga
 * a preparação ao jogo — "iniciar" arma o encontro com aqueles NPCs já na
 * trilha, que era o gesto que faltava entre o caderno e a mesa.
 *
 * A cena é do Mestre, não da sessão: ela é escrita na véspera, quando sessão
 * nenhuma existe ainda, e sobrevive à sessão em que foi jogada.
 */

export interface SceneRow {
  id: string
  gm_id: string
  title: string
  gm_note: string
  npc_ids: string[]
  played_at: string | null
  sort_key: number
  created_at: string
}

export interface Scene {
  id: string
  gmId: string
  title: string
  /** Só o Mestre lê — é a nota de preparo, não o que a mesa vê. */
  gmNote: string
  npcIds: string[]
  /** Quando foi para a mesa. Nulo enquanto espera a vez. */
  playedAt: string | null
  sortKey: number
  createdAt: string
}

export function rowToScene(row: SceneRow): Scene {
  return {
    id: row.id,
    gmId: row.gm_id,
    title: row.title,
    gmNote: row.gm_note ?? '',
    npcIds: Array.isArray(row.npc_ids) ? row.npc_ids : [],
    playedAt: row.played_at,
    sortKey: row.sort_key ?? 0,
    createdAt: row.created_at,
  }
}

/**
 * A ordem do roteiro: o que ainda não foi jogado primeiro, e dentro de cada
 * grupo a ordem que o Mestre deu. Uma cena já jogada não some — ele pode
 * desmarcá-la e reusar —, mas também não fica no caminho da próxima.
 */
export function sceneOrder(scenes: Scene[]): Scene[] {
  return [...scenes].sort((a, b) => {
    const playedA = a.playedAt ? 1 : 0
    const playedB = b.playedAt ? 1 : 0
    if (playedA !== playedB) return playedA - playedB
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey
    return a.createdAt.localeCompare(b.createdAt)
  })
}
