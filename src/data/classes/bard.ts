import type { Class } from '@/types/class.types'

export const bard: Class = {
  id: 'bard',
  name: 'Bard',
  hitDie: 6,

  weaponProficiency: 'Besta, adaga, maça, arco curto, espada curta, lança, cajado',
  armorProficiency: 'Couro, cota de malha, cota de malha de mithral, escudos',

  armorTraining: ['light', 'medium', 'shield'],
  weaponTraining: ['simple', 'ranged'],

  techniques: [
    {
      id: 'bardic_arts',
      name: 'Bardic Arts',
      description:
        'Você é treinado em oratória, artes cênicas, lore e diplomacia. Você tem vantagem em testes relacionados.',
      kind: 'passive',
    },
    {
      id: 'magical_dabbler',
      name: 'Magical Dabbler',
      description:
        'Você pode ativar pergaminhos de magia e varinhas usando Carisma como atributo de conjuração. Se você falhar criticamente, role na tabela de contratempos do mago.',
      kind: 'passive',
    },
    {
      id: 'perform',
      name: 'Perform',
      description:
        'Faça um teste de Carisma para realizar um dos efeitos abaixo. Se falhar, não poderá usar aquele efeito novamente até descansar com sucesso.',
      kind: 'spell_like',
      spellLike: {
        castStat: 'cha',
        dc: 12,
        resetOn: 'long_rest',
        abilities: [
          {
            id: 'inspire',
            name: 'Inspirar',
            description: 'Um alvo em alcance próximo ganha um token de sorte.',
            dc: 12,
          },
          {
            id: 'fascinate',
            name: 'Fascinar',
            description:
              'Você prende todos os alvos de nível 4 ou menos dentro do alcance próximo por 1d4 rodadas.',
            dc: 15,
          },
        ],
      },
    },
    {
      id: 'prolific',
      name: 'Prolific',
      description:
        'Adicione 1d6 aos seus rolamentos de aprendizado. Grupos descansando com 1 ou mais bardos adicionam 1d6 aos seus rolamentos.',
      kind: 'passive',
    },
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Encontre uma varinha aleatória de padre ou mago (você escolhe).' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 para ataques corpo a corpo e à distância, ou +1 para rolamentos de Curinga Mágico.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 pontos para distribuir em quaisquer atributos.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Reduza a CD de seus efeitos de Performance em 3 cada (role novamente em caso de duplicata).' },
    { roll: '12',    min: 12, max: 12, effect: 'Escolha um talento.' },
  ],

  archetypeLabel: 'Arquétipo de Bardo',
}
