'use client'

interface Props {
  level: number
  xp: number
  onUpdate: (xp: number) => void
}

export function XPBar({ level, xp, onUpdate }: Props) {
  const nextXp = level * 10
  const pct = nextXp > 0 ? Math.min(100, Math.round((xp / nextXp) * 100)) : 100
  const ready = pct >= 100
  const barColor = ready ? 'var(--gold-bright)' : 'var(--verdigris-light)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{
        flex: 1,
        height: 3,
        background: 'rgba(0,0,0,0.35)',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
          boxShadow: ready ? `0 0 5px ${barColor}` : 'none',
        }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <input
          type="number"
          value={xp}
          min={0}
          onChange={e => onUpdate(Math.max(0, parseInt(e.target.value) || 0))}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: ready ? 'var(--gold-bright)' : 'var(--parchment-light)',
            textAlign: 'right',
            width: 34,
            padding: 0,
          }}
        />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--bone-muted)',
          whiteSpace: 'nowrap',
        }}>
          / {nextXp} XP
        </span>
      </div>
    </div>
  )
}
