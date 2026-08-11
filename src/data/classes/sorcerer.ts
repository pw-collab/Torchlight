import type { Class } from '@/types/class.types'

/**
 * Homebrew class from the campaign wiki. The entry there carries the concept
 * and the proficiencies; its talents, spell list and 2d6 table are still
 * unwritten, so nothing mechanical is invented here.
 */
export const sorcerer: Class = {
  id: 'sorcerer',
  name: 'Sorcerer',
  hitDie: 4,

  weaponProficiency: 'Adagas, espadas curtas, azagaias, cajados',
  armorProficiency: 'Armaduras leves',

  techniques: [null, null, null, null],

  talentTable: [],

  startingGear: ['dagger', 'leather-armor', 'tocha'],
}
