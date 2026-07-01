'use client'

import type { CSSProperties, ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Leading marker glyph (rendered in red). Defaults to the ⪧ used on the sheet's main panels. */
  marker?: string
  /** Optional content pinned to the right of the heading (buttons, links, etc.). */
  trailing?: ReactNode
  /** Extra styles merged onto the heading wrapper (e.g. { marginBottom: 10 }). */
  style?: CSSProperties
}

/**
 * Main panel heading — red marker glyph + gold Grenze title with a 2px gold
 * bottom rule. Matches the `⪧ Talentos & Habilidades` panel headers.
 */
export function SectionHeading({ children, marker = '⪧', trailing, style }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 8, borderBottom: '2px solid rgba(200,184,144,0.25)', ...style }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#ff444c', lineHeight: 1, flexShrink: 0 }}>{marker}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 24, color: '#c8b890', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{children}</span>
      </span>
      {trailing}
    </div>
  )
}

/**
 * Subsection heading — red marker glyph + gold Grenze title with a 1px gold
 * bottom rule. Matches the `⁕ Técnicas` subheaders.
 */
export function SectionSubheading({ children, marker = '⁕', trailing, style }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 7, borderBottom: '1px solid rgba(200,184,144,0.18)', ...style }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#ff444c', lineHeight: 1, flexShrink: 0 }}>{marker}</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, color: '#c8b890', lineHeight: 1 }}>{children}</span>
      </span>
      {trailing}
    </div>
  )
}
