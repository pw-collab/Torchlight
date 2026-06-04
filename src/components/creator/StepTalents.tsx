'use client'

import { useState } from 'react'
import type { Talent } from '@/types/talent.types'
import { rollClassTalent, getClass } from '@/data/classes/index'

interface Props {
  classId: string
  talents: Talent[]
  onChange: (talents: Talent[]) => void
}

export function StepTalents({ classId, talents, onChange }: Props) {
  const classData = getClass(classId)
  const [lastRoll, setLastRoll] = useState<{ roll: number; die1: number; die2: number; effect: string } | null>(null)
  const [tableOpen, setTableOpen] = useState(false)

  const classTalents = talents.filter(t => t.origin === 'class')

  function rollAndAdd() {
    if (!classData) return
    const r = rollClassTalent(classData.id)
    if (!r) return
    setLastRoll({ roll: r.roll, die1: r.die1, die2: r.die2, effect: r.entry.effect })
    const newTalent: Talent = {
      id: Math.random().toString(36).substring(2, 9),
      name: r.entry.effect,
      origin: 'class',
      description: `Talento de classe — 2d6: ${r.roll} (${r.die1}+${r.die2}) — ${classData.name}`,
    }
    onChange([...talents, newTalent])
  }

  function remove(id: string) {
    onChange(talents.filter(t => t.id !== id))
  }

  if (!classData) {
    return (
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--bone-muted)' }}>
        Classe não encontrada.
      </p>
    )
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.1em',
    textTransform: 'uppercase', padding: '5px 12px', cursor: 'pointer',
    borderRadius: 1, transition: 'all 220ms', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Roll controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button
          onClick={() => setTableOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', ...btnBase, color: 'var(--bone-muted)', padding: 0, letterSpacing: '0.12em' }}
        >
          {tableOpen ? '▲ ocultar tabela' : '▼ ver tabela de talentos'}
        </button>
        <button
          onClick={rollAndAdd}
          style={{ ...btnBase, background: 'rgba(106,58,10,0.3)', border: '1px solid #6B3A0A', color: 'var(--bone-white)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(106,58,10,0.55)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(106,58,10,0.3)')}
        >
          ✦ Rolar 2d6 — {classData.name}
        </button>
      </div>

      {/* Talent table */}
      {tableOpen && (
        <div className="animate-ink-spread" style={{ border: '1px solid rgba(139,112,48,0.2)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: 'rgba(42,34,16,0.7)', borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
            {['2D6', 'Efeito'].map((h, i) => (
              <div key={h} style={{
                fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--bone-muted)', padding: '5px 10px',
                borderRight: i === 0 ? '1px solid rgba(139,112,48,0.18)' : 'none',
              }}>
                {h}
              </div>
            ))}
          </div>
          {classData.talentTable.map((entry, i) => {
            const isLast = lastRoll !== null && lastRoll.roll >= entry.min && lastRoll.roll <= entry.max
            return (
              <div key={entry.roll} style={{
                display: 'grid', gridTemplateColumns: '48px 1fr',
                background: isLast ? 'rgba(106,58,10,0.28)' : i % 2 === 0 ? 'rgba(42,34,16,0.22)' : 'rgba(42,34,16,0.08)',
                borderBottom: i < classData.talentTable.length - 1 ? '1px solid rgba(139,112,48,0.1)' : 'none',
                transition: 'background 200ms',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  color: isLast ? 'var(--candle-amber)' : 'var(--bone-muted)',
                  padding: '6px 10px', borderRight: '1px solid rgba(139,112,48,0.18)',
                  display: 'flex', alignItems: 'center',
                }}>
                  {entry.roll}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5,
                  color: isLast ? 'var(--parchment-light)' : 'var(--bone-muted)',
                  padding: '6px 10px', lineHeight: 1.4,
                }}>
                  {entry.effect}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Last roll result */}
      {lastRoll && (
        <div className="worn-border animate-ink-spread" style={{
          background: 'rgba(106,58,10,0.15)', border: '1px solid rgba(139,112,48,0.35)',
          padding: '8px 12px', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--candle-amber)', lineHeight: 1 }}>
              {lastRoll.roll}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--bone-muted)', marginTop: 1 }}>
              ({lastRoll.die1}+{lastRoll.die2})
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--parchment-light)', lineHeight: 1.5, marginTop: 2 }}>
              {lastRoll.effect}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--verdigris-light)', marginTop: 4 }}>
              ✦ Adicionado aos talentos de classe
            </p>
          </div>
        </div>
      )}

      {/* Acquired talents */}
      <div>
        <div style={{
          fontFamily: 'var(--font-heading)', fontSize: 7.5, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 8,
        }}>
          Talentos de classe adquiridos ({classTalents.length})
        </div>

        {classTalents.length === 0 ? (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)' }}>
            Nenhum talento de classe ainda. Use "Rolar 2d6" em cada nível ímpar.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {classTalents.map(talent => (
              <div key={talent.id} className="worn-border" style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'rgba(42,34,16,0.35)', border: '1px solid rgba(139,112,48,0.2)',
                padding: '7px 10px', borderRadius: 1,
              }}>
                <span style={{
                  fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--candle-amber)', background: 'rgba(196,120,42,0.12)',
                  border: '1px solid rgba(196,120,42,0.25)', padding: '1px 5px', borderRadius: 1, flexShrink: 0, marginTop: 1,
                }}>
                  Classe
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, color: 'var(--parchment-light)', lineHeight: 1.3 }}>
                    {talent.name}
                  </div>
                  {talent.description && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(139,112,48,0.5)', marginTop: 2 }}>
                      {talent.description}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(talent.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(139,21,21,0.45)', fontSize: 11, padding: '0 2px', lineHeight: 1,
                    transition: 'color 180ms', flexShrink: 0,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--blood-bright)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,21,21,0.45)')}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
