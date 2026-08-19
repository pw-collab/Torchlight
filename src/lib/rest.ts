import type { InventoryItem } from '@/types/inventory.types'

/** Sem acentos e em minúsculas: o jogador escreve "Rações", "racao", "Ração seca". */
function fold(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

/**
 * Ração no singular e no plural, com ou sem acento.
 *
 * "Rações" decomposto e sem diacríticos vira `racoes`, que não compartilha
 * radical com `racao` — um prefixo curto pegaria as duas formas, mas também
 * "braçadeira" e "bracelete". As duas palavras inteiras, então.
 */
const RATION = /\b(rac(ao|oes)|rations?)\b/

/**
 * A comida na mochila.
 *
 * O inventário é livre — o item do catálogo se chama "Rações", mas ninguém
 * impede o jogador de renomear —, então a busca é pelo nome em vez de por um
 * id fixo.
 */
export function findRation(inventory: InventoryItem[]): InventoryItem | undefined {
  return inventory.find(item => item.quantity > 0 && RATION.test(fold(item.name)))
}

/** Come uma; a última sai da mochila. */
export function consumeRation(inventory: InventoryItem[], rationId: string): InventoryItem[] {
  return inventory.flatMap(item => {
    if (item.id !== rationId) return [item]
    const left = item.quantity - 1
    return left > 0 ? [{ ...item, quantity: left }] : []
  })
}
