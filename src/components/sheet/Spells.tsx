'use client'

import { getSpell, getSpellsForClass } from '@/data/spells/index'

interface Props {
  classId: string
  equippedSpells: string[]
}

export function Spells({ classId, equippedSpells }: Props) {
  const available = getSpellsForClass(classId)
  if (available.length === 0) return null

  return (
    <div
      className="worn-border"
      style={{
        background: 'linear-gradient(148deg, rgba(42,26,58,.22) 0%, rgba(30,18,40,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
        border: '1px solid rgba(107,78,138,0.3)',
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
        color: '#6B4E8A',
        marginBottom: 10,
        paddingBottom: 7,
        borderBottom: '1px solid rgba(107,78,138,0.2)',
      }}>
        ☽ Magias Preparadas
      </div>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {equippedSpells.length === 0 ? (
          <li style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--parchment-warm)',
          }}>
            Nenhuma magia preparada.
          </li>
        ) : equippedSpells.map(id => {
          const spell = getSpell(id) ?? available.find(s => s.id === id)
          return (
            <li key={id} style={{ padding: '7px 0', borderBottom: '1px solid rgba(107,78,138,0.1)' }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 11.5,
                fontWeight: 500,
                color: '#6B4E8A',
                letterSpacing: '0.04em',
                marginBottom: 2,
              }}>
                {spell?.name ?? id}
              </div>
              {spell && (
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 11,
                  color: 'var(--bone-muted)',
                  lineHeight: 1.55,
                }}>
                  {spell.description}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
