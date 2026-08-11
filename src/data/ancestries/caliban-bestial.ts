import type { Ancestry } from '@/types/ancestry.types'

export const calibanBestial: Ancestry = {
  id: 'caliban-bestial',
  name: 'Caliban bestial',
  description:
    'Bestiais são calibans que possuem características animalescas devido a seus traços físicos. Também chamados de "selvagens", correspondem ao que resta no imaginário popular quando se fala de um caliban na floresta ou nas montanhas. Esses traços costumam lhes dar habilidades especiais, muitas vezes sobre-humanas.\n\nOs menores entre os calibans, suas origens são comumente associadas a alguma maldição ligada a metamorfos.',
  traits: [
    {
      name: 'Natural Weapon',
      description:
        'Você tem uma característica animal capaz de causar 1d6 de dano à distância de contato.',
    },
  ],
  domainOptions: ['*'],
  fixedLanguages: ['Sylvan'],
  pariahLevel: 5,
  languageRules: { domainPicks: 1 },
}
