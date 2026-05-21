'use client'

import { useMemo } from 'react'
import { maxSlots, usedSlots } from '@/lib/slots'

export function useSlots(str: number, equipment: { slots: number }[]) {
  const max = useMemo(() => maxSlots(str), [str])
  const used = useMemo(() => usedSlots(equipment), [equipment])
  const remaining = max - used
  const overEncumbered = used > max

  return { max, used, remaining, overEncumbered }
}
