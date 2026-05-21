import type { Ancestry } from '@/types/ancestry.types'

export const elf: Ancestry = {
  id: 'elf',
  name: 'Elf',
  traits: [
    { name: 'Farsight', description: '+1 to ranged attack rolls or INT checks.' },
    { name: 'Keen Senses', description: 'Detect secret doors on a 1-in-2 chance.' },
  ],
}
