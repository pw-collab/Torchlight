'use client'

import { useState, useEffect } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/**
 * Three-tier viewport classifier: mobile (≤767px), tablet (768–1023px),
 * desktop (≥1024px). Most components only need the binary `useIsMobile()` —
 * reach for this one only when a component genuinely needs to distinguish
 * a tablet-width layout from both phone and desktop.
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)')
    const tabletQuery = window.matchMedia('(max-width: 1023px)')

    const update = () => {
      setBreakpoint(mobileQuery.matches ? 'mobile' : tabletQuery.matches ? 'tablet' : 'desktop')
    }

    update()
    mobileQuery.addEventListener('change', update)
    tabletQuery.addEventListener('change', update)
    return () => {
      mobileQuery.removeEventListener('change', update)
      tabletQuery.removeEventListener('change', update)
    }
  }, [])

  return breakpoint
}
