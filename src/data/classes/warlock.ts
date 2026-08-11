import type { Class } from '@/types/class.types'

/** Homebrew class from the campaign wiki. */
export const warlock: Class = {
  id: 'warlock',
  name: 'Warlock',
  hitDie: 8,

  weaponProficiency: 'Todas as armas',
  armorProficiency: 'Todas as armaduras e escudos',

  techniques: [
    {
      id: 'firebond_weapon',
      name: 'Firebond Weapon',
      description:
        'Puxando das chamas eternas do abismo, você pode incendiar sua arma corpo a corpo ou à distância como parte de um ataque. Ela causa 1d4 de dano de fogo adicional ao acertar. A chama da arma não é suficiente para perfurar a escuridão.',
      kind: 'passive',
    },
    {
      id: 'pact_invocation',
      name: 'Pact Invocation',
      description:
        'Você canaliza a magia implacável de um patrono de formas poderosas e únicas. Apenas um talento de Invocação pode estar ativo por vez.\nAo alcançar o 2º nível, role um talento na tabela de Piromancia, com rolagens adicionais a cada nível par. Você é imune à sua própria piromancia.',
      kind: 'passive',
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: '1/day, know the desires or fears of a creature in near range.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to melee or ranged attacks.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Strength, Dexterity or Constitution stat.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Roll an additional talent on the Pyromancy Talents table.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose one option or +2 points to distribute to stats.' },
  ],

  startingGear: ['longsword', 'leather-armor', 'tocha', 'racoes'],
}
