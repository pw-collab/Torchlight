'use client'

import { modifier, modifierStr } from '@/lib/dice'
import type { Stat } from '@/types/class.types'

const STAT_LABELS: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

interface Props {
  stats: Record<Stat, number>
}

export function StatBlock({ stats }: Props) {
  const statKeys: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
      {statKeys.map(key => {
        const mod = modifier(stats[key])
        return (
          <div
            key={key}
            className="worn-border"
            style={{
              background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
              border: '1px solid rgba(139,112,48,0.22)',
              padding: '6px 2px',
              textAlign: 'center',
              borderRadius: 1,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--gold-bright)',
              lineHeight: 1,
            }}>
              {stats[key]}
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 6.5,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--bone-muted)',
              marginTop: 2,
            }}>
              {STAT_LABELS[key]}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: mod >= 0 ? '#3D7060' : 'var(--blood-bright)',
              marginTop: 1,
            }}>
              {modifierStr(stats[key])}
            </div>
          </div>
        )
      })}
    </div>
  )
}
