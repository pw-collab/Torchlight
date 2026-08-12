import type { Ancestry } from '@/types/ancestry.types'

export const elf: Ancestry = {
  id: 'elf',
  name: 'Elfo',
  description:
    'Existem duas sociedades élficas distintas em Ravenloft, quase sem relação entre si. Ambas compartilham a agilidade e os traços finos característicos dos elfos, mas suas aparências e culturas são um estudo de contrastes.\n• Elfos Darkonianos: cabelos escuros e olhos verdes, violetas ou cinzentos. Sua moda é vibrante e muda com as estações, passando de pastéis na primavera e verão para tons de outono e, no inverno, preto e branco.\n• Elfos Sithicanos: cabelos prateados e olhos cor de âmbar. Preferem roupas de cores sóbrias e tecidos leves como seda ou cetim.\n\nJogar com um elfo é pertencer a uma cultura antiga e refinada — seja a vibrante e sazonal sociedade de Darkon, seja a sombria e melancólica nobreza de Sithicus.',
  traits: [
    {
      name: 'Farsight',
      description:
        'Você recebe +1 em rolagens de ataque com armas à distância ou +1 em testes de conjuração.',
    },
  ],
  domainOptions: ['sithicus', 'darkon', 'falkovnia', 'richemulot', 'kartakass'],
  fixedLanguages: ['Élfico', 'Sylvan'],
  pariahLevel: 1,
  languageRules: { domainPicks: 1 },
}
