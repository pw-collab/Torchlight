/**
 * A gaveta do Mestre (§6.8).
 *
 * O que ele escreve na preparação — a carta, o mapa em texto, a página de
 * diário — e guarda até a hora de entregar. A entrega em si não mora aqui: ela
 * é uma linha do log da sessão (`HandoutPayload`), com o conteúdo junto, para
 * o jogador continuar lendo o que recebeu mesmo depois de o Mestre apagar o
 * original.
 */

export interface HandoutRow {
  id: string
  gm_id: string
  title: string
  content: string
  created_at: string
}

export interface Handout {
  id: string
  gmId: string
  title: string
  content: string
  createdAt: string
}

export function rowToHandout(row: HandoutRow): Handout {
  return {
    id: row.id,
    gmId: row.gm_id,
    title: row.title,
    content: row.content ?? '',
    createdAt: row.created_at,
  }
}
