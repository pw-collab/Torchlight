import type { CSSProperties } from 'react'

/**
 * Design-system button (Figma node 64-849).
 *
 * Canonical form: Grenze, uppercase, 3px tracking, 44px height,
 * 9px/19px padding, square corners. Three variants:
 *  - dark:    #0a0805 fill, gold border + label
 *  - primary: solid amber #e0a040 fill, dark label
 *  - danger:  transparent fill, red #ff6044 border + label
 */
export type ButtonVariant = 'dark' | 'primary' | 'danger'
export type ButtonSize = 'md' | 'sm'

const VARIANTS: Record<ButtonVariant, { bg: string; border: string; color: string }> = {
  dark:    { bg: '#0a0805',     border: '#c8b890', color: '#c8b890' },
  primary: { bg: '#e0a040',     border: '#0a0805', color: '#0a0805' },
  danger:  { bg: 'transparent', border: '#ff6044', color: '#ff6044' },
}

export function buttonStyle(variant: ButtonVariant = 'dark', size: ButtonSize = 'md'): CSSProperties {
  const v = VARIANTS[variant]
  const md = size === 'md'
  return {
    background: v.bg,
    border: `1px solid ${v.border}`,
    color: v.color,
    fontFamily: 'var(--font-heading)',
    fontSize: md ? 16 : 11,
    letterSpacing: md ? '3px' : '1.5px',
    textTransform: 'uppercase',
    lineHeight: md ? '22px' : '14px',
    minHeight: md ? 44 : 30,
    padding: md ? '9px 19px' : '4px 10px',
    borderRadius: 0,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 200ms, border-color 200ms, color 200ms, opacity 200ms',
    WebkitTapHighlightColor: 'transparent',
  }
}
