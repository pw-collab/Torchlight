import type { Class } from '@/types/class.types'

/** Homebrew class from the campaign wiki. */
export const artificer: Class = {
  id: 'artificer',
  name: 'Artificer',
  hitDie: 4,

  weaponProficiency: 'Adaga, martelo, lança, martelo de guerra, besta, armas de fogo',
  armorProficiency: 'Todas as armaduras e escudos',

  techniques: [
    {
      id: 'weapon_improvements',
      name: 'Weapon Improvements',
      description:
        'Uma vez por descanso, escolha 2 Melhorias diferentes da tabela de Melhorias de Arma. Você pode aplicar cada melhoria escolhida até 3x/dia aos seus ataques. As melhorias duram até serem usadas.',
      kind: 'passive',
    },
    {
      id: 'field_fabrications',
      name: 'Field Fabrications',
      description:
        'Faça um teste de INT para fabricar um engenho simples. Em sucesso, você cria o item; em falha, não pode refazê-lo até descansar. Cada engenho dura um uso, salvo indicação em contrário.\n• Bomba de fumaça (DC 12): nuvem de fumaça por 1d4 rodadas\n• Tocha de ombro (DC 12): tocha montada em alça, mãos livres\n• Sino de arame (DC 13): dispara um ruído (duplo perto) ao toque\n• Gancho de escalada (DC 14): pode ser lançado (perto) para prender/puxar\n• Bússola (DC 14): aponta o norte, vantagem em navegação por 1 hora\n• Armadilha de mola (DC 14): armadilha de pressão que causa 1d6 de dano ou aciona mecanismos simples',
      kind: 'passive',
    },
    {
      id: 'master_of_mechanisms',
      name: 'Master of Mechanisms',
      description:
        'Você tem vantagem em testes para desarmar armadilhas, arrombar fechaduras, reparar dispositivos mecânicos ou identificar itens mágicos. Pode desmontar uma fechadura ou armadilha para ganhar +1 uso de melhorias de arma.',
      kind: 'passive',
    },
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Gain +2 Improvements and 1/day swap or reset all improvements.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 to melee and ranged attacks.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 to Intelligence, Charisma or Strength.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Spring-Loaded Trap deals an additional dice of damage.' },
    { roll: '12',    min: 12, max: 12, effect: 'Choose one option from this table.' },
  ],

  startingGear: ['dagger', 'leather-armor', 'tocha', 'ferramentas-de-reparo'],
}
