import type { Class } from '@/types/class.types'

export const thief: Class = {
  id: 'thief',
  name: 'Thief',
  hitDie: 4,

  weaponProficiency: 'Armas simples, adagas, arco curto',
  armorProficiency: 'Armadura de couro (armaduras leves)',

  armorTraining: ['none', 'light'],
  weaponTraining: ['simple', 'ranged'],

  techniques: [
    {
      name: 'Backstab',
      description:
        'Se você atingir um inimigo que está desprevenido ou que não pode ver você, adicione seu nível ao dano causado.',
    },
    {
      name: 'Burglar',
      description:
        'Você tem vantagem em testes de Destreza para escalar, abrir fechaduras, remover armadilhas e outros atos de ladinagem.',
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: '+2 to one stat of your choice.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to attack rolls.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Dexterity or Intelligence stat.' },
    { roll: '10-11', min: 10, max: 11, effect: '+2 to Backstab damage bonus.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Especialização',

  startingGear: ['dagger', 'leather', 'torch', 'rope'],
}
