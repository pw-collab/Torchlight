import type { Class } from '@/types/class.types'

/** Homebrew class from the campaign wiki. */
export const barbarian: Class = {
  id: 'barbarian',
  name: 'Barbarian',
  hitDie: 10,

  weaponProficiency: 'Todas as armas corpo a corpo',
  armorProficiency: 'Escudos',

  techniques: [
    {
      id: 'thoughtless_frenzy',
      name: 'Thoughtless Frenzy',
      description:
        'No seu turno, você pode entrar em Frenesi Irracional, que dura três rodadas:\n• Você faz dois ataques com arma no seu turno, em vez de um.\n• Você ganha bônus de dano igual ao seu modificador de Força.\n• Você tem +1 em todos os testes.\n• Magias ou habilidades que tentem enfeitiçar ou amedrontar você sofrem penalidade igual a metade do seu nível — o mesmo vale para testes de medo, horror e loucura.\nDurante o Frenesi, inimigos têm vantagem em ataques contra você. Recupera-se o uso após um descanso.',
      kind: 'limited_use',
      uses: { max: 1, resetOn: 'short_rest', perLabel: 'por descanso' },
    },
    {
      id: 'strength_is_all',
      name: 'Strength is All',
      description:
        'Um corpo forte é tudo de que você precisa:\n• Some seu modificador de Força às rolagens de iniciativa.\n• Você pode usar Força no lugar de Carisma ao intimidar uma criatura.\n• Você dobra seu modificador de Força em testes de Força.\n• Some seu modificador de Força à sua capacidade de carga.',
      kind: 'passive',
      modifier: { stat: 'str', applyTo: 'gearSlots', onlyIfPositive: true },
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'You score a critical hit on a natural roll of 19 or 20. Reroll if rolled again.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: 'You gain a +2 bonus to your Strength or Constitution score.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: 'You gain a +1 bonus to melee attack rolls.' },
    { roll: '10-11', min: 10, max: 11, effect: 'You gain a +1 bonus to all checks.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose one option from the table or +2 points to distribute to ability scores.' },
  ],

  startingGear: ['greataxe', 'shield', 'tocha', 'racoes'],
}
