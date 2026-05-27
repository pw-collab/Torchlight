import type { Ancestry } from '@/types/ancestry.types'

export const human: Ancestry = {
  id: 'human',
  name: 'Humano',
  traits: [
    {
      name: 'Ambitious',
      description: 'Você ganha um rolamento de talento adicional no 1º nível.',
    },
  ],
  domainOptions: [
    'i-cath', 'klorr', 'sithicus', 'avonleigh',
    'barovia', 'borca', 'darkon', 'dementlieu',
    'falkovnia', 'forlorn', 'har-akir', 'hazlan',
    'invidia', 'kartakass', 'keening', 'lamordia',
    'markovia', 'mordent', 'necropolis', 'nidala',
    'nova-vaasa', 'odiare', 'paridon', 'pharazia',
    'richemulot', 'rokushima-taiyoo', 'sanguinia', 'sebua',
    'shadowborn-manor', 'souragne', 'sri-raji', 'tepest',
    'timor', 'valachan', 'vechor', 'verbrek',
    'vorostokov', 'wildlands',
  ],
  pariahLevel: '0/6',
  // 1 language from chosen domain + INT-mod additional free languages
  languageRules: { domainPicks: 1, freePicks: 'int_mod' },
}
