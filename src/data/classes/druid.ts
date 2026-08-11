import type { Class } from '@/types/class.types'

/** Shadowdark class from the campaign wiki. Talent table pending. */
export const druid: Class = {
  id: 'druid',
  name: 'Druid',
  hitDie: 6,

  weaponProficiency: 'Clava, adaga, azagaia, maça, arco curto, cajado',
  armorProficiency: 'Armadura de couro, escudos de madeira',

  spellcasting: {
    stat: 'wis',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
    tradition: 'Primal',
    // Spellcasting (below): two tier 1 spells from the nature list at level 1.
    spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },

  techniques: [
    {
      id: 'natures_bounty',
      name: "Nature's Bounty",
      description:
        'Você pode acessar a magia do mundo natural para ampliar suas capacidades. Cada dádiva pode ser usada uma vez por dia e dura 5 rodadas; você só se beneficia de uma por vez.\n• Força da Árvore: +1 de CA, e mais +1 por uma rodada se você não se mover no seu turno.\n• Estrondo Trovejante: ataques corpo a corpo causam dano adicional igual ao seu modificador de Sabedoria, e dano dobrado contra objetos não mágicos.\n• Semblante Calmo: some seu modificador de Sabedoria a todos os testes de Carisma. Criaturas Animais, Feéricas e Vegetais não serão hostis a você.',
      kind: 'passive',
    },
    {
      id: 'spellcasting',
      name: 'Spellcasting',
      description:
        'Você pode conjurar as magias Primais que conhece. Escolha duas magias de 1º círculo da lista da natureza. A cada nível, novas magias são escolhidas conforme a tabela de Magias Primais Conhecidas. Some seu modificador de Sabedoria ao conjurar; a DC é 10 + o círculo da magia.\nSe falhar em um teste de conjuração, não pode lançar aquela magia de novo até completar um descanso. Se rolar 1, não pode lançá-la até participar de uma purga ou cerimônia ritual.',
      kind: 'passive',
    },
    null,
    null,
  ],

  talentTable: [],

  startingGear: ['staff', 'leather-armor', 'tocha', 'racoes'],
}
