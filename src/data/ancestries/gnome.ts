import type { Ancestry } from '@/types/ancestry.types'

export const gnome: Ancestry = {
  id: 'gnome',
  name: 'Gnomo',
  description:
    'Os gnomos de Ravenloft são, em sua maioria, gnomos das rochas. Por serem pequenos, são tratados menos como ameaça e mais como algo a ser mantido à distância por cautela — tanto por sua ligação com o mágico quanto por sua personalidade excêntrica.\n\nVestem-se com cores vivas, ornamentos e joias sempre que possível. Atraem-se por atividades intelectuais e de ofício, especialmente quando envolvem engrenagens e correntes: alguns dos melhores relojoeiros de Dementlieu são gnomos, e muitos se tornam alquimistas, ourives e engenheiros.\n\nA maior comunidade gnômica da Terra das Brumas é a cidade de Mayvin, em Darkon. Pequenos grupos vivem em Valachan e Hazlan, onde sua engenhosidade é útil, e há uma comunidade notável em Nova Vaasa, onde seu humor virou moda entre as casas nobres.',
  traits: [
    {
      name: 'Trickster',
      description:
        '1/dia, escolha uma criatura como alvo de suas travessuras: você pode forçar a repetição de um ataque ou teste.',
    },
  ],
  domainOptions: ['darkon', 'odiare', 'hazlan', 'falkovnia', 'valachan'],
  fixedLanguages: ['Sylvan'],
  pariahLevel: 3,
  languageRules: { domainPicks: 1 },
}
