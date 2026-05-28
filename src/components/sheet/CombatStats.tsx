'use client'

interface Props {
  hpMax: number
  hpCurrent: number
  ac: number
  onHpChange: (newHp: number) => void
}

export function CombatStats({ hpMax, hpCurrent, ac, onHpChange }: Props) {
  const hpPercent = Math.max(0, (hpCurrent / hpMax) * 100)
  const hpColor = hpPercent > 50 ? '#3D7060' : hpPercent > 25 ? 'var(--candle-amber)' : 'var(--blood-mid)'

  function handleHpInput(delta: number) {
    const next = Math.min(hpMax, Math.max(0, hpCurrent + delta))
    onHpChange(next)
  }

  const panelStyle = {
    background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
    border: '1px solid rgba(139,112,48,0.33)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
  } as const

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      <div
        className="worn-border"
        style={{ flex: 1, ...panelStyle, padding: '12px 14px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 10,
            color: 'var(--bone-muted)',
          }}>
            Pontos de Vida
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--parchment-light)' }}>
            {hpCurrent} / {hpMax}
          </span>
        </div>
        <div style={{
          height: 4,
          width: '100%',
          background: 'var(--ink-deep)',
          borderRadius: 1,
          marginBottom: 10,
          overflow: 'hidden',
        }}>
          <div style={{
            height: 4,
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
              fontSize: 11,
              padding: '7px 0',
              cursor: 'pointer',
              borderRadius: 1,
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
              fontSize: 11,
              padding: '7px 0',
              cursor: 'pointer',
              borderRadius: 1,
              transition: 'all 350ms',
            }}
          >
            + Cura
          </button>
        </div>
      </div>

      <div
        className="worn-border"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 20px',
          ...panelStyle,
        }}
      >
        <span style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 9,
          color: 'var(--bone-muted)',
          marginBottom: 2,
          letterSpacing: '0.04em',
        }}>
          CA
        </span>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--bone-white)',
          lineHeight: 1,
        }}>
          {ac}
        </span>
      </div>
    </div>
  )
}
