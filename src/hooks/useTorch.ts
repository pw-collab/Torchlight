'use client'

import { useEffect, useState, useRef } from 'react'
import { sendToDiscord } from '@/lib/discord'

export function useTorch(torchEndAt: string | null, playerName: string, characterId: string, onUpdate: (torchEndAt: string | null) => void) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null)
  const warnedRef = useRef(false)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!torchEndAt) {
      setMinutesLeft(null)
      warnedRef.current = false
      expiredRef.current = false
      return
    }

    function tick() {
      const end = new Date(torchEndAt!).getTime()
      const now = Date.now()
      const diffMs = end - now
      const mins = Math.ceil(diffMs / 60000)

      if (diffMs <= 0) {
        setMinutesLeft(0)
        if (!expiredRef.current) {
          expiredRef.current = true
          onUpdate(null)
          sendToDiscord({ type: 'torch_out', player: playerName })
        }
      } else {
        setMinutesLeft(mins)
        if (mins <= 10 && !warnedRef.current) {
          warnedRef.current = true
          sendToDiscord({ type: 'torch_warning', player: playerName, minutesLeft: mins })
        }
      }
    }

    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [torchEndAt, playerName, onUpdate])

  async function lightTorch() {
    const end = new Date(Date.now() + 60 * 60 * 1000).toISOString()
    warnedRef.current = false
    expiredRef.current = false
    onUpdate(end)
    sendToDiscord({ type: 'torch_lit', player: playerName, minutesLeft: 60 })
  }

  async function extinguishTorch() {
    onUpdate(null)
  }

  return { minutesLeft, lightTorch, extinguishTorch }
}
