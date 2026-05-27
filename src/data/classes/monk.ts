import type { Class } from '@/types/class.types'

export const monk: Class = {
  id: 'monk',
  name: 'Monk',
  hitDie: 8,

  weaponProficiency: 'Clava, adaga, dardo, espada longa, maça, espada curta, lança, cajado',
  armorProficiency: 'Nenhuma',

  armorTraining: ['none'],
  weaponTraining: ['simple'],

  techniques: [
    {
      id: 'iron_shirt',
      name: 'Iron Shirt',
      description:
        'Enquanto sem armadura, você tem +1 CA. Além disso, adicione metade do seu nível (arredondado para baixo) como bônus à sua CA.',
      kind: 'passive',
    },
    {
      id: 'iron_palm',
      name: 'Iron Palm',
      description:
        'Seus ataques desarmados causam 1d4 de dano e você tem +1 para rolamentos de ataque com eles. Além disso, adicione metade do seu nível ao bônus de ataque.',
      kind: 'passive',
    },
    {
      id: 'mysticism',
      name: 'Mysticism',
      description:
        'Faça um teste de atributo para usar uma técnica mística que você escolher. Se falhar, não poderá usar aquela técnica novamente até descansar com sucesso.',
      kind: 'spell_like',
      spellLike: {
        // Each ability overrides this with its own castStat (DEX or CON)
        castStat: 'dex',
        dc: 11,
        resetOn: 'long_rest',
        abilities: [
          {
            id: 'slow_fall',
            name: 'Queda Lenta',
            description:
              'Quando você cai, pode desacelerar sua descida para pousar com segurança, sem sofrer dano de queda.',
            castStat: 'dex',
            dc: 11,
          },
          {
            id: 'deflect_missiles',
            name: 'Deflexão de Projéteis',
            description:
              'Quando atingido por um ataque à distância, você pode reduzir o dano pelo seu nível de monge.',
            castStat: 'dex',
            dc: 12,
          },
          {
            id: 'purification',
            name: 'Purificação',
            description:
              'Você fica imune aos efeitos de veneno e doença por 5 rodadas.',
            castStat: 'con',
            dc: 13,
          },
          {
            id: 'chakra',
            name: 'Chakra',
            description:
              'Você é curado por um número de pontos de vida igual ao seu nível de monge.',
            castStat: 'con',
            dc: 14,
          },
          {
            id: 'gentle_fist',
            name: 'Golpe Suave',
            description:
              'Quando você acerta uma criatura com seu Iron Palm, pode mirar nos pontos de pressão com precisão letal. Se a criatura for de um nível igual ou inferior ao seu, ela morre instantaneamente. Se for de nível mais alto, sofre um rolamento adicional de Iron Palm em dano.',
            castStat: 'dex',
            dc: 15,
          },
        ],
      },
    },
    null,
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Você pode se mover o dobro do alcance próximo em seu turno e ainda realizar uma ação (role novamente se duplicado).' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+2 para Força, Destreza ou Constituição; ou ganhe +1 para ataques corpo a corpo.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: 'Seu Iron Palm causa um dado adicional de dano, no máximo 3d4.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Você ganha vantagem em testes de Misticismo para uma técnica que escolher (exceto Golpe Suave).' },
    { roll: '12',    min: 12, max: 12, effect: 'Escolha um talento de Monge ou +2 pontos para distribuir nos atributos.' },
  ],

  archetypeLabel: 'Arquétipo de Monge',
}
