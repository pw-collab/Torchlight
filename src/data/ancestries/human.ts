import type { Ancestry } from '@/types/ancestry.types'

export const human: Ancestry = {
  id: 'human',
  name: 'Humano',
  description:
    'Humanos são o padrão, o comum, o normal. Entre todos os mortais, são de longe os mais presentes — e algumas raças falam disso com deboche ou repulsa. Em alguns lugares a maioria humana é tão esmagadora que seres de outras raças nunca foram vistos. Todos os tipos étnicos existem em Ravenloft, e nenhuma distinção é feita entre eles.\n\nPor que são tão comuns? Nem os eruditos souberam responder. Talvez as Potências Sombrias tenham alguma predileção; talvez o humano seja a criatura mais capaz tanto de grandes feitos heroicos quanto de atos hediondos.\n\nHumanos, sendo o padrão, desconfiam das outras raças. Essa desconfiança vai de um leve afastamento ao horror diante da aberração. Ser humano na Terra das Brumas costuma ser um grande privilégio: em Darkon, um não humano seria apenas um estranho; em Falkovnia ou Tepest, seria algo a ser temido ou caçado. Às vezes ambos.',
  traits: [
    {
      name: 'Ambitious',
      description: 'Você ganha um rolamento de talento adicional no 1º nível.',
    },
  ],
  // Humans are native to every inhabited domain.
  domainOptions: ['*'],
  pariahLevel: 0,
  // 1 language from the chosen domain + 1 additional free language
  languageRules: { domainPicks: 1, freePicks: 1 },
}
