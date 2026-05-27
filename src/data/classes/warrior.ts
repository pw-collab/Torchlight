import type { Class } from '@/types/class.types'

export const warrior: Class = {
  id: 'warrior',
  name: 'Fighter',
  hitDie: 8,

  weaponProficiency: 'Todas as armas',
  armorProficiency: 'Todas as armaduras; Todos os escudos',

  armorTraining: ['none', 'light', 'medium', 'heavy', 'shield'],
  weaponTraining: ['simple', 'martial', 'ranged'],

  techniques: [
    {
      name: 'Hauler',
      description:
        'Adicione seu modificador de Constituição, se positivo, aos seus slots de carga.',
    },
    {
      name: 'Weapon Mastery',
      description:
        'Escolha um tipo de arma (ex.: espadas longas). Você ganha +1 para ataque e dano com esse tipo. Além disso, adicione metade do seu nível (arredonde para baixo) a esses rolamentos.',
    },
    {
      name: 'Grit',
      description:
        'Escolha Força ou Destreza. Você tem vantagem em testes desse atributo para superar uma força oposta, como arrombar uma porta travada (Força) ou se soltar de correntes enferrujadas (Destreza).',
    },
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Gain Weapon Mastery with one additional weapon type.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to melee and ranged attacks.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Strength, Dexterity, or Constitution stat.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Choose one kind of armor. You get +1 AC from that armor.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose a talent or +2 points to distribute to stats.' },
  ],

  archetypeLabel: 'Arquétipo de Combate',

  startingGear: ['sword', 'chainmail', 'torch', 'rope'],
}
