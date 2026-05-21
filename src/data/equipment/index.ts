import type { Item } from '@/types/equipment.types'
import { sword } from './weapons/sword'
import { dagger } from './weapons/dagger'
import { shortbow } from './weapons/shortbow'
import { mace } from './weapons/mace'
import { leather } from './armor/leather'
import { chainmail } from './armor/chainmail'
import { torchItem } from './gear/torch'
import { rope } from './gear/rope'

export const items: Item[] = [sword, dagger, shortbow, mace, leather, chainmail, torchItem, rope]

export function getItem(id: string): Item | undefined {
  return items.find(i => i.id === id)
}
