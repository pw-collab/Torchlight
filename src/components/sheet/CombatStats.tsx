'use client'

import { useState } from 'react'

interface Props {
  hpMax: number
  hpCurrent: number
  onHpChange: (newHp: number) => void
}

export function CombatStats({ hpMax, hpCurrent, onHpChange }: Props) {
  const [step, setStep] = useState(1)
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
        background: 'var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        borderTop: 'none',
        padding: '16px',
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
        marginBottom: 10,
        overflow: 'hidden',
        borderRadius: 1,
      }}>
        <div style={{
          height: 6,
          background: hpColor,
          width: `${hpPercent}%`,
          transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
          boxShadow: `0 0 6px ${hpColor}60`,
        }} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
        <button
          onClick={() => handleHpInput(-step)}
          style={{
            flex: 1,
            background: 'rgba(139,21,21,0.25)',
            border: '1px solid var(--blood-mid)',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            padding: '12px 0',
            cursor: 'pointer',
            transition: 'all 350ms',
            minHeight: 44,
            borderRadius: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,21,21,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,21,21,0.25)' }}
        >
          − Dano
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={step}
          onChange={e => {
            const n = parseInt(e.target.value, 10)
            setStep(isNaN(n) ? 0 : Math.max(0, n))
          }}
          onBlur={() => { if (step < 1) setStep(1) }}
          title="Valor aplicado por clique"
          style={{
            width: 54,
            flexShrink: 0,
            background: 'var(--ink-deep)',
            border: '1px solid rgba(139,112,48,0.35)',
            color: 'var(--parchment-light)',
            fontFamily: 'var(--font-mono)',
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
            borderRadius: 1,
            boxSizing: 'border-box',
            minHeight: 44,
          }}
        />
        <button
          onClick={() => handleHpInput(step)}
          style={{
            flex: 1,
            background: 'rgba(42,80,69,0.25)',
            border: '1px solid #2A5045',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 13,
            padding: '12px 0',
            cursor: 'pointer',
            transition: 'all 350ms',
            minHeight: 44,
            borderRadius: 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(42,80,69,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(42,80,69,0.25)' }}
        >
          + Cura
        </button>
      </div>
    </div>
  )
}
