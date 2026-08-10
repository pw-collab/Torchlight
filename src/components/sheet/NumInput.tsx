'use client'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NumInputProps {
  value: number
  min?: number
  onCommit: (n: number) => void
  className?: string
  'aria-label'?: string
}

/**
 * Numeric field that only commits on blur, so typing an intermediate value
 * (or clearing the field entirely) never fires a write. Enter commits early by
 * blurring; Escape drops the draft and leaves the stored value alone.
 */
export function NumInput({ value, min, onCommit, className, ...rest }: NumInputProps) {
  const [draft, setDraft] = useState<string | null>(null)
  // blur() runs its handler synchronously, before React has re-rendered with a
  // cleared draft — so Escape has to flag the cancel somewhere blur can see it.
  const cancelled = useRef(false)
  const display = draft !== null ? draft : String(value)

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={e => setDraft(e.target.value)}
      onFocus={e => { setDraft(String(value)); e.currentTarget.select() }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') { cancelled.current = true; e.currentTarget.blur() }
      }}
      onBlur={() => {
        if (cancelled.current) {
          cancelled.current = false
          setDraft(null)
          return
        }
        const n = parseInt(draft ?? String(value), 10)
        const safe = isNaN(n) ? (min ?? 0) : (min !== undefined ? Math.max(min, n) : n)
        setDraft(null)
        if (safe !== value) onCommit(safe)
      }}
      className={cn('text-center', className)}
      {...rest}
    />
  )
}
