import type { Ancestry } from '@/types/ancestry.types'

export const dwarf: Ancestry = {
  id: 'dwarf',
  name: 'Dwarf',
  traits: [
    { name: 'Stout', description: '+2 HP at each level.' },
    { name: 'Stonecunning', description: 'Notice stonework traps or unusual construction on a 1-in-2 chance.' },
  ],
}
