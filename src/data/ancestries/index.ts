import type { Ancestry } from '@/types/ancestry.types'
import { human } from './human'
import { elf } from './elf'
import { dwarf } from './dwarf'
import { halfling } from './halfling'
import { resurrected } from './resurrected'

export const ancestries: Ancestry[] = [human, elf, dwarf, halfling, resurrected]

export function getAncestry(id: string): Ancestry | undefined {
  return ancestries.find(a => a.id === id)
}
