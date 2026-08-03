'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface NumInputProps {
  value: number
  min?: number
  onCommit: (n: number) => void
  className?: string
}

/**
 * Numeric field that only commits on blur, so typing an intermediate value
 * (or clearing the field entirely) never fires a write.
 */
export function NumInput({ value, min, onCommit, className }: NumInputProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft !== null ? draft : String(value)

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={e => setDraft(e.target.value)}
      onFocus={e => { setDraft(String(value)); e.currentTarget.select() }}
      onBlur={() => {
        const n = parseInt(draft ?? String(value), 10)
        const safe = isNaN(n) ? (min ?? 0) : (min !== undefined ? Math.max(min, n) : n)
        setDraft(null)
        if (safe !== value) onCommit(safe)
      }}
      className={cn('text-center', className)}
    />
  )
}
