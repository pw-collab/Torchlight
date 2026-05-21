import type { Stat } from './class.types'

export interface Character {
  id: string
  name: string
  classId: string
  ancestryId: string
  level: number
  stats: Record<Stat, number>
  hpMax: number
  hpCurrent: number
  ac: number
  luckTokens: number
  equipment: { itemId: string; slots: number }[]
  spells: string[]
  torchEndAt: string | null
}

export interface CharacterRow {
  id: string
  user_id: string
  session_id: string
  name: string
  class_id: string
  ancestry_id: string
  level: number
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  hp_max: number
  hp_current: number
  ac: number
  luck_tokens: number
  equipment: { itemId: string; slots: number }[]
  spells: string[]
  torch_end_at: string | null
}

export function rowToCharacter(row: CharacterRow): Character {
  return {
    id: row.id,
    name: row.name,
    classId: row.class_id,
    ancestryId: row.ancestry_id,
    level: row.level,
    stats: {
      str: row.str,
      dex: row.dex,
      con: row.con,
      int: row.int,
      wis: row.wis,
      cha: row.cha,
    },
    hpMax: row.hp_max,
    hpCurrent: row.hp_current,
    ac: row.ac,
    luckTokens: row.luck_tokens,
    equipment: row.equipment,
    spells: row.spells,
    torchEndAt: row.torch_end_at,
  }
}
