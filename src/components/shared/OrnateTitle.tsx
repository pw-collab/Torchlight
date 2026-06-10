'use client'

import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  color?: string
  fontSize?: number
  /** Extra styles for the wrapper (e.g. { flex: 1 }) */
  style?: CSSProperties
}

/**
 * Section title flanked by mirrored floral flourishes — the ornamental
 * framing used across the sheet's panel headers.
 */
export function OrnateTitle({ children, color = 'var(--bone-dim)', fontSize = 8.5, style }: Props) {
  const flourish: CSSProperties = {
    fontSize: fontSize + 3,
    lineHeight: 1,
    color,
    opacity: 0.5,
    flexShrink: 0,
    userSelect: 'none',
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minWidth: 0, ...style }}>
      <span aria-hidden style={{ ...flourish, transform: 'scaleX(-1)' }}>❧</span>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {children}
      </span>
      <span aria-hidden style={flourish}>❧</span>
    </span>
  )
}
