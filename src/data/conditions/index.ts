/**
 * O catálogo curto de condições.
 *
 * É um ponto de partida, não uma lei: o Mestre escreve a condição que a cena
 * pedir, e ela vale igual. O que o catálogo dá é o nome consistente, a
 * descrição para quem não lembra, e a marca de desvantagem — que é a única
 * coisa que o app usa mecanicamente, avisando no painel de dados em vez de
 * decidir a rolagem por ninguém.
 */
export interface ConditionDef {
  id: string
  label: string
  description: string
  /** A ficha anuncia desvantagem enquanto a condição estiver ativa. */
  disadvantage?: boolean
}

export const CONDITIONS: ConditionDef[] = [
  {
    id: 'cego',
    label: 'Cego',
    description: 'Não enxerga. Falha em qualquer teste que dependa da visão.',
    disadvantage: true,
  },
  {
    id: 'surdo',
    label: 'Surdo',
    description: 'Não ouve. Falha em qualquer teste que dependa da audição.',
  },
  {
    id: 'amedrontado',
    label: 'Amedrontado',
    description: 'Não consegue se aproximar da fonte do medo.',
    disadvantage: true,
  },
  {
    id: 'envenenado',
    label: 'Envenenado',
    description: 'O veneno corre — e cobra em tudo que exige firmeza.',
    disadvantage: true,
  },
  {
    id: 'atordoado',
    label: 'Atordoado',
    description: 'A cabeça ainda está zunindo.',
    disadvantage: true,
  },
  {
    id: 'contido',
    label: 'Contido',
    description: 'Preso, agarrado ou enredado; não sai do lugar.',
    disadvantage: true,
  },
  {
    id: 'caido',
    label: 'Caído',
    description: 'No chão. Levantar consome o movimento.',
    disadvantage: true,
  },
  {
    id: 'exausto',
    label: 'Exausto',
    description: 'Sem descanso, sem comida, sem fôlego.',
    disadvantage: true,
  },
  {
    id: 'paralisado',
    label: 'Paralisado',
    description: 'Não age e não se move.',
  },
  {
    id: 'inconsciente',
    label: 'Inconsciente',
    description: 'Apagado. Não percebe nada ao redor.',
  },
  {
    id: 'enfeiticado',
    label: 'Enfeitiçado',
    description: 'Vê quem lançou o feitiço como um aliado.',
  },
  {
    id: 'sangrando',
    label: 'Sangrando',
    description: 'Perde vida a cada rodada até alguém estancar.',
  },
  {
    id: 'invisivel',
    label: 'Invisível',
    description: 'Não pode ser visto sem ajuda mágica.',
  },
]

export function getCondition(id: string): ConditionDef | undefined {
  return CONDITIONS.find(c => c.id === id)
}
