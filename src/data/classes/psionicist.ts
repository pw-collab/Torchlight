import type { Class } from '@/types/class.types'

export const psionicist: Class = {
  id: 'psionicist',
  name: 'Psionicist',
  hitDie: 6,

  weaponProficiency: 'Adaga, cimitarra, cajado',
  armorProficiency: 'Nenhuma',

  armorTraining: ['none'],
  weaponTraining: ['simple'],

  techniques: [
    {
      id: 'psychic_shield',
      name: 'Psychic Shield',
      description:
        'Adicione metade do seu nível (arredondado para baixo) à sua CA.',
      kind: 'passive',
    },
    {
      id: 'wild_talent',
      name: 'Wild Talent',
      description:
        'Você desenvolveu um poder psiônico selvagem e sobreviveu aos seus efeitos colaterais. Role 1d6 para determinar sua Disciplina Psiônica, depois role 1d100 para obter uma Ciência Psiônica dessa disciplina. Você pode rolar uma nova Disciplina no lugar de um rolamento de Talento de Classe. ' +
        'Disciplinas (1d6): 1 Clarividência, 2 Psicocinesia, 3 Psicometabolismo, 4 Telepath, 5 Psicoportsção, 6 Escolha qualquer.',
      kind: 'passive',
    },
    {
      id: 'psionic_devotion',
      name: 'Psionic Devotion',
      description:
        '3/dia, você pode estender sua disciplina para ativar sua Devoção Psiônica. O efeito depende de sua disciplina: Clarividência – Percepção Intuitiva (visão 360°, detecta invisíveis, localização precisa por 5 rodadas); Psicocinesia – Mente sobre Matéria (move objetos, controla fogo/luz/som ou lança objetos como armas 1d6 por 10 rodadas); Psicometabolismo – Corpo Adaptável (+2 CA, +2 FOR/DES/CON, ou andar sobre água/paredes por 10 rodadas); Telepatia – Toque Mental (comunicação mental, sentir/influenciar emoções ou sugestão simples por 10 rodadas); Psicoportsção – Passo Dimensional (teleporte até alcance distante ou incorpóreo por 1 rodada).',
      kind: 'limited_use',
      uses: {
        max: 3,
        resetOn: 'long_rest',
        perLabel: 'por dia',
      },
    },
    {
      id: 'psionic_checks',
      name: 'Psionic Checks',
      description:
        'Você pode conjurar as Ciências Psiônicas que conhece. Para ativar, role 1d20 e obtenha um resultado menor do que o Poder da Ciência (PS). O PS é calculado como ATR − modificador. Por exemplo, uma ciência com PS de "INT −3" tem uma pontuação três menor que sua Inteligência.',
      kind: 'passive',
    },
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Ganhe um uso adicional de sua Devoção Psiônica.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 para ataques corpo a corpo ou +1 para Verificações Psiônicas.' },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 para Inteligência, Constituição ou Sabedoria.' },
    { roll: '10-11', min: 10, max: 11, effect: 'Role um talento adicional na tabela de Talentos de Ciências Psiônicas.' },
    { roll: '12',    min: 12, max: 12, effect: 'Escolha um talento ou +2 pontos para distribuir nos atributos.' },
  ],

  archetypeLabel: 'Arquétipo Psiônico',
}
