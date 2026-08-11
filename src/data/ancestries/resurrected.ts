import type { Ancestry } from '@/types/ancestry.types'

export const resurrected: Ancestry = {
  id: 'resurrected',
  name: 'Ressurreto',
  description:
    'Ressurretos são pessoas de qualquer espécie que foram trazidas de volta à vida, mas foram marcadas pela morte trágica que carregam para a nova vida.',
  traits: [
    {
      name: 'Corpse Walking',
      description:
        'Com 0 PV você permanece ativo, mas ainda está morrendo. Outra pessoa deve estabilizá-lo. Você morre prematuramente se receber novamente dano equivalente ao total de seus PV máximos.',
    },
  ],
  // Can originate from any domain — no language pool is pre-defined
  domainOptions: ['*'],
  pariahLevel: 6,
  // 1 language from origin domain + 1 additional free language
  languageRules: { domainPicks: 1, freePicks: 1 },
}
