'use client'

import { useEffect, useState } from 'react'
import { tableNow, type TableClock } from '@/lib/dungeonClock'
import { serverNow, syncServerClock } from '@/lib/serverClock'

/**
 * The table's time, ticking: the server's clock with the table's pause and
 * shift applied. Everything that reads or writes light goes through this one
 * clock, so a torch is lit and burned on the same time on every device.
 *
 * Like `useNow`, it only drives re-renders. A handler that writes should call
 * `tableNow(clock, serverNow())` at the moment of the click, not reuse this
 * value, which can be one tick old.
 */
export function useTableNow(clock: TableClock | null | undefined, intervalMs = 15_000): number {
  const [now, setNow] = useState(() => serverNow())

  useEffect(() => {
    let alive = true
    void syncServerClock().then(() => {
      if (alive) setNow(serverNow())
    })
    const id = setInterval(() => setNow(serverNow()), intervalMs)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [intervalMs])

  return tableNow(clock, now)
}
