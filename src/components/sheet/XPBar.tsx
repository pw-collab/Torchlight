'use client'

const MAX_XP_BY_LEVEL = [0, 0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2300]

interface Props {
  level: number
  xp: number
  onUpdate: (xp: number) => void
}

export function XPBar({ level, xp, onUpdate }: Props) {
  const nextXp = MAX_XP_BY_LEVEL[level + 1] ?? MAX_XP_BY_LEVEL[10]
  const currFloor = MAX_XP_BY_LEVEL[level] ?? 0
  const progress = nextXp > currFloor ? Math.min(1, (xp - currFloor) / (nextXp - currFloor)) : 1
  const pct = Math.round(progress * 100)
  const barColor = pct >= 100 ? 'var(--gold-bright)' : 'var(--verdigris-light)'

  return (
    <div
      className="worn-border"
      style={{
        background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
        padding: '10px 14px',
        borderRadius: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: pct >= 100 ? 'var(--gold-bright)' : 'var(--bone-muted)' }}>
          {pct >= 100 ? '✦ Pronto para Subir de Nível!' : `✦ Experiência — Nível ${level}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            value={xp}
            min={0}
            onChange={e => onUpdate(Math.max(0, parseInt(e.target.value) || 0))}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--parchment-light)', textAlign: 'right', width: 50,
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--bone-muted)' }}>
            / {nextXp} XP
          </span>
        </div>
      </div>
      <div style={{ height: 3, background: 'var(--ink-deep)', borderRadius: 1, overflow: 'hidden' }}>
        <div style={{
          height: 3,
          background: barColor,
          width: `${pct}%`,
          transition: 'width 400ms',
          boxShadow: pct >= 100 ? `0 0 6px ${barColor}` : 'none',
        }} />
      </div>
    </div>
  )
}
