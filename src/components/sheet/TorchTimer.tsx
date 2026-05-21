'use client'

import { useTorch } from '@/hooks/useTorch'
import { useCallback } from 'react'

interface Props {
  torchEndAt: string | null
  playerName: string
  characterId: string
  onUpdate: (torchEndAt: string | null) => void
}

export function TorchTimer({ torchEndAt, playerName, characterId, onUpdate }: Props) {
  const stableOnUpdate = useCallback(onUpdate, [onUpdate])
  const { minutesLeft, lightTorch, extinguishTorch } = useTorch(torchEndAt, playerName, characterId, stableOnUpdate)

  const isLit = torchEndAt !== null
  const isLow = minutesLeft !== null && minutesLeft <= 10

  const background = isLit
    ? isLow
      ? 'linear-gradient(148deg, rgba(139,21,21,.18) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)'
      : 'linear-gradient(148deg, rgba(106,58,10,.2) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)'
    : 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)'

  const borderColor = isLit
    ? isLow ? 'rgba(139,21,21,0.45)' : 'rgba(196,120,42,0.35)'
    : 'rgba(139,112,48,0.33)'

  const boxShadow = isLit
    ? isLow
      ? '0 4px 14px rgba(0,0,0,0.6), 0 0 8px rgba(139,21,21,0.2)'
      : '0 4px 14px rgba(0,0,0,0.6), 0 0 8px rgba(196,120,42,0.15)'
    : '0 4px 14px rgba(0,0,0,0.6)'

  const labelColor = isLit
    ? isLow ? 'var(--blood-bright)' : 'var(--candle-amber)'
    : 'var(--bone-muted)'

  const labelText = isLit
    ? isLow ? '⚠ Tocha Quase Apagando' : '🕯 Tocha Acesa'
    : '🌑 Tocha Apagada'

  return (
    <div
      className="worn-border"
      style={{ background, border: `1px solid ${borderColor}`, boxShadow, padding: '12px 14px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 8.5,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: labelColor,
        }}>
          {labelText}
        </span>
        {isLit && minutesLeft !== null && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: isLow ? 'var(--blood-bright)' : 'var(--candle-amber)',
          }}>
            {minutesLeft}min
          </span>
        )}
      </div>
      {!isLit ? (
        <button
          onClick={lightTorch}
          style={{
            width: '100%',
            background: 'rgba(107,58,10,0.3)',
            border: '1px solid #6B3A0A',
            color: 'var(--bone-white)',
            fontFamily: 'var(--font-heading)',
            fontSize: 9.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '8px 0',
            cursor: 'pointer',
            borderRadius: 1,
            transition: 'all 350ms',
          }}
        >
          Acender Tocha
        </button>
      ) : (
        <button
          onClick={extinguishTorch}
          style={{
            width: '100%',
            background: 'rgba(42,34,16,0.4)',
            border: '1px solid rgba(139,112,48,0.3)',
            color: 'var(--bone-muted)',
            fontFamily: 'var(--font-heading)',
            fontSize: 9.5,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '8px 0',
            cursor: 'pointer',
            borderRadius: 1,
            transition: 'all 350ms',
          }}
        >
          Apagar Tocha
        </button>
      )}
    </div>
  )
}
