import type { Class } from '@/types/class.types'

/** Homebrew class from the campaign wiki. */
export const sorcerer: Class = {
  id: 'sorcerer',
  name: 'Sorcerer',
  hitDie: 4,

  weaponProficiency: 'Adagas, espadas curtas, azagaias, cajados',
  armorProficiency: 'Armaduras leves',

  spellcasting: {
    stat: 'con',
    // Sorcerers draw from the Wizard list; the wiki's Advancement table gives
    // three spells at 1st level and one more per level after that.
    spellsPerDay: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    tradition: 'Arcane',
    spellsKnown: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  },

  techniques: [
    {
      id: 'spellcasting',
      name: 'Spellcasting',
      description:
        'Você conjura magias arcanas usando Constituição (DC 10 + o círculo da magia). Trabalhe com o mestre para definir quais magias refletem sua linhagem — fogo, sombra, tempestade e outros temas elementais ou caóticos são escolhas comuns.\nEm uma falha, você não pode conjurar aquela magia até descansar. Em um 1 natural, role na tabela de Percalços do Feiticeiro.',
      kind: 'passive',
    },
    {
      id: 'metamagic',
      name: 'Metamagic',
      description:
        'Ao conjurar, você pode modificar a magia escolhendo uma ou mais opções de Metamagia antes de rolar. Cada opção aumenta a DC do teste, e elas podem ser combinadas somando os aumentos.\n• Cuidadosa (+2): uma criatura à sua escolha não é afetada.\n• Distante (+2): dobra o alcance; Toque vira Perto.\n• Potencializada (+3): rerrole todos os dados de dano e use o novo resultado.\n• Estendida (+2): dobra a duração (máximo 24 horas).\n• Elevada (+4): em magias de área, escolha um alvo e role um teste adicional para ele.\n• Acelerada (+5): conjure sem gastar sua ação nesta rodada.\n• Buscadora (+2): rerrole a conjuração falha de uma magia do tipo míssil.\n• Sutil (+3): conjure sem componentes verbais ou somáticos.\n• Transmutada (+2): troque o tipo de dano por outro elemento.\n• Gêmea (+4): a magia atinge uma criatura adicional dentro do alcance.',
      kind: 'passive',
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Your critical failure threshold increases by 1 — both natural 1 and natural 2 now trigger a Mishap. In return, your Empowered Metamagic costs +1 DC less (minimum +1).' },
    { roll: '3-7',   min: 3,  max: 7,  effect: '+1 to spellcasting checks, or +1 to melee attack rolls.' },
    { roll: '8-9',   min: 8,  max: 9,  effect: '+2 to Strength, Dexterity, or Constitution.' },
    { roll: '10-11', min: 10, max: 11, effect: 'You learn a random spell of one tier higher than your current maximum. Until you reach the level to normally cast that tier, treat every failed check for that spell as a critical failure.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose any talent from this table, or gain +2 points to distribute freely among your ability scores.' },
  ],

  startingGear: ['dagger', 'leather-armor', 'tocha'],
}
