import type { Ancestry } from '@/types/ancestry.types'

export const tiefling: Ancestry = {
  id: 'tiefling',
  name: 'Tiefling',
  description:
    'Tieflings são raros na Terra das Brumas. Confundidos rapidamente com demônios, sua vida em Ravenloft é dificílima e a fogueira costuma ser o destino mais comum.\n\nOs poucos que escapam desse fim usam disfarces mundanos ou mágicos para esconder a origem e evitam qualquer atividade que atraia atenção. Muitos têm características infernais específicas, mais sutis que os clássicos chifres e pele vermelha: Malocchio Aderre tem um sexto dedo em cada mão; a Besta das Colinas tem pele negra coberta de escamas e asas de couro.',
  traits: [
    {
      name: 'Heatsight',
      description:
        '1/dia você pode ver as assinaturas de calor de criaturas vivas por 3 rodadas.',
    },
  ],
  domainOptions: ['*'],
  fixedLanguages: ['Diabolic'],
  pariahLevel: 5,
  languageRules: { domainPicks: 1 },
}
