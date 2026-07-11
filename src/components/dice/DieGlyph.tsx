/* Shared die icon — a solid filled polygon with a number punched over it.
   Used by the roller buttons (number = sides) and the 3D scene
   (number = current face value while tumbling). */

export const DIE_SHAPES: Record<number, React.ReactNode> = {
  4:  <polygon points="16,3 29,27 3,27" />,
  6:  <rect x="5" y="5" width="22" height="22" rx="3" />,
  8:  <polygon points="16,2 30,16 16,30 2,16" />,
  10: <polygon points="16,2 28,12 23,29 9,29 4,12" />,
  12: <polygon points="16,3 29,13 24,29 8,29 3,13" />,
  20: <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" />,
}

interface Props {
  sides: number
  /** Number shown on the face; defaults to the die's side count. */
  value?: number
  size?: number
  shapeColor: string
  numberColor: string
  className?: string
}

export function DieGlyph({ sides, value, size = 32, shapeColor, numberColor, className }: Props) {
  return (
    <span
      className={className}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-flex' }}
      aria-hidden
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill={shapeColor} style={{ transition: 'fill 180ms ease' }}>
        {DIE_SHAPES[sides] ?? DIE_SHAPES[20]}
      </svg>
      <span
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-heading)', fontWeight: 700,
          fontSize: Math.round(size * 0.375), lineHeight: 1,
          color: numberColor,
          paddingTop: sides === 4 ? Math.round(size * 0.18) : 0,
        }}
      >
        {value ?? sides}
      </span>
    </span>
  )
}
