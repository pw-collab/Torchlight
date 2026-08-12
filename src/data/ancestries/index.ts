import type { Ancestry } from '@/types/ancestry.types'
import { human } from './human'
import { elf } from './elf'
import { dwarf } from './dwarf'
import { halfling } from './halfling'
import { gnome } from './gnome'
import { tiefling } from './tiefling'
import { resurrected } from './resurrected'
import { calibanBrute } from './caliban-brute'
import { calibanBestial } from './caliban-bestial'
import { calibanDamned } from './caliban-damned'

/** Listed the way the wiki gallery reads: the common peoples first, the pariahs last. */
export const ancestries: Ancestry[] = [
  human,
  elf,
  dwarf,
  halfling,
  gnome,
  tiefling,
  calibanBrute,
  calibanBestial,
  calibanDamned,
  resurrected,
]

export function getAncestry(id: string): Ancestry | undefined {
  return ancestries.find(a => a.id === id)
}
