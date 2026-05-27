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
      name: 'Magic Missile',
      description:
        'Você sempre conhece a magia Míssil Mágico. Ela não ocupa um espaço de magia aprendida e não requer rolamento de conjuração — automaticamente atinge um alvo à sua escolha causando 1d4 de dano por nível.',
    },
    null,
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Learn one random arcane spell of any tier you can cast.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to spellcasting checks.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Intelligence or Wisdom stat.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Learn one additional tier 1 or tier 2 arcane spell.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Escola de Magia',

  startingGear: ['dagger', 'torch', 'rope'],
}
