'use client'
import { useState } from 'react'

interface NumInputProps {
  value: number
  min?: number
  onCommit: (n: number) => void
  style?: React.CSSProperties
}

export function NumInput({ value, min, onCommit, style }: NumInputProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft !== null ? draft : String(value)

  return (
    <input
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
      style={style}
    />
  )
}
