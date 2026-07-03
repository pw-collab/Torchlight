import type { CSSProperties } from 'react'

/**
 * Design-system button (Figma component set 64-849).
 *
 * One canonical size for every variant: min-height 32px, Grenze Regular
 * 14px, 1px tracking, 22px line-height, uppercase, 9px/19px padding,
 * square corners. Variants:
 *  - dark:   #0a0805 fill, gold #c8b890 border + label
 *  - red:    solid #ff444c fill, dark border + label
 *  - hollow: transparent fill, red #ff444c border + label
 *  - link:   borderless, red underlined label
 */
export type ButtonVariant = 'dark' | 'red' | 'hollow' | 'link'

const VARIANTS: Record<ButtonVariant, CSSProperties> = {
  dark:   { background: '#0a0805',     border: '1px solid #c8b890', color: '#c8b890' },
  red:    { background: '#ff444c',     border: '1px solid #0a0805', color: '#0a0805' },
  hollow: { background: 'transparent', border: '1px solid #ff444c', color: '#ff444c' },
  link:   { background: 'transparent', border: '1px solid transparent', color: '#ff444c', textDecoration: 'underline', textUnderlineOffset: '2px', padding: 1 },
}

export function buttonStyle(variant: ButtonVariant = 'dark'): CSSProperties {
  return {
    fontFamily: 'var(--font-heading)',
    fontSize: 14,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    lineHeight: '22px',
    textAlign: 'center',
    minHeight: 32,
    padding: '9px 19px',
    borderRadius: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 200ms, border-color 200ms, color 200ms, opacity 200ms',
    WebkitTapHighlightColor: 'transparent',
    ...VARIANTS[variant],
  }
}
