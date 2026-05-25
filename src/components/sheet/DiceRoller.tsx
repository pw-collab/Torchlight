'use client'

import { useState } from 'react'
import { rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'

const DICE = [4, 6, 8, 10, 12, 20]

interface Props {
  characterName: string
  statMod?: number
  onRoll?: (result: RollResult) => void
}

export function DiceRoller({ characterName: _, statMod = 0, onRoll }: Props) {
  const [selectedDie, setSelectedDie] = useState(20)
  const [extraMod, setExtraMod] = useState(0)
  const [dc, setDc] = useState(14)
  const [lastResult, setLastResult] = useState<RollResult | null>(null)

  function roll() {
    const totalMod = statMod + extraMod
    const result = rollDie(`d${selectedDie}`, `Rolagem d${selectedDie}`, undefined, totalMod)
    result.isCritical = selectedDie === 20 && result.result === 20
    result.isFumble = selectedDie === 20 && result.result === 1
    setLastResult(result)
    if (onRoll) {
      onRoll(result)
    }
  }

  const success = lastResult ? lastResult.total >= dc : null

  return (
    <div
      className="worn-border"
      style={{
        background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
        padding: '14px 15px',
        borderRadius: 1,
      }}
    >
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 8.5,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: 'var(--bone-muted)',
        marginBottom: 12,
        paddingBottom: 7,
        borderBottom: '1px solid rgba(139,112,48,0.18)',
      }}>
        ✦ Rolagem de Dados
      </div>

      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {DICE.map(d => (
          <button
            key={d}
            onClick={() => setSelectedDie(d)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'all 350ms',
              background: selectedDie === d ? 'rgba(139,21,21,0.35)' : 'rgba(42,34,16,0.5)',
              border: selectedDie === d ? '1px solid var(--blood-mid)' : '1px solid rgba(139,112,48,0.28)',
              color: selectedDie === d ? 'var(--bone-white)' : 'var(--bone-muted)',
              boxShadow: selectedDie === d ? '0 0 6px rgba(139,21,21,0.3)' : 'none',
            }}
          >
            d{d}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 7.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--bone-muted)',
            marginBottom: 4,
          }}>
            Modificador
          </div>
          <input
            type="number"
            value={extraMod}
            onChange={e => setExtraMod(Number(e.target.value))}
            style={{
              width: '100%',
              background: 'var(--ink-deep)',
              border: '1px solid rgba(139,112,48,0.28)',
              color: 'var(--parchment-light)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '6px 8px',
              outline: 'none',
              borderRadius: 1,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 7.5,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--bone-muted)',
            marginBottom: 4,
          }}>
            DC Alvo
          </div>
          <input
            type="number"
            value={dc}
            onChange={e => setDc(Number(e.target.value))}
            style={{
              width: '100%',
              background: 'var(--ink-deep)',
              border: '1px solid rgba(139,112,48,0.28)',
              color: 'var(--parchment-light)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              padding: '6px 8px',
              outline: 'none',
              borderRadius: 1,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
            }}
          />
        </div>
      </div>

      <button
        onClick={roll}
        style={{
          width: '100%',
          background: 'var(--blood-mid)',
          border: '1px solid var(--blood-bright)',
          color: 'var(--bone-white)',
          fontFamily: 'var(--font-heading)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontWeight: 600,
          padding: '9px 0',
          cursor: 'pointer',
          borderRadius: 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5), 0 0 6px rgba(139,21,21,0.3)',
          transition: 'all 350ms',
        }}
      >
        ✦ Rolar d{selectedDie}
      </button>

      {lastResult && success !== null && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 1,
          background: success ? 'rgba(42,80,69,0.2)' : 'rgba(139,21,21,0.15)',
          border: `1px solid ${success ? 'rgba(42,80,69,0.4)' : 'rgba(139,21,21,0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'inkSpread 400ms cubic-bezier(0.4,0,0.2,1) both',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 22,
            fontWeight: 700,
            color: success ? '#3D7060' : 'var(--blood-bright)',
          }}>
            {lastResult.total}
          </span>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 8,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: success ? '#3D7060' : 'var(--blood-bright)',
            }}>
              {success ? 'Sucesso' : 'Falhou'}
            </div>
            <div style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 10,
              color: 'var(--bone-muted)',
            }}>
              rolou {lastResult.result} vs DC {dc}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
