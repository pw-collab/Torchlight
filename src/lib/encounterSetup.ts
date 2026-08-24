import type { NPC } from '@/types/npc.types'
import { attackBonusFrom, damageFrom } from '@/lib/npcAttack'

/**
 * Três goblins do mesmo statblock precisam de três nomes.
 *
 * O sufixo conta os que já estão na trilha: o primeiro entra como "Goblin", o
 * segundo como "Goblin 2". Sem isso a mesa perde a conta de qual deles está
 * com 2 de vida — que é justamente o que o encontro veio resolver.
 */
export function uniqueActorName(base: string, taken: string[]): string {
  const same = taken.filter(name => name.replace(/ \d+$/, '') === base).length
  return same > 0 ? `${base} ${same + 1}` : base
}

/** Os campos de combate copiados do statblock quando o NPC entra na trilha. */
export interface NpcActorFields {
  hp_current: number
  hp_max: number
  ac: number
  atk_bonus: number
  damage_die: string | null
}

/**
 * O statblock vira ator.
 *
 * A cópia é deliberada: o ator tem vida própria a partir daqui, e editar o
 * bestiário no meio da cena não pode curar o goblin que está sangrando. Um
 * statblock incompleto ainda entra — 1 de vida e CA 10 são pouco, mas jogáveis,
 * e é melhor do que recusar o monstro que o Mestre acabou de precisar.
 */
export function npcActorFields(npc: NPC): NpcActorFields {
  return {
    hp_current: npc.hp ?? 1,
    hp_max: npc.hp ?? 1,
    ac: npc.ac ?? 10,
    atk_bonus: attackBonusFrom(npc.atkDesc),
    damage_die: damageFrom(npc.atkDesc) ?? damageFrom(npc.weaponDesc),
  }
}
