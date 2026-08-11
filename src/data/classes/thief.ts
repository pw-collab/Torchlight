import type { Class } from '@/types/class.types'

export const thief: Class = {
  id: 'thief',
  name: 'Thief',
  hitDie: 4,

  weaponProficiency: 'Clava, besta, adaga, arco curto, espada curta',
  armorProficiency: 'Armadura de couro, cota de malha de mithral',

  armorTraining: ['none', 'light'],
  weaponTraining: ['simple', 'ranged'],

  techniques: [
    {
      id: 'backstab',
      name: 'Backstab',
      description:
        'Se você atingir um inimigo que está desprevenido ou que não pode ver você, adicione seu nível ao dano causado.',
      // TODO: kind will be configured — likely 'passive' (always active when condition met)
    },
    {
      id: 'burglar',
      name: 'Burglar',
      description:
        'Você tem vantagem em testes de Destreza para escalar, abrir fechaduras, remover armadilhas e outros atos de ladinagem.',
      // TODO: kind will be configured — 'passive' (always active)
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Gain advantage on initiative rolls. (reroll if duplicate)' },
    { roll: '3-5',   min: 3,  max: 5,  effect: 'Your Backstab deals +1 dice of damage.' },
    { roll: '6-9',   min: 6,  max: 9,  effect: '+2 to Strength, Dexterity, or Charisma stat.' },
    { roll: '10-11', min: 10, max: 11, effect: '+1 to melee and ranged attacks.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Especialização',

  startingGear: ['dagger', 'leather', 'torch', 'rope'],
}
