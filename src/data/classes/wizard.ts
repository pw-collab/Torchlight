import type { Class } from '@/types/class.types'

export const wizard: Class = {
  id: 'wizard',
  name: 'Wizard',
  hitDie: 4,

  weaponProficiency: 'Adaga, cajado',
  armorProficiency: 'Nenhuma',

  armorTraining: ['none'],
  weaponTraining: ['simple'],

  spellcasting: {
    stat: 'int',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
  },

  techniques: [
    {
      id: 'spellcasting',
      name: 'Spellcasting',
      description:
        'Você pode conjurar magias de mago que conhece. Você começa conhecendo três magias de 1º nível à sua escolha da lista Arcana. A cada nível você escolhe novas magias de acordo com a tabela de Magias de Mago Conhecidas.',
      kind: 'passive',
    },
    {
      id: 'learning_spells',
      name: 'Learning Spells',
      description:
        'Você pode aprender permanentemente uma magia de mago de um pergaminho de magia estudando-o por um dia e tendo êxito em um teste de Inteligência CD 15. Independente do resultado, o pergaminho é consumido. Magias aprendidas desta forma não contam para o limite de magias conhecidas.',
      kind: 'passive',
    },
    null,
    null,
  ],

  // Talent table from Wizard.md — note the 3-7 / 8-9 split (distinct from other classes)
  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Crie um item mágico aleatório de um tipo que você escolher.' },
    { roll: '3-7',   min: 3,  max: 7,  effect: '+2 para o atributo Inteligência ou +1 para testes de conjuração de mago.' },
    { roll: '8-9',   min: 8,  max: 9,  effect: 'Ganhe vantagem para conjurar uma magia que você conheça.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Aprenda uma magia adicional de mago de qualquer nível que você conheça.' },
    { roll: '12',    min: 12, max: 12, effect: 'Escolha um talento ou +2 pontos para distribuir nos atributos.' },
  ],

  archetypeLabel: 'Escola de Magia',

  startingGear: ['dagger', 'torch', 'rope'],
}
