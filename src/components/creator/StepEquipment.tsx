'use client'

import { useState } from 'react'
import { getItem } from '@/data/equipment/index'
import { getClass } from '@/data/classes/index'
import { useSlots } from '@/hooks/useSlots'
import type { KnowledgeArea } from '@/types/character.types'

interface Props {
  classId: string
  str: number
  knowledgeAreas: KnowledgeArea[]
  onKnowledgeAreasChange: (areas: KnowledgeArea[]) => void
}

export function StepEquipment({ classId, str, knowledgeAreas, onKnowledgeAreasChange }: Props) {
  const cls = getClass(classId)
  const equipment = (cls?.startingGear ?? []).map(id => ({
    itemId: id,
    slots: getItem(id)?.slots ?? 1,
  }))
  const { max, used } = useSlots(str, equipment)

  const [kaName, setKaName] = useState('')
  const [kaBonus, setKaBonus] = useState(0)

  function addArea() {
    const trimmed = kaName.trim()
    if (!trimmed) return
    onKnowledgeAreasChange([...knowledgeAreas, { name: trimmed, bonus: kaBonus }])
    setKaName('')
    setKaBonus(0)
  }

  function removeArea(idx: number) {
    onKnowledgeAreasChange(knowledgeAreas.filter((_, i) => i !== idx))
  }

  const pct = max > 0 ? Math.min(1, used / max) : 0
  const encumbered = used > max

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Equipment list */}
      <section>
        <div style={sectionLabel}>Equipamento Inicial</div>
        <p style={sectionNote}>
          O equipamento de início é determinado pela sua classe.
          Novos itens poderão ser adicionados na ficha.
        </p>

        {/* Slot bar */}
        <div style={{ marginTop: 14, marginBottom: 12 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 5,
          }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 7,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: encumbered ? 'var(--blood-bright)' : 'var(--bone-muted)',
            }}>
              Slots de Carga
            </span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: encumbered ? 'var(--blood-bright)' : 'var(--parchment-light)',
            }}>
              {used} / {max}
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(139,112,48,0.12)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${pct * 100}%`,
              background: encumbered ? 'var(--blood-mid)' : 'linear-gradient(90deg, var(--gold-oxidized), var(--candle-amber))',
              transition: 'width 300ms',
            }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {equipment.map((e, i) => {
            const item = getItem(e.itemId)
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                background: 'rgba(20,14,6,0.5)',
                border: '1px solid rgba(139,112,48,0.15)',
                borderRadius: 2,
              }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'var(--parchment-light)',
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
              </div>
            )
          })}
        </div>
      </section>

      {/* Knowledge Areas */}
      <section>
        <div style={sectionLabel}>Áreas de Conhecimento</div>
        <p style={sectionNote}>
          Habilidades, ofícios e saberes que o personagem domina além do combate.
          Adicione um bônus que reflete proficiência.
        </p>

        {knowledgeAreas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12, marginBottom: 10 }}>
            {knowledgeAreas.map((ka, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                background: 'rgba(20,14,6,0.5)',
                border: '1px solid rgba(139,112,48,0.2)',
                borderRadius: 2,
              }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: 'var(--parchment-light)',
                  flex: 1,
                }}>
                  {ka.name}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: ka.bonus >= 0 ? 'var(--verdigris-light)' : 'var(--blood-mid)',
                  minWidth: 28,
                  textAlign: 'right',
                }}>
                  {ka.bonus >= 0 ? `+${ka.bonus}` : `${ka.bonus}`}
                </span>
                <button
                  onClick={() => removeArea(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--bone-muted)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    padding: '0 2px',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add area form */}
        <div style={{ display: 'flex', gap: 6, marginTop: knowledgeAreas.length > 0 ? 0 : 12 }}>
          <input
            type="text"
            value={kaName}
            onChange={e => setKaName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addArea()}
            placeholder="ex.: Herbalismo, Ferraria..."
            style={{
              flex: 1,
              background: 'rgba(13,10,5,0.7)',
              border: '1px solid rgba(139,112,48,0.25)',
              borderRadius: 2,
              padding: '8px 10px',
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--parchment-pale)',
              outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.5)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,112,48,0.25)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => setKaBonus(b => b - 1)}
              style={bonusBtn}
            >−</button>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: kaBonus >= 0 ? 'var(--verdigris-light)' : 'var(--blood-mid)',
              minWidth: 28,
              textAlign: 'center',
            }}>
              {kaBonus >= 0 ? `+${kaBonus}` : `${kaBonus}`}
            </span>
            <button
              onClick={() => setKaBonus(b => b + 1)}
              style={bonusBtn}
            >+</button>
          </div>
          <button
            onClick={addArea}
            style={{
              background: 'rgba(139,112,48,0.14)',
              border: '1px solid rgba(139,112,48,0.3)',
              borderRadius: 2,
              padding: '8px 12px',
              fontFamily: 'var(--font-heading)',
              fontSize: 9,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--parchment-light)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            + Add
          </button>
        </div>
      </section>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 8,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: 'var(--candle-amber)',
  marginBottom: 6,
}

const sectionNote: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 10,
  color: 'var(--bone-muted)',
  lineHeight: 1.5,
}

const bonusBtn: React.CSSProperties = {
  background: 'rgba(13,10,5,0.6)',
  border: '1px solid rgba(139,112,48,0.2)',
  borderRadius: 2,
  padding: '5px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  color: 'var(--parchment-light)',
  cursor: 'pointer',
  lineHeight: 1,
}
