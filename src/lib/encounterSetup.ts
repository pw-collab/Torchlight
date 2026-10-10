import type { NPC } from '@/types/npc.types'
import type { EncounterActor } from '@/types/encounter.types'
import { attackBonusFrom, damageFrom } from '@/lib/npcAttack'
import { rollDie, type RollResult } from '@/lib/dice'
import type { Side } from '@/lib/turns'

/**
 * O d6 de iniciativa de um lado. Um dado só pelo lado inteiro, sem
 * modificador: o do Mestre sai quando ele abre o encontro, o do grupo quando
 * o primeiro jogador toca em rolar.
 */
export function rollSideInitiative(side: Side): RollResult {
  return rollDie('d6', side === 'pc' ? 'Iniciativa do grupo' : 'Iniciativa dos inimigos')
}

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

// ─── Moral ────────────────────────────────────────────────────────────────────

/** O teste de moral de Shadowdark: SAB contra DC 15, e quem falha foge. */
export const MORALE_DC = 15
export const FLEEING_ID = 'fugindo'

export function isFleeing(actor: EncounterActor): boolean {
  return actor.conditions.some(c => c.id === FLEEING_ID)
}

/**
 * Quando a regra pede o teste: o grupo perdeu metade dos seus, ou o monstro
 * solitário perdeu metade da vida. O app só acende o botão — quem decide se
 * mortos-vivos sem medo testam é o Mestre.
 */
export function moraleDue(actors: EncounterActor[]): boolean {
  const npcs = actors.filter(a => a.source === 'npc')
  if (npcs.length === 0) return false
  if (npcs.length === 1) {
    const solo = npcs[0]
    return !solo.defeated && !isFleeing(solo) && (solo.hpMax ?? 0) > 0 && (solo.hpCurrent ?? 0) * 2 <= (solo.hpMax ?? 0)
  }
  const down = npcs.filter(a => a.defeated).length
  return down > 0 && down * 2 >= npcs.length && npcs.some(a => !a.defeated && !isFleeing(a))
}
