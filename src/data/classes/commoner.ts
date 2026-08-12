import type { Class } from '@/types/class.types'

/**
 * The level-0 option: no hit die of its own — starting HP is the CON modifier
 * (minimum 1). `hitDie: 0` is what the HP step reads to skip the roll.
 */
export const commoner: Class = {
  id: 'commoner',
  name: '0- Commoner',
  hitDie: 0,

  weaponProficiency: 'Todas as armas',
  armorProficiency: 'Todas as armaduras e escudos',

  techniques: [
    {
      id: 'beginners_luck',
      name: "Beginner's Luck",
      description: 'Pode empunhar todo tipo de equipamento até alcançar o 1º nível.',
      kind: 'passive',
    },
    {
      id: 'zero_level',
      name: 'Nível 0',
      description:
        'Personagens de nível 0 alcançam o 1º nível depois de sobreviver à sua primeira aventura.',
      kind: 'passive',
    },
    null,
    null,
  ],

  talentTable: [],

  startingGear: ['dagger', 'tocha', 'racoes'],
}
