'use client'

interface Props {
  luckTokens: number
  onChange: (newValue: number) => void
}

export function LuckTokens({ luckTokens, onChange }: Props) {
  const displayCount = Math.max(luckTokens, 5)
  return (
    <div
      className="worn-border"
      style={{
        background: 'var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        borderTop: 'none',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 10,
        color: 'var(--bone-muted)',
      }}>
        Fortuna
      </span>
      <div style={{ display: 'flex', gap: 4, flex: 1 }}>
        {Array.from({ length: displayCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => onChange(i < luckTokens ? luckTokens - 1 : luckTokens + 1)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontSize: 14,
              color: i < luckTokens ? 'var(--gold-bright)' : 'var(--parchment-deep)',
              filter: i < luckTokens ? 'drop-shadow(0 0 3px rgba(201,168,76,0.5))' : 'none',
              transition: 'all 300ms',
            }}
            title={i < luckTokens ? 'Remover token' : 'Adicionar token'}
          >
            ✦
          </button>
        ))}
      </div>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--gold-bright)',
      }}>
        {luckTokens}
      </span>
    </div>
  )
}
