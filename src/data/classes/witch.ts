import type { Class } from '@/types/class.types'

/** Homebrew class from the campaign wiki. Talent table pending. */
export const witch: Class = {
  id: 'witch',
  name: 'Witch',
  hitDie: 4,

  weaponProficiency: 'Adaga, cajado',
  armorProficiency: 'Armadura de couro',

  spellcasting: {
    stat: 'cha',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
    tradition: 'Witchcraft',
    // Spellcasting (below): three tier 1 spells from the witchcraft list.
    spellsKnown: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },

  techniques: [
    {
      id: 'familiar',
      name: 'Familiar',
      description:
        'Você tem um pequeno animal — um corvo, rato ou sapo — que o serve lealmente e fala o Comum. Seu familiar pode ser a origem das magias que você conjura: trate-o como se fosse você para determinar alcances. Se ele morrer, você pode restaurá-lo sacrificando permanentemente 1d4 pontos de vida.',
      kind: 'passive',
    },
    {
      id: 'spellcasting',
      name: 'Spellcasting',
      description:
        'Você pode conjurar as magias de bruxa que conhece. Você conhece três magias de 1º círculo à sua escolha da lista de Bruxaria. A cada nível, escolha novas magias conforme a tabela de Magias de Bruxa Conhecidas. Você usa Carisma para conjurar; a DC é 10 + o círculo da magia.\nSe falhar em um teste de conjuração, não pode lançar aquela magia até completar um descanso. Se rolar um 1 natural, role também na tabela de Percalço Diabólico do círculo da magia.',
      kind: 'passive',
    },
    {
      id: 'brew_potion',
      name: 'Brew Potion',
      description:
        'Usando um caldeirão, você pode preparar uma poção de qualquer magia que possa conjurar. Role como um teste de conjuração; leva uma hora, mas não exige componentes caros. A poção dura 24 horas antes de apodrecer em água salobra.',
      kind: 'passive',
    },
    null,
  ],

  talentTable: [],

  startingGear: ['dagger', 'leather-armor', 'tocha', 'frasco-ou-garrafa'],
}
