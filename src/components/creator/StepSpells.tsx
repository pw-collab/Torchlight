'use client'

import { getSpellsForClass } from '@/data/spells/index'

interface Props {
  classId: string
  selectedSpells: string[]
  onChange: (spells: string[]) => void
}

export function StepSpells({ classId, selectedSpells, onChange }: Props) {
  const available = getSpellsForClass(classId)

  if (available.length === 0) {
    return (
      <p style={{
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 12,
        color: 'var(--bone-muted)',
        textAlign: 'center',
        padding: '24px 0',
      }}>
        Nenhuma magia disponível para esta classe.
      </p>
    )
  }

  function toggle(id: string) {
    if (selectedSpells.includes(id)) {
      onChange(selectedSpells.filter(s => s !== id))
    } else {
      onChange([...selectedSpells, id])
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 11,
        color: 'var(--bone-muted)',
        lineHeight: 1.6,
        borderLeft: '2px solid rgba(107,78,138,0.4)',
        paddingLeft: 12,
      }}>
        O grimório começa com as magias que o mestre permitiu carregar.
        Cada palavra arcana tem um preço — escolha com cuidado.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {available.map(spell => {
          const selected = selectedSpells.includes(spell.id)
          return (
            <button
              key={spell.id}
              onClick={() => toggle(spell.id)}
              style={{
                background: selected ? 'rgba(74,48,104,0.18)' : 'rgba(13,10,5,0.5)',
                border: `1px solid ${selected ? 'rgba(107,78,138,0.5)' : 'rgba(139,112,48,0.18)'}`,
                borderRadius: 2,
                padding: '11px 14px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 200ms',
                boxShadow: selected ? '0 0 10px rgba(107,78,138,0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  color: selected ? 'var(--parchment-pale)' : 'var(--parchment-light)',
                  letterSpacing: '0.03em',
                }}>
                  {spell.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 7,
                  color: 'var(--mist-bright)',
                  background: 'rgba(74,48,104,0.25)',
                  border: '1px solid rgba(107,78,138,0.25)',
                  padding: '2px 6px',
                  borderRadius: 1,
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  NÍVEL {spell.tier}
                </span>
              </div>
              {spell.description && (
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 10,
                  color: 'var(--bone-muted)',
                  marginTop: 4,
                  lineHeight: 1.4,
                }}>
                  {spell.description}
                </p>
              )}
            </button>
          )
        })}
      </div>

      {selectedSpells.length > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(74,48,104,0.1)',
          border: '1px solid rgba(107,78,138,0.25)',
          borderRadius: 2,
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 10,
          color: 'var(--mist-bright)',
        }}>
          {selectedSpells.length} magia{selectedSpells.length !== 1 ? 's' : ''} selecionada{selectedSpells.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
