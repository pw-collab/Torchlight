'use client'

import { useState } from 'react'
import { rollStats, modifier, modifierStr } from '@/lib/dice'
import { canReroll } from '@/lib/reroll'
import type { Stat } from '@/types/class.types'

const STAT_META: Record<Stat, { label: string; full: string }> = {
  str: { label: 'FOR', full: 'Força' },
  dex: { label: 'DES', full: 'Destreza' },
  con: { label: 'CON', full: 'Constituição' },
  int: { label: 'INT', full: 'Inteligência' },
  wis: { label: 'SAB', full: 'Sabedoria' },
  cha: { label: 'CAR', full: 'Carisma' },
}

const STAT_KEYS: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

interface Props {
  stats: Record<Stat, number>
  onChange: (stats: Record<Stat, number>) => void
  editMode?: boolean
}

export function StepStats({ stats, onChange, editMode }: Props) {
  const [rolling, setRolling] = useState(false)
  const statValues = STAT_KEYS.map(k => stats[k])
  const allSet = statValues.every(v => v > 0)
  const eligible = allSet && canReroll(statValues)

  function handleRoll() {
    setRolling(true)
    setTimeout(() => {
      onChange(rollStats() as Record<Stat, number>)
      setRolling(false)
    }, 180)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Roll button */}
      <button
        onClick={handleRoll}
        disabled={rolling}
        style={{
          width: '100%',
          background: rolling ? 'rgba(139,112,48,0.06)' : 'rgba(139,112,48,0.14)',
          border: `1px solid ${rolling ? 'rgba(139,112,48,0.2)' : 'rgba(196,120,42,0.45)'}`,
          borderRadius: 2,
          padding: '14px 20px',
          fontFamily: 'var(--font-heading)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: rolling ? 'var(--bone-muted)' : 'var(--parchment-light)',
          cursor: rolling ? 'wait' : 'pointer',
          transition: 'all 200ms',
          boxShadow: rolling ? 'none' : '0 0 12px rgba(196,120,42,0.1)',
        }}
      >
        {rolling ? '⟳ Rolando os dados...' : allSet ? '⟳ Rolar novamente' : '✦ Rolar 3d6 por atributo'}
      </button>

      {editMode && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {STAT_KEYS.map(key => {
            const val = stats[key]
            const mod = Math.floor((val - 10) / 2)
            return (
              <div key={key} style={{
                background: 'rgba(20,14,6,0.5)',
                border: '1px solid rgba(139,112,48,0.2)',
                borderRadius: 2,
                padding: '10px 4px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--candle-amber)', opacity: 0.7, marginBottom: 4 }}>
                  {STAT_META[key].label}
                </div>
                <input
                  type="number"
                  value={val || ''}
                  min={1}
                  max={20}
                  onChange={e => {
                    const n = parseInt(e.target.value)
                    onChange({ ...stats, [key]: isNaN(n) ? 1 : Math.min(20, Math.max(1, n)) })
                  }}
                  style={{
                    width: '100%', background: 'var(--ink-deep)', border: '1px solid rgba(139,112,48,0.28)',
                    color: 'var(--parchment-light)', fontFamily: 'var(--font-mono)', fontSize: 14,
                    fontWeight: 700, padding: '3px 2px', outline: 'none', borderRadius: 1,
                    textAlign: 'center', boxSizing: 'border-box',
                    MozAppearance: 'textfield',
                  } as React.CSSProperties}
                />
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8.5, marginTop: 4,
                  color: mod > 0 ? 'var(--verdigris-light)' : mod < 0 ? 'var(--blood-bright)' : 'var(--bone-muted)',
                }}>
                  {mod >= 0 ? `+${mod}` : `${mod}`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {eligible && (
        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--candle-amber)',
          padding: '8px 12px',
          background: 'rgba(196,120,42,0.06)',
          border: '1px solid rgba(196,120,42,0.2)',
          borderRadius: 1,
        }}>
          Nenhum atributo excede 14 — o destino permite um novo lançamento.
        </div>
      )}

      {/* Stats grid */}
      {allSet && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {STAT_KEYS.map(key => {
            const val = stats[key]
            const mod = modifier(val)
            const modStr = modifierStr(val)
            const isHigh = val >= 16
            const isLow = val <= 6
            const color = isHigh ? 'var(--verdigris-light)' : isLow ? 'var(--blood-mid)' : 'var(--parchment-light)'

            return (
              <div key={key} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '14px 10px',
                background: 'rgba(20,14,6,0.5)',
                border: `1px solid ${isHigh ? 'rgba(61,112,96,0.4)' : isLow ? 'rgba(139,21,21,0.35)' : 'rgba(139,112,48,0.2)'}`,
                borderRadius: 2,
                gap: 2,
              }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 8,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--candle-amber)',
                  opacity: 0.7,
                }}>
                  {STAT_META[key].label}
                </span>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 30,
                  fontWeight: 700,
                  color,
                  lineHeight: 1,
                }}>
                  {val}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: mod > 0 ? 'var(--verdigris-light)' : mod < 0 ? 'var(--blood-mid)' : 'var(--bone-muted)',
                }}>
                  {modStr}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 9,
                  color: 'var(--bone-muted)',
                  opacity: 0.6,
                  marginTop: 2,
                }}>
                  {STAT_META[key].full}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {allSet && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 10,
          color: 'var(--bone-muted)',
          textAlign: 'center',
          opacity: 0.6,
        }}>
          Regra Shadowdark: 3d6 por atributo, em ordem. Sem modificações.
        </p>
      )}
    </div>
  )
}
