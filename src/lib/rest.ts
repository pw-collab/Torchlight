import type { InventoryItem } from '@/types/inventory.types'
import type { TechniqueState } from '@/types/technique.types'

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

// ─── O que o descanso devolve além da vida ────────────────────────────────────

/**
 * Onde a ficha guarda as magias perdidas: uma entrada a mais em
 * `technique_states`, com o mesmo `expendedAbilities` que as técnicas de
 * classe já usam para "tentou, falhou, só volta depois de descansar". Sem
 * coluna nova — e o grimório deixa de esquecer a falha a cada refresh.
 */
export const GRIMOIRE_STATE_ID = 'grimoire'

export function lostSpells(states: TechniqueState[]): string[] {
  return states.find(s => s.id === GRIMOIRE_STATE_ID)?.expendedAbilities ?? []
}

export function withLostSpells(states: TechniqueState[], ids: string[]): TechniqueState[] {
  const entry: TechniqueState = { id: GRIMOIRE_STATE_ID, expendedAbilities: ids }
  return states.some(s => s.id === GRIMOIRE_STATE_ID)
    ? states.map(s => (s.id === GRIMOIRE_STATE_ID ? { ...s, ...entry } : s))
    : [...states, entry]
}

/**
 * Oito horas de sono e uma ração: as magias perdidas voltam, as técnicas
 * recarregam os usos e as habilidades gastas voltam a funcionar. O que o
 * jogador escolheu (a arma do Mestre de Armas, o atributo) fica como estava.
 */
export function restoredStates(states: TechniqueState[]): TechniqueState[] {
  return states.map(s => ({ ...s, usesRemaining: undefined, expendedAbilities: undefined }))
}
