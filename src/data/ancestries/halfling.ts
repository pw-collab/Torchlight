import type { Ancestry } from '@/types/ancestry.types'

export const halfling: Ancestry = {
  id: 'halfling',
  name: 'Pequenino',
  description:
    'Diferente de outros mundos, não existem comunidades halflings permanentes conhecidas em Ravenloft. São um povo disperso, vivendo entre os humanos e muitas vezes passando despercebidos. Sua curiosidade inata os leva a muitas aventuras, mas sua natureza nômade significa que raramente criam raízes.\n• Não possuem assentamentos conhecidos.\n• Correm lendas sobre uma vila de halflings escondida nas florestas de Sithicus, mas dizem que seus habitantes foram torturados até a loucura e agora são criaturas selvagens e insanas.\n\nJogar com um pequenino é ser um rosto na multidão, um viajante curioso cuja natureza amigável esconde a falta de um verdadeiro lar.',
  traits: [
    {
      name: 'Stealthy',
      description: 'Uma vez por dia, você pode se tornar invisível por 3 rodadas.',
    },
  ],
  domainOptions: ['darkon', 'odiare', 'hazlan', 'falkovnia', 'richemulot', 'dementlieu', 'borca'],
  pariahLevel: 1,
  languageRules: { domainPicks: 1 },
}
