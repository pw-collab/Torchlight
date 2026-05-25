'use client'

import { useState } from 'react'
import { getSpell, getSpellsForClass } from '@/data/spells/index'

const TIER_LABEL = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

const STAT_OPTIONS = [
  { value: 'str', label: 'FOR — Força' },
  { value: 'dex', label: 'DES — Destreza' },
  { value: 'con', label: 'CON — Constituição' },
  { value: 'int', label: 'INT — Inteligência' },
  { value: 'wis', label: 'SAB — Sabedoria' },
  { value: 'cha', label: 'CAR — Carisma' },
]

interface Props {
  classId: string
  equippedSpells: string[]
  spellcastingBonus?: number
  castingAttr?: string
  onUpdate?: (patch: { spellcastingBonus?: number; castingAttr?: string }) => void
}

export function Spells({ classId, equippedSpells, spellcastingBonus = 0, castingAttr = 'int', onUpdate }: Props) {
  const available = getSpellsForClass(classId)
  const [expanded, setExpanded] = useState<string | null>(null)

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
      {/* Header + spellcasting controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(107,78,138,0.2)' }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 8.5,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#6B4E8A',
          flex: 1,
        }}>
          ☽ Magias Preparadas
        </span>

        {onUpdate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(107,78,138,0.7)', whiteSpace: 'nowrap' }}>
              Bônus
            </span>
            <input
              type="number"
              value={spellcastingBonus}
              onChange={e => onUpdate({ spellcastingBonus: parseInt(e.target.value) || 0 })}
              style={{
                width: 46,
                background: 'rgba(42,26,58,0.5)',
                border: '1px solid rgba(107,78,138,0.35)',
                color: spellcastingBonus > 0 ? 'var(--verdigris-light)' : spellcastingBonus < 0 ? 'var(--blood-bright)' : 'var(--bone-white)',
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
                fontWeight: 700,
                padding: '3px 4px',
                outline: 'none',
                borderRadius: 2,
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(107,78,138,0.7)', whiteSpace: 'nowrap' }}>
              Atrib.
            </span>
            <select
              value={castingAttr}
              onChange={e => onUpdate({ castingAttr: e.target.value })}
              style={{
                background: 'rgba(42,26,58,0.5)',
                border: '1px solid rgba(107,78,138,0.35)',
                color: 'var(--parchment-light)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 6px',
                outline: 'none',
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              {STAT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {equippedSpells.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'var(--parchment-warm)',
        }}>
          Nenhuma magia preparada.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {equippedSpells.map(id => {
            const spell = getSpell(id) ?? available.find(s => s.id === id)
            const isOpen = expanded === id

            return (
              <li
                key={id}
                onClick={() => setExpanded(isOpen ? null : id)}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid rgba(107,78,138,0.12)',
                  cursor: spell ? 'pointer' : 'default',
                  transition: 'all 250ms',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {spell && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#6B4E8A',
                      background: 'rgba(107,78,138,0.15)',
                      border: '1px solid rgba(107,78,138,0.3)',
                      padding: '1px 5px',
                      borderRadius: 1,
                      flexShrink: 0,
                    }}>
                      {TIER_LABEL[(spell.tier - 1)] ?? spell.tier}
                    </span>
                  )}
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: '#8B6AAA',
                    letterSpacing: '0.04em',
                    flex: 1,
                  }}>
                    {spell?.name ?? id}
                  </span>
                  {spell && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 8,
                      color: 'var(--parchment-warm)',
                      flexShrink: 0,
                    }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {spell && isOpen && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(107,78,138,0.1)',
                      animation: 'inkSpread 200ms cubic-bezier(0.4,0,0.2,1) both',
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', gap: 14, marginBottom: 7, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Alcance', value: spell.range },
                        { label: 'Duração', value: spell.duration },
                        { label: 'Conjuração', value: spell.castingTime },
                        ...(spell.school ? [{ label: 'Escola', value: spell.school }] : []),
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 7,
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: '#6B4E8A',
                            marginBottom: 1,
                          }}>
                            {label}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            color: 'var(--parchment-light)',
                          }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p style={{
                      fontFamily: 'var(--font-body)',
                      fontStyle: 'italic',
                      fontSize: 11,
                      color: 'var(--bone-muted)',
                      lineHeight: 1.6,
                    }}>
                      {spell.description}
                    </p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
