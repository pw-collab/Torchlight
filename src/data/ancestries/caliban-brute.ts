import type { Ancestry } from '@/types/ancestry.types'

export const calibanBrute: Ancestry = {
  id: 'caliban-brute',
  name: 'Caliban bruto',
  description:
    'Os brutos são os calibans mais comuns. A maioria tem grande força física, e é por eles que os calibans são lembrados em quase todo lugar. Sua aparência avantajada e seus traços desalinhados são frequentemente considerados feios pela sociedade, que costuma ter dificuldade em lidar com o diferente.\n\nUsam a potência física para serem aceitos, e o uso do termo "brutos" para designar calibans em tantos lugares vem dessa casta. São os mais altos entre os calibans e suas origens costumam ser associadas a alguma maldição ligada a gigantes ou ogros.',
  traits: [
    {
      name: 'Mighty',
      description: 'Você recebe +1 em rolagens de ataque e dano com armas corpo a corpo.',
    },
  ],
  domainOptions: ['*'],
  pariahLevel: 5,
  languageRules: { domainPicks: 1 },
}
