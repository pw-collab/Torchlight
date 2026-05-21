import type { Ancestry } from '@/types/ancestry.types'

export const human: Ancestry = {
  id: 'human',
  name: 'Human',
  traits: [
    { name: 'Ambitious', description: 'Gain one extra talent roll at level 1.' },
    { name: 'Adaptable', description: '+1 to any one stat of your choice at character creation.' },
  ],
}
