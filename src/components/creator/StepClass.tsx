'use client'

import { useState } from 'react'
import { classes } from '@/data/classes/index'
import type { ClassTechnique } from '@/types/class.types'

interface Props {
  classId: string
  onChange: (id: string) => void
}

const CLASS_FLAVOR: Record<string, string> = {
  warrior:    'Aço e determinação — o guerreiro dobra o mundo pela força.',
  thief:      'Nas sombras, nas frestas — o ladino toma o que os outros negligenciam.',
  wizard:     'O grimório guarda segredos que podem custar a sanidade.',
  priest:     'A divindade fala; o sacerdote obedece — e às vezes questiona.',
  ranger:     'A floresta sussurra; o patrulheiro é o único que escuta.',
  bard:       'Canções que encantam, palavras que ferem — a arte como arma.',
  monk:       'O corpo é o templo; a mente, o sacerdote.',
  paladin:    'A fé forjada em lâmina. A misericórdia é escolha; a justiça, dever.',
  psionicist: 'A mente tocada pelo além — poder sem feitiços, sanidade sem certeza.',
}

const TECH_KIND_LABEL: Record<string, string> = {
  passive:     'Passivo',
  choice:      'Escolha',
  limited_use: 'Usos/Dia',
  spell_like:  'Ativação',
}

export function StepClass({ classId, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(classId)

  function handleSelect(id: string) {
    onChange(id)
    setExpanded(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {classes.map(c => {
        const active = c.id === classId
        const open = expanded === c.id
        const techniques = (c.techniques ?? []).filter((t): t is ClassTechnique => t !== null)

        return (
          <div
            key={c.id}
            style={{
              background: active ? 'rgba(139,112,48,0.1)' : 'rgba(20,14,6,0.5)',
              border: `1px solid ${active ? 'rgba(196,120,42,0.5)' : 'rgba(139,112,48,0.18)'}`,
              borderRadius: 2,
              overflow: 'hidden',
              transition: 'border-color 250ms',
            }}
          >
            {/* Class header row */}
            <button
              onClick={() => handleSelect(c.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: active ? 'var(--candle-amber)' : 'rgba(139,112,48,0.2)',
                    border: `1px solid ${active ? 'var(--candle-amber)' : 'rgba(139,112,48,0.3)'}`,
                    flexShrink: 0,
                    transition: 'all 200ms',
                    boxShadow: active ? 'var(--glow-candle)' : 'none',
                  }}
                />
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 15,
                  color: active ? 'var(--parchment-pale)' : 'var(--parchment-light)',
                  letterSpacing: '0.04em',
                  textAlign: 'left',
                }}>
                  {c.name}
                </span>
                {c.spellcasting && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 7,
                    color: 'var(--mist-bright)',
                    letterSpacing: '0.08em',
                    background: 'rgba(74,48,104,0.3)',
                    border: '1px solid rgba(107,78,138,0.3)',
                    padding: '1px 5px',
                    borderRadius: 1,
                    flexShrink: 0,
                  }}>
                    ARCANO
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: 'var(--bone-muted)',
                  letterSpacing: '0.06em',
                }}>
                  d{c.hitDie} HD
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--bone-muted)',
                  lineHeight: 1,
                }}>
                  {open ? '▲' : '▼'}
                </span>
              </div>
            </button>

            {/* Expanded detail */}
            {open && (
              <div style={{
                borderTop: '1px solid rgba(139,112,48,0.15)',
                padding: '12px 16px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                {CLASS_FLAVOR[c.id] && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 11,
                    color: 'var(--bone-muted)',
                    lineHeight: 1.6,
                    borderLeft: '2px solid rgba(139,112,48,0.25)',
                    paddingLeft: 10,
                  }}>
                    {CLASS_FLAVOR[c.id]}
                  </p>
                )}

                {/* Proficiencies */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={chipStyle}>{c.armorProficiency}</span>
                  <span style={chipStyle}>{c.weaponProficiency}</span>
                </div>

                {/* Techniques */}
                {techniques.length > 0 && (
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 7,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: 'var(--candle-amber)',
                      marginBottom: 6,
                      opacity: 0.7,
                    }}>
                      Técnicas
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {techniques.map(t => (
                        <div key={t.id} style={{
                          display: 'flex',
                          gap: 8,
                          alignItems: 'flex-start',
                          padding: '6px 10px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: 1,
                        }}>
                          <span style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 7,
                            color: 'var(--gold-oxidized)',
                            letterSpacing: '0.06em',
                            background: 'rgba(139,112,48,0.12)',
                            padding: '2px 5px',
                            borderRadius: 1,
                            flexShrink: 0,
                            marginTop: 1,
                          }}>
                            {TECH_KIND_LABEL[t.kind ?? 'passive']}
                          </span>
                          <div>
                            <span style={{
                              fontFamily: 'var(--font-heading)',
                              fontSize: 11,
                              color: 'var(--parchment-light)',
                              letterSpacing: '0.03em',
                            }}>
                              {t.name}
                            </span>
                            {t.spellLike && (
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 7,
                                color: 'var(--mist-bright)',
                                marginLeft: 6,
                              }}>
                                {t.spellLike.abilities.length} habilidades
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const chipStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 10,
  color: 'var(--bone-muted)',
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(139,112,48,0.15)',
  borderRadius: 1,
  padding: '2px 8px',
}
