'use client'

import { useState, useEffect } from 'react'
import { modifier, modifierStr, rollDie } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import type { Stat } from '@/types/class.types'

const STAT_LABELS: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

const STAT_FULL: Record<Stat, string> = {
  str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma',
}

interface Props {
  stats: Record<Stat, number>
  onRoll?: (result: RollResult) => void
}

export function StatBlock({ stats, onRoll }: Props) {
  const [openStat, setOpenStat] = useState<Stat | null>(null)
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

  useEffect(() => {
    if (!openStat) return
    function close(e: MouseEvent | TouchEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('[data-stat-card]')) setOpenStat(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('touchstart', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('touchstart', close)
    }
  }, [openStat])

  function handleRollType(stat: Stat, type: 'normal' | 'advantage' | 'disadvantage') {
    if (!onRoll) return
    const mod = modifier(stats[stat])
    const result = rollDie(
      'd20',
      `${STAT_FULL[stat]}`,
      STAT_LABELS[stat],
      mod,
      type === 'advantage',
      type === 'disadvantage',
    )
    onRoll(result)
    setOpenStat(null)
  }

  return (
    <div className="grid-stats">
      {statKeys.map((key, idx) => {
        const mod = modifier(stats[key])
        const isOpen = openStat === key
        const isInteractive = !!onRoll
        // Determine dropdown alignment: last 3 stats open to the left
        const dropdownAlign = idx >= 3 ? { right: 0, left: 'auto', transform: 'none' } : { left: '50%', transform: 'translateX(-50%)' }

        return (
          <div
            key={key}
            data-stat-card
            onClick={() => isInteractive && setOpenStat(isOpen ? null : key)}
            className="worn-border"
            style={{
              position: 'relative',
              background: isOpen
                ? 'var(--gold-oxidized)'
                : 'var(--parchment-mid)',
              padding: '8px 2px 10px',
              textAlign: 'center',
              cursor: isInteractive ? 'pointer' : 'default',
              transition: 'all 300ms',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isOpen ? 'var(--parchment-mid)' : 'var(--parchment-light)',
              marginBottom: 2,
              transition: 'color 300ms',
            }}>
              {STAT_LABELS[key]}
            </div>

            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1,
              color: mod > 0
                ? 'var(--verdigris-light)'
                : mod < 0
                ? 'var(--blood-bright)'
                : 'var(--bone-white)',
            }}>
              {mod > 0 ? `+${mod}` : mod}
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: isOpen ? 'var(--parchment-mid)' : 'var(--gold-bright)',
              marginTop: 2,
            }}>
              {stats[key]}
            </div>

            {isOpen && (
              <div
                data-stat-card
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  zIndex: 50,
                  background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210',
                  border: '1px solid var(--gold-oxidized)',
                  borderTop: '4px solid var(--gold-oxidized)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  minWidth: 130,
                  animation: 'inkSpread 200ms cubic-bezier(0.4,0,0.2,1) both',
                  ...dropdownAlign,
                }}
                onClick={e => e.stopPropagation()}
              >
                {[
                  { id: 'normal' as const, label: 'Normal' },
                  { id: 'advantage' as const, label: '✦ Vantagem' },
                  { id: 'disadvantage' as const, label: '✕ Desvantagem' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => handleRollType(key, opt.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '11px 14px',
                      background: 'none',
                      border: 'none',
                      borderBottom: opt.id !== 'disadvantage' ? '1px solid rgba(139,112,48,0.15)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-body)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: opt.id === 'advantage'
                        ? 'var(--verdigris-light)'
                        : opt.id === 'disadvantage'
                        ? 'var(--blood-bright)'
                        : 'var(--parchment-light)',
                      transition: 'background 200ms',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,112,48,0.1)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'none'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
