import type { Class } from '@/types/class.types'
import { warrior } from './warrior'
import { thief } from './thief'
import { wizard } from './wizard'
import { priest } from './priest'
import { ranger } from './ranger'

export const classes: Class[] = [warrior, thief, wizard, priest, ranger]

export function getClass(id: string): Class | undefined {
  return classes.find(c => c.id === id)
}
