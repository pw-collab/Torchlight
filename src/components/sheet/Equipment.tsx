'use client'

import { getItem } from '@/data/equipment/index'
import { OrnateTitle } from '@/components/shared/OrnateTitle'

interface Props {
  equipment: { itemId: string; slots: number }[]
}

export function Equipment({ equipment }: Props) {
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
        marginBottom: 10,
        paddingBottom: 7,
        borderBottom: '1px solid rgba(139,112,48,0.18)',
      }}>
        <OrnateTitle>⚗ Equipamento</OrnateTitle>
      </div>
      {equipment.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--parchment-warm)',
        }}>
          Nenhum item registrado no arquivo.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {equipment.map((e, i) => {
            const item = getItem(e.itemId)
            return (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '7px 0',
                  borderBottom: i < equipment.length - 1 ? '1px solid rgba(139,112,48,0.1)' : 'none',
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--parchment-light)',
                  letterSpacing: '0.03em',
                }}>
                  {item?.name ?? e.itemId}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--bone-muted)',
                }}>
                  {e.slots} slot{e.slots !== 1 ? 's' : ''}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
