import type { Class } from '@/types/class.types'

export const priest: Class = {
  id: 'priest',
  name: 'Priest',
  hitDie: 6,

  weaponProficiency: 'Armas simples',
  armorProficiency: 'Todas as armaduras; Todos os escudos',

  armorTraining: ['none', 'light', 'medium', 'heavy', 'shield'],
  weaponTraining: ['simple'],

  spellcasting: {
    stat: 'wis',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
  },

  techniques: [
    {
      name: 'Turn Undead',
      description:
        'Como ação, erga seu símbolo sagrado e faça uma verificação de magia. Em sucesso, mortos-vivos com ND ≤ metade do seu nível (arredonde para cima) ficam em pânico e fogem por 1d4 rodadas.',
    },
    null,
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Learn one random divine spell of any tier you can cast.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to spellcasting checks.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Wisdom or Charisma stat.' },
    { roll: '10-11', min: 10, max: 11, effect: '+1 to Strength or Constitution stat.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Deidade',

  startingGear: ['mace', 'chainmail', 'torch', 'rope'],
}
