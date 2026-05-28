'use client'

interface Props {
  hpMax: number
  hpCurrent: number
  onHpChange: (newHp: number) => void
}

export function CombatStats({ hpMax, hpCurrent, onHpChange }: Props) {
  const hpPercent = Math.max(0, (hpCurrent / hpMax) * 100)
  const hpColor = hpPercent > 50 ? '#3D7060' : hpPercent > 25 ? 'var(--candle-amber)' : 'var(--blood-mid)'

  function handleHpInput(delta: number) {
    const next = Math.min(hpMax, Math.max(0, hpCurrent + delta))
    onHpChange(next)
  }

  return (
    <div
      className="worn-border"
      style={{
        background: var(--parchment-mid),
        padding: '20px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--bone-muted)',
        }}>
          Pontos de Vida
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--parchment-light)' }}>
          {hpCurrent} / {hpMax}
        </span>
      </div>
      <div style={{
        height: 6,
        width: '100%',
        background: 'var(--ink-deep)',
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        <div style={{
          height: 6,
          background: hpColor,
          width: `${hpPercent}%`,
          transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 6px ${hpColor}60`,
        }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => handleHpInput(-1)}
          style={{
            flex: 1,
            background: 'rgba(139,21,21,0.25)',
            border: '1px solid var(--blood-mid)',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            padding: '8px 0',
            cursor: 'pointer',
            transition: 'all 350ms',
          }}
        >
          − Dano
        </button>
        <button
          onClick={() => handleHpInput(1)}
          style={{
            flex: 1,
            background: 'rgba(42,80,69,0.25)',
            border: '1px solid #2A5045',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            padding: '8px 0',
            cursor: 'pointer',
            transition: 'all 350ms',
          }}
        >
          + Cura
        </button>
      </div>
    </div>
  )
}
