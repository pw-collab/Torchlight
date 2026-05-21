'use client'

import { useState } from 'react'
import type { Character } from '@/types/character.types'

interface Props {
  character: Character
  onClick: () => void
  expanded: boolean
}

export function PlayerCard({ character, onClick, expanded }: Props) {
  const [hov, setHov] = useState(false)
  const hpPercent = Math.max(0, (character.hpCurrent / character.hpMax) * 100)
  const hpBarColor = hpPercent > 50 ? '#3D7060' : hpPercent > 25 ? '#C4782A' : '#8B1515'
  const isDead = character.hpCurrent <= 0

  const torchActive = character.torchEndAt !== null
  const torchMins = torchActive
    ? Math.max(0, Math.ceil((new Date(character.torchEndAt!).getTime() - Date.now()) / 60000))
    : null
  const torchLow = torchMins !== null && torchMins <= 10

  const borderColor = isDead
    ? 'rgba(139,21,21,0.6)'
    : expanded || hov
      ? 'rgba(196,169,106,0.5)'
      : 'rgba(139,112,48,0.32)'

  const bg = isDead
    ? 'linear-gradient(148deg, rgba(139,21,21,.12) 0%, rgba(14,10,3,.16) 100%), #2E2210'
    : 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), #2E2210'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderTop: expanded ? '2px solid #8B7030' : `1px solid ${borderColor}`,
        boxShadow: expanded || hov
          ? '0 5px 18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(196,169,106,0.12)'
          : '0 3px 12px rgba(0,0,0,0.6)',
        padding: '13px 14px',
        cursor: 'pointer',
        transition: 'all 450ms cubic-bezier(0.4,0,0.2,1)',
        borderRadius: '2px 1px 3px 1px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 13, fontWeight: 600, color: '#D4C9A0', letterSpacing: '0.05em', lineHeight: 1.25 }}>
          {character.name}
        </h3>
        {isDead && (
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#C42020' }}>
            ☠ Caído
          </span>
        )}
      </div>

      {/* HP bar */}
      <div style={{ height: 3, width: '100%', background: '#130E07', borderRadius: 1, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ height: 3, background: hpBarColor, width: `${hpPercent}%`, transition: 'width 400ms', boxShadow: `0 0 4px ${hpBarColor}80` }} />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#C4A96A' }}>
          PV {character.hpCurrent}/{character.hpMax}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#7A6030' }}>
          CA {character.ac}
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, color: '#C9A84C' }}>
          ✦ {character.luckTokens}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: torchLow ? '#C42020' : torchActive ? '#C4782A' : '#3A2E18' }}>
          {torchActive ? (torchLow ? `⚠ ${torchMins}min` : `🕯 ${torchMins}min`) : '🌑'}
        </span>
      </div>
    </div>
  )
}
