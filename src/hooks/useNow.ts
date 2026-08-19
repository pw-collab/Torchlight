'use client'

import { useEffect, useState } from 'react'

/**
 * A clock that ticks, for anything rendered out of elapsed time — the light
 * burn-down above all (see `lib/light`). It writes nothing and stores nothing;
 * the value exists only to make the render happen again so the derived minutes
 * move.
 */
export function useNow(intervalMs = 15_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
