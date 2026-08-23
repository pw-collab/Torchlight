import type { InventoryItem } from '@/types/inventory.types'
import type { HandoutPayload, SessionEvent } from '@/types/session.types'

/**
 * O que foi entregue a esta ficha (§6.8).
 *
 * Uma entrega sem `characterId` foi para a mesa inteira: todo mundo a recebe.
 * Do mais recente para o mais antigo, na mesma ordem em que o feed chega.
 */
export function handoutsFor(events: SessionEvent[], characterId: string): SessionEvent[] {
  return events.filter(
    event =>
      event.kind === 'handout' &&
      (event.characterId === null || event.characterId === characterId),
  )
}

/**
 * O handout vestido de item para o leitor paginado.
 *
 * O `BookViewerModal` já sabia folhear Markdown — só sabia fazê-lo a partir de
 * um item de inventário. Em vez de duplicar o leitor, a entrega assume a forma
 * que ele lê: um documento de zero espaços, que nunca entra no inventário de
 * ninguém.
 */
export function handoutItem(event: SessionEvent): InventoryItem {
  const payload = event.payload as HandoutPayload
  return {
    id: `handout:${event.id}`,
    name: payload.title || 'Documento',
    description: '',
    slots: 0,
    quantity: 1,
    type: 'document',
    content: payload.content ?? '',
  }
}

/** O título como ele aparece na prateleira de recebidos. */
export function handoutTitle(event: SessionEvent): string {
  return (event.payload as HandoutPayload).title || 'Documento'
}
