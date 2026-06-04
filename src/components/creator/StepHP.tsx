'use client'

import { useState } from 'react'
import { modifier, modifierStr } from '@/lib/dice'
import { getClass } from '@/data/classes/index'

interface Props {
  classId: string
  con: number
  hpMax: number
  onRoll: (hp: number) => void
  editMode?: boolean
}

export function StepHP({ classId, con, hpMax, onRoll, editMode }: Props) {
  const cls = getClass(classId)
  const conMod = modifier(con)
  const [rolling, setRolling] = useState(false)
  const [rawRoll, setRawRoll] = useState<number | null>(null)

  function rollHP() {
    if (!cls) return
    setRolling(true)
    setTimeout(() => {
      const roll = Math.floor(Math.random() * cls.hitDie) + 1
      const hp = Math.max(1, roll + conMod)
      setRawRoll(roll)
      onRoll(hp)
      setRolling(false)
    }, 240)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
      {cls && (
        <div style={{
          width: '100%',
          padding: '14px 18px',
          background: 'rgba(20,14,6,0.5)',
          border: '1px solid rgba(139,112,48,0.2)',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 8,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--candle-amber)',
              opacity: 0.7,
              display: 'block',
              marginBottom: 4,
            }}>
              Dado de Vida
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              color: 'var(--parchment-pale)',
              letterSpacing: '0.04em',
            }}>
              d{cls.hitDie}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 8,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--candle-amber)',
              opacity: 0.7,
              display: 'block',
              marginBottom: 4,
            }}>
              Mod. CON
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              color: conMod >= 0 ? 'var(--verdigris-light)' : 'var(--blood-mid)',
            }}>
              {modifierStr(con)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={rollHP}
        disabled={rolling || !cls}
        style={{
          width: '100%',
          background: rolling ? 'rgba(139,21,21,0.1)' : 'rgba(139,21,21,0.18)',
          border: `1px solid ${rolling ? 'rgba(139,21,21,0.2)' : 'rgba(196,32,32,0.4)'}`,
          borderRadius: 2,
          padding: '14px 20px',
          fontFamily: 'var(--font-heading)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: rolling ? 'var(--bone-muted)' : 'var(--blood-bright)',
          cursor: rolling ? 'wait' : 'pointer',
          transition: 'all 200ms',
        }}
      >
        {rolling ? '⟳ Rolando...' : hpMax > 0 ? '⟳ Rolar novamente' : '✦ Rolar HP Inicial'}
      </button>

      {editMode && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--blood-mid)', opacity: 0.7 }}>
            HP Máximo
          </div>
          <input
            type="number"
            value={hpMax || ''}
            min={1}
            max={999}
            onChange={e => {
              const n = parseInt(e.target.value)
              onRoll(isNaN(n) ? 1 : Math.min(999, Math.max(1, n)))
            }}
            style={{
              width: 120,
              background: 'var(--ink-deep)',
              border: '1px solid rgba(139,21,21,0.4)',
              color: 'var(--parchment-pale)',
              fontFamily: 'var(--font-heading)',
              fontSize: 48,
              fontWeight: 700,
              textAlign: 'center',
              padding: '8px 12px',
              outline: 'none',
              borderRadius: 2,
              boxSizing: 'border-box',
              MozAppearance: 'textfield',
            } as React.CSSProperties}
          />
        </div>
      )}

      {!editMode && hpMax > 0 && rawRoll !== null && (
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '24px 16px',
          background: 'rgba(61,6,6,0.2)',
          border: '1px solid rgba(139,21,21,0.35)',
          borderRadius: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 8,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'var(--blood-mid)',
            opacity: 0.7,
          }}>
            HP Máximo
          </span>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 64,
            fontWeight: 700,
            color: 'var(--parchment-pale)',
            lineHeight: 1,
          }}>
            {hpMax}
          </span>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--bone-muted)',
          }}>
            {rawRoll} (d{cls?.hitDie}) {conMod >= 0 ? '+' : ''}{conMod} (CON)
            {hpMax < rawRoll + conMod ? ' → mínimo 1' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
