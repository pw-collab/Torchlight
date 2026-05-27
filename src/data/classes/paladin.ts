import type { Class } from '@/types/class.types'

export const paladin: Class = {
  id: 'paladin',
  name: 'Paladin',
  hitDie: 8,

  weaponProficiency: 'Todas as armas',
  armorProficiency: 'Todas as armaduras e escudos',

  armorTraining: ['none', 'light', 'medium', 'heavy', 'shield'],
  weaponTraining: ['simple', 'martial', 'ranged'],

  techniques: [
    {
      id: 'divine_protection',
      name: 'Divine Protection',
      description:
        'O paladino faz testes para resistir a CDs contra magia e caos com vantagem. O paladino e aliados próximos ganham +1 nesses rolamentos. Se o paladino falhar usando esta habilidade, não poderá se beneficiar dela até descansar.',
      kind: 'passive',
    },
    {
      id: 'smite',
      name: 'Smite',
      description:
        '3/dia, um paladino pode golpear seu inimigo realizando um ataque corpo a corpo com vantagem e causando +1 de dano bônus por nível. Contra criaturas demoníacas, diabólicas, dracônicas ou mortas-vivas, o dano é +2 por nível. Conta como dano mágico. Pode ser usado para tocar uma criatura e curá-la por 1d8 + 1 por nível.',
      kind: 'limited_use',
      uses: {
        max: 3,
        resetOn: 'long_rest',
        perLabel: 'por dia',
      },
    },
    null,
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Ganhe 1 uso adicional de Golpe e Imposição de Mãos por dia.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 para rolamentos de ataque corpo a corpo e à distância.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 para Força, Constituição ou Carisma.' },
    { roll: '10-11', min: 10, max: 11, effect: '+1 Proteção Divina e o alcance aumenta: o dobro de próximo/perto (máximo).' },
    { roll: '12',    min: 12, max: 12, effect: 'Escolha um talento ou +2 pontos para distribuir nos atributos.' },
  ],

  archetypeLabel: 'Arquétipo de Paladino',
}
