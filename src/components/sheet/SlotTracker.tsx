'use client'

import { useSlots } from '@/hooks/useSlots'

interface Props {
  str: number
  equipment: { slots: number }[]
}

export function SlotTracker({ str, equipment }: Props) {
  const { max, used, overEncumbered } = useSlots(str, equipment)

  return (
    <div
      className="worn-border"
      style={{
        background: 'var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        borderTop: 'none',
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 10,
          color: 'var(--bone-muted)',
        }}>
          Capacidade de Carga
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: overEncumbered ? 'var(--blood-bright)' : 'var(--parchment-light)',
        }}>
          {used} / {max}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              border: `1px solid ${i < used ? (overEncumbered ? 'var(--blood-mid)' : '#8B7030') : 'rgba(139,112,48,0.25)'}`,
              background: i < used ? (overEncumbered ? 'rgba(139,21,21,0.4)' : 'rgba(139,112,48,0.3)') : 'rgba(0,0,0,0.3)',
              borderRadius: 1,
            }}
          />
        ))}
      </div>
      {overEncumbered && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          color: 'var(--blood-bright)',
          fontStyle: 'italic',
          marginTop: 6,
        }}>
          Sobrecarregado — penalidade de movimento aplicada.
        </p>
      )}
    </div>
  )
}
