'use client'

interface Props {
  gold: number
  silver: number
  copper: number
  onUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
}

export function CurrencyPanel({ gold, silver, copper, onUpdate }: Props) {
  const coins = [
    { key: 'gold' as const, label: 'PO', color: 'var(--gold-bright)', value: gold },
    { key: 'silver' as const, label: 'PP', color: 'var(--bone-white)', value: silver },
    { key: 'copper' as const, label: 'PC', color: 'var(--candle-amber)', value: copper },
  ]

  return (
    <div
      className="worn-border"
      style={{
        background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
        padding: '12px 14px',
        borderRadius: 1,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 8.5,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--bone-muted)',
        marginBottom: 10,
        paddingBottom: 7,
        borderBottom: '1px solid rgba(139,112,48,0.18)',
      }}>
        Tesouro
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {coins.map(({ key, label, color, value }) => (
          <div
            key={key}
            className="worn-border"
            style={{
              background: 'rgba(42,34,16,0.4)',
              border: '1px solid rgba(139,112,48,0.22)',
              padding: '8px 10px',
              textAlign: 'center',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 9,
              color: 'var(--bone-muted)',
              marginBottom: 4,
            }}>
              {label}
            </div>
            <input
              type="number"
              value={value}
              min={0}
              onChange={e => onUpdate({ [key]: Math.max(0, parseInt(e.target.value) || 0) })}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color,
                cursor: 'text',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
