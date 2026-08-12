import type { Ancestry } from '@/types/ancestry.types'

export const dwarf: Ancestry = {
  id: 'dwarf',
  name: 'Anão',
  description:
    'Fortes como as montanhas que chamam de lar, os anões são um povo sério e trabalhador. Sua mentalidade gira em torno da forja e da família. Possuem uma afinidade espiritual com a própria terra, sentindo a história nas pedras e o calor do coração da montanha em suas forjas. Valorizam a dedicação, o trabalho duro e a honra acima de tudo. Outras raças os veem como austeros e sem humor, mas todos respeitam imensamente a qualidade de seu artesanato.\n• O centro da cultura anã é a cidade de Tempe Falls, em Darkon.\n• Existem comunidades menores em outras regiões montanhosas, como a cordilheira dos Balinoks e a região da "Besta Adormecida" de Lamordia.\n\nJogar com um anão significa ser respeitado por sua habilidade e honra, mas muitas vezes ser incompreendido por sua seriedade e desdém por frivolidades.',
  traits: [
    {
      name: 'Stout',
      description: 'Comece com +2 HP. Role os ganhos de pontos de vida com vantagem.',
    },
  ],
  domainOptions: ['darkon'],
  fixedLanguages: ['Anão'],
  pariahLevel: 3,
  languageRules: { domainPicks: 1 },
}
