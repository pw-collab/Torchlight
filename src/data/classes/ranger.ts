import type { Class } from '@/types/class.types'

export const ranger: Class = {
  id: 'ranger',
  name: 'Ranger',
  hitDie: 6,

  weaponProficiency: 'Todas as armas',
  armorProficiency: 'Armaduras leves e médias; Escudos',

  armorTraining: ['none', 'light', 'medium', 'shield'],
  weaponTraining: ['simple', 'martial', 'ranged'],

  techniques: [
    {
      name: 'Animal Companion',
      description:
        'Você ganha um companheiro animal fiel. Este animal obedece seus comandos e age na sua iniciativa. Pode ser um lobo, falcão, urso ou outra criatura adequada ao ambiente.',
    },
    {
      name: 'Tracker',
      description:
        'Você tem vantagem em testes de Sabedoria para rastrear criaturas e navegar em terrenos naturais.',
    },
    {
      name: 'Wayfinder',
      description:
        'Você nunca se perde em terrenos naturais e pode identificar plantas, animais e fenômenos naturais comuns.',
    },
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: '+2 to one stat of your choice.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to ranged attack rolls.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Dexterity or Wisdom stat.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Your animal companion gains +1 HP per your level.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Domínio Natural',

  startingGear: ['shortbow', 'leather', 'dagger', 'torch'],
}
