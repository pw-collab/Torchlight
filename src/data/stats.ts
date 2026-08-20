import type { Stat } from '@/types/class.types'

/** Os seis, na ordem em que a ficha os mostra. */
export const STAT_KEYS: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

/** A sigla — o que cabe num chip e no que o Mestre digita. */
export const STAT_LABELS: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

/** O nome por extenso, para rótulos de rolagem e leitura em voz alta. */
export const STAT_FULL: Record<Stat, string> = {
  str: 'Força',
  dex: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  wis: 'Sabedoria',
  cha: 'Carisma',
}

export function isStat(value: string | null | undefined): value is Stat {
  return value != null && (STAT_KEYS as string[]).includes(value)
}
