export interface Spell {
  id: string
  name: string
  tier: number
  range: string
  duration: string
  castingTime: string
  description: string
  school?: string
}

export const wizardSpells: Spell[] = [
  {
    id: 'wiz_magic_missile',
    name: 'Magic Missile',
    tier: 1,
    range: '60 pés',
    duration: 'Instantâneo',
    castingTime: 'Ação',
    description: 'Causa 1d4 de dano automaticamente a um alvo à vista. Sem jogada de ataque.',
    school: 'Evocação',
  },
  {
    id: 'wiz_sleep',
    name: 'Sono',
    tier: 1,
    range: 'Próximo',
    duration: '1 turno',
    castingTime: 'Ação',
    description: 'Faz até 2d8 PV de criaturas adormecerem. Criaturas com mais PV não são afetadas.',
    school: 'Encantamento',
  },
  {
    id: 'wiz_detect_magic',
    name: 'Detectar Magia',
    tier: 1,
    range: 'Pessoal',
    duration: '1 turna',
    castingTime: 'Ação',
    description: 'Você sente auras mágicas dentro de 18 metros. Visível como brilho tênue.',
    school: 'Adivinhação',
  },
  {
    id: 'wiz_charm',
    name: 'Enfeitiçar Pessoa',
    tier: 1,
    range: 'Próximo',
    duration: '1 hora',
    castingTime: 'Ação',
    description: 'Um humanoide o trata como amigo enquanto durar o efeito. Falha em SAB anula.',
    school: 'Encantamento',
  },
  {
    id: 'wiz_fireball',
    name: 'Bola de Fogo',
    tier: 3,
    range: '150 pés',
    duration: 'Instantâneo',
    castingTime: 'Ação',
    description: 'Explosão causa 8d6 de dano de fogo em raio de 6 metros. SAB reduz à metade.',
    school: 'Evocação',
  },
  {
    id: 'wiz_fly',
    name: 'Voar',
    tier: 3,
    range: 'Toque',
    duration: '1 turna',
    castingTime: 'Ação',
    description: 'O alvo ganha velocidade de voo de 18 metros até o fim da sessão ou até cair.',
    school: 'Transmutação',
  },
  {
    id: 'wiz_invisibility',
    name: 'Invisibilidade',
    tier: 2,
    range: 'Toque',
    duration: 'Foco',
    castingTime: 'Ação',
    description: 'O alvo fica invisível até atacar ou lançar uma magia. Ataques contra ele têm desvantagem.',
    school: 'Ilusão',
  },
  {
    id: 'wiz_mirror_image',
    name: 'Imagem Espelhada',
    tier: 2,
    range: 'Pessoal',
    duration: '1 turno',
    castingTime: 'Ação',
    description: 'Cria 1d4 duplicatas de você. Atacantes devem rolar para determinar qual imagem atingem.',
    school: 'Ilusão',
  },
  {
    id: 'wiz_hold_person',
    name: 'Paralisar Pessoa',
    tier: 2,
    range: 'Próximo',
    duration: 'Foco',
    castingTime: 'Ação',
    description: 'Paralisa um humanoide. Falha em SAB anula. Ataques corpo a corpo contra ele são críticos.',
    school: 'Encantamento',
  },
  {
    id: 'wiz_lightning_bolt',
    name: 'Raio',
    tier: 3,
    range: 'Pessoal',
    duration: 'Instantâneo',
    castingTime: 'Ação',
    description: 'Um raio de 30 metros causa 8d6 de dano elétrico. SAB reduz à metade.',
    school: 'Evocação',
  },
]
