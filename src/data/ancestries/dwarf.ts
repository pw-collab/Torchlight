import type { Ancestry } from '@/types/ancestry.types'

export const dwarf: Ancestry = {
  id: 'dwarf',
  name: 'Anão',
  traits: [
    {
      name: 'Stout',
      description: 'Comece com +2 HP. Role os ganhos de pontos de vida com vantagem.',
    },
  ],
  domainOptions: ['darkon'],
  fixedLanguages: ['Anão'],
  pariahLevel: '3/6',
  languageRules: { domainPicks: 'int_mod' },
}
