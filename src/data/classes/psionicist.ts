import type { Class } from '@/types/class.types'
import { distribute, fromTable, melee, pick, statBoost } from '@/data/talentOptions'

export const psionicist: Class = {
  id: 'psionicist',
  name: 'Psionicist',
  hitDie: 6,

  weaponProficiency: 'Adaga, cimitarra, cajado',
  armorProficiency: 'Nenhuma',

  armorTraining: ['none'],
  weaponTraining: ['simple'],

  // Sciences manifest through the spellcasting check (d20 + mod vs DC 10 +
  // circle). `stat` is only the fallback: each Science rolls the attribute
  // its title names — see `psionicStat`.
  spellcasting: {
    stat: 'int',
    spellsPerDay: [2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
    tradition: 'Psion',
    spellsKnown: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },

  techniques: [
    {
      id: 'psychic_shield',
      name: 'Psychic Shield',
      summary: '+½ nível na CA.',
      description:
        'Adicione metade do seu nível (arredondado para baixo) à sua CA.',
      kind: 'passive',
    },
    {
      id: 'wild_talent',
      name: 'Wild Talent',
      summary: 'Role sua Disciplina (1d6). Ela define sua Devoção.',
      description:
        'Você despertou um poder psiônico selvagem e sobreviveu aos seus efeitos colaterais. Role 1d6 para determinar sua Disciplina Psiônica. Ela define sua Devoção, e pelo menos uma das suas Ciências iniciais deve ser dessa disciplina. Você pode rolar uma nova Disciplina no lugar de um rolamento de Talento de Classe. ' +
        'Disciplinas (1d6): 1 Clarividência, 2 Psicocinese, 3 Psicometabolismo, 4 Telepatia, 5 Psicoportação, 6 Escolha qualquer.',
      kind: 'passive',
    },
    {
      id: 'psionic_devotion',
      name: 'Psionic Devotion',
      summary: '3/dia, ativa a Devoção da sua disciplina. Sem teste.',
      description:
        '3/dia, você pode estender sua disciplina para ativar sua Devoção Psiônica. A Devoção é o núcleo do seu poder: não exige teste e não se esgota numa falha, só gasta um uso. O efeito depende de sua disciplina: Clarividência – Percepção Intuitiva (visão 360°, detecta invisíveis, localização precisa por 5 rodadas); Psicocinese – Mente sobre Matéria (move objetos, controla fogo/luz/som ou lança objetos como armas 1d6 por 10 rodadas); Psicometabolismo – Corpo Adaptável (+2 CA, +2 FOR/DES/CON, ou andar sobre água/paredes por 10 rodadas); Telepatia – Toque Mental (comunicação mental, sentir/influenciar emoções ou sugestão simples por 10 rodadas); Psicoportação – Passo Dimensional (teleporte até alcance distante ou incorpóreo por 1 rodada).',
      kind: 'limited_use',
      uses: {
        max: 3,
        resetOn: 'long_rest',
        perLabel: 'por dia',
      },
    },
    {
      id: 'spellcasting',
      name: 'Psionic Sciences',
      summary: 'Manifesta Ciências com o atributo de cada uma. DC 10 + círculo.',
      description:
        'Você manifesta as Ciências Psiônicas que conhece. Você começa conhecendo duas Ciências de 1º círculo da lista Psiônica e aprende novas a cada nível conforme a tabela de Ciências Conhecidas.\n' +
        'Cada Ciência traz no nome o atributo que a move ([INT], [WIS], [CON] ou [CHA]). Para manifestar, role 1d20 + o modificador desse atributo; a DC é 10 + o círculo da Ciência.\n' +
        'Esgotamento: se falhar, aquela Ciência se apaga da sua mente até você completar um descanso.\n' +
        'Efeito de Poder: num 20 natural, a Ciência funciona e você aplica também o seu Power Score Effect.\n' +
        'Falha Crítica: num 1 natural, você sofre o Critical Fail descrito na Ciência, além de esgotá-la.',
      kind: 'passive',
    },
  ],

  talentTable: [
    { roll: '2',     min: 2,  max: 2,  effect: 'Ganhe um uso adicional de sua Devoção Psiônica.' },
    { roll: '3-6',   min: 3,  max: 6,  effect: '+1 para ataques corpo a corpo ou +1 para manifestar Ciências.',
      options: [...melee(1), ...pick('psionic-checks', '+1 para manifestar Ciências', [{ kind: 'spellcasting', amount: 1 }])] },
    { roll: '7-9',   min: 7,  max: 9,  effect: '+2 para Inteligência, Constituição ou Sabedoria.',
      options: statBoost(2, 'int', 'con', 'wis') },
    { roll: '10-11', min: 10, max: 11, effect: 'Aprenda uma Ciência Psiônica adicional de qualquer círculo que você possa manifestar.' },
    { roll: '12',    min: 12, max: 12, effect: 'Escolha um talento ou +2 pontos para distribuir nos atributos.',
      options: [...fromTable(), ...distribute(2)] },
  ],

  archetypeLabel: 'Arquétipo Psiônico',
}
