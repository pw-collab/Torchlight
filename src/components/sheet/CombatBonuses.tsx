'use client'

interface Props {
  meleeBonus: number
  rangedBonus: number
  spellcastingBonus: number
  onUpdate: (patch: { meleeBonus?: number; rangedBonus?: number; spellcastingBonus?: number }) => void
}

export function CombatBonuses({ meleeBonus, rangedBonus, spellcastingBonus, onUpdate }: Props) {
  const panelBg = 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)'

  const items = [
    { label: 'Corpo-a-Corpo', key: 'meleeBonus' as const, value: meleeBonus, icon: '⚔' },
    { label: 'À Distância', key: 'rangedBonus' as const, value: rangedBonus, icon: '🏹' },
    { label: 'Conjuração', key: 'spellcastingBonus' as const, value: spellcastingBonus, icon: '☽' },
  ]

  return (
    <div
      className="worn-border"
      style={{
        background: panelBg,
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
        ✦ Bônus de Combate
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {items.map(({ label, key, value, icon }) => (
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
              fontFamily: 'var(--font-heading)',
              fontSize: 7,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--bone-muted)',
              marginBottom: 4,
            }}>
              {icon} {label}
            </div>
            <input
              type="number"
              value={value}
              onChange={e => onUpdate({ [key]: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: value > 0
                  ? 'var(--verdigris-light)'
                  : value < 0
                  ? 'var(--blood-bright)'
                  : 'var(--bone-white)',
                cursor: 'text',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
