import type { Ancestry } from '@/types/ancestry.types'

export const calibanDamned: Ancestry = {
  id: 'caliban-damned',
  name: 'Caliban maldito',
  description:
    'Os malditos são os calibans mais raros, e seus traços os fazem ser associados à bruxaria: manchas, estigmas, cicatrizes, protuberâncias ósseas (que podem parecer chifres ou esporões), polidactilia, olhos de cores diferentes, pele de tom incomum. Malditos tendem a ter personalidades marcantes e exóticas.\n\nGeralmente têm o mesmo tamanho de um humano comum, e suas origens são frequentemente associadas a bruxas, lebres, fadas ou subterrâneos.',
  traits: [
    {
      name: 'Malediction',
      description: 'Aprenda uma magia arcana aleatória de círculo menor que 3. Conjure-a com CAR.',
    },
  ],
  domainOptions: ['*'],
  fixedLanguages: ['Diabolic'],
  pariahLevel: 5,
  languageRules: { domainPicks: 1 },
}
