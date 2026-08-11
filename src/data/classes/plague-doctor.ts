import type { Class } from '@/types/class.types'

/** Shadowdark class from the campaign wiki. Talent table pending. */
export const plagueDoctor: Class = {
  id: 'plague-doctor',
  name: 'Plague Doctor',
  hitDie: 6,

  weaponProficiency: 'Mangual turíbulo, dardos, chicote de agulhas, estilete, rapieira',
  armorProficiency: 'Armadura de couro',

  techniques: [
    {
      id: 'mask_infusion',
      name: 'Mask Infusion',
      description:
        'Inale um elixir herbal pré-preparado da sua máscara para infusão imediata. Dura o dia todo e expira ao ser usado.',
      kind: 'passive',
    },
    {
      id: 'mesmerize_insect',
      name: 'Mesmerize Insect',
      description:
        '1/dia, você enfeitiça um inseto para entregar automaticamente um elixir nocivo a um alvo à distância Perto, por picada ou mordida.',
      kind: 'limited_use',
      uses: { max: 1, resetOn: 'long_rest', perLabel: 'por dia' },
    },
    {
      id: 'elixirs',
      name: 'Elixirs',
      description:
        'Você pode preparar elixires com um teste de INT, aplicando o modificador do método de entrega escolhido (ver tabela de Métodos de Entrega). Isso não custa uma ação.\nEm falha, não pode preparar aquele elixir novamente até descansar. Exceto pelas infusões de máscara, elixires expiram em 5 rodadas.\nSucesso crítico aumenta a DC ou a categoria do dado em um, ou dobra a duração. Falha crítica aplica o elixir nocivo em você mesmo.',
      kind: 'passive',
    },
    null,
  ],

  talentTable: [],

  startingGear: ['stiletto', 'leather-armor', 'kit-primeiros-socorros', 'tocha'],
}
