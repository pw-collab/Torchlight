'use client'

import { useState } from 'react'
import type { Class } from '@/types/class.types'
import { rollClassTalent } from '@/data/classes/index'

// ─── Style helpers ────────────────────────────────────────────────────────────

function panelStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background:
      'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
    border: '1px solid rgba(139,112,48,0.33)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
    borderRadius: 1,
    ...extra,
  }
}

function sectionLabel(text: string, icon?: string): React.ReactNode {
  return (
    <div
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 8.5,
        letterSpacing: '0.2em',
        textTransform: 'uppercase' as const,
        color: 'var(--bone-muted)',
        marginBottom: 10,
        paddingBottom: 7,
        borderBottom: '1px solid rgba(139,112,48,0.18)',
      }}
    >
      {icon} {text}
    </div>
  )
}

// ─── Technique Card ───────────────────────────────────────────────────────────

function TechniqueCard({
  name,
  description,
}: {
  name: string
  description: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="worn-border"
      style={{
        background: 'rgba(42,34,16,0.35)',
        border: '1px solid rgba(139,112,48,0.22)',
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '7px 10px',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 10,
            letterSpacing: '0.06em',
            color: 'var(--candle-amber)',
            flex: 1,
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: 'var(--bone-muted)',
            flexShrink: 0,
          }}
        >
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          style={{
            padding: '0 10px 9px',
            borderTop: '1px solid rgba(139,112,48,0.12)',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 11,
              color: 'var(--bone-muted)',
              lineHeight: 1.6,
              marginTop: 7,
            }}
          >
            {description}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Talent Table ─────────────────────────────────────────────────────────────

function TalentTable({
  classData,
}: {
  classData: Class
}) {
  const [result, setResult] = useState<{
    roll: number
    die1: number
    die2: number
    effect: string
  } | null>(null)
  const [open, setOpen] = useState(false)

  function handleRoll() {
    const r = rollClassTalent(classData.id)
    if (r) setResult({ roll: r.roll, die1: r.die1, die2: r.die2, effect: r.entry.effect })
  }

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          paddingBottom: 7,
          borderBottom: '1px solid rgba(139,112,48,0.18)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 8.5,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-muted)',
          }}
        >
          ✦ Tabela de Talentos
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: 7,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--bone-muted)',
              padding: 0,
            }}
          >
            {open ? '▲ ocultar' : '▼ ver tabela'}
          </button>
          <button
            onClick={handleRoll}
            style={{
              background: 'rgba(106,58,10,0.3)',
              border: '1px solid #6B3A0A',
              color: 'var(--bone-white)',
              fontFamily: 'var(--font-heading)',
              fontSize: 7.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '3px 9px',
              cursor: 'pointer',
              borderRadius: 1,
              transition: 'all 220ms',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(106,58,10,0.55)')
            }
            onMouseLeave={e =>
              ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(106,58,10,0.3)')
            }
          >
            ✦ Rolar 2d6
          </button>
        </div>
      </div>

      {/* Roll result */}
      {result && (
        <div
          className="worn-border animate-ink-spread"
          style={{
            background: 'rgba(106,58,10,0.18)',
            border: '1px solid rgba(139,112,48,0.4)',
            padding: '8px 12px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--candle-amber)',
                lineHeight: 1,
              }}
            >
              {result.roll}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 7.5,
                color: 'var(--bone-muted)',
                marginTop: 1,
              }}
            >
              ({result.die1}+{result.die2})
            </div>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 11,
              color: 'var(--parchment-light)',
              lineHeight: 1.5,
              flex: 1,
              marginTop: 2,
            }}
          >
            {result.effect}
          </p>
        </div>
      )}

      {/* Full table (expandable) */}
      {open && (
        <div
          className="animate-ink-spread"
          style={{
            border: '1px solid rgba(139,112,48,0.2)',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          {/* Table header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr',
              background: 'rgba(42,34,16,0.6)',
              borderBottom: '1px solid rgba(139,112,48,0.22)',
            }}
          >
            {['2D6', 'Efeito'].map((h, i) => (
              <div
                key={h}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 7,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--bone-muted)',
                  padding: '5px 10px',
                  borderRight: i === 0 ? '1px solid rgba(139,112,48,0.18)' : 'none',
                }}
              >
                {h}
              </div>
            ))}
          </div>
          {/* Rows */}
          {classData.talentTable.map((entry, i) => {
            const isHighlighted =
              result !== null && result.roll >= entry.min && result.roll <= entry.max
            return (
              <div
                key={entry.roll}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '48px 1fr',
                  background: isHighlighted
                    ? 'rgba(106,58,10,0.25)'
                    : i % 2 === 0
                    ? 'rgba(42,34,16,0.2)'
                    : 'rgba(42,34,16,0.08)',
                  borderBottom:
                    i < classData.talentTable.length - 1
                      ? '1px solid rgba(139,112,48,0.1)'
                      : 'none',
                  transition: 'background 200ms',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: isHighlighted ? 'var(--candle-amber)' : 'var(--bone-muted)',
                    padding: '7px 10px',
                    borderRight: '1px solid rgba(139,112,48,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {entry.roll}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 10.5,
                    color: isHighlighted ? 'var(--parchment-light)' : 'var(--bone-muted)',
                    padding: '7px 10px',
                    lineHeight: 1.4,
                  }}
                >
                  {entry.effect}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  classData: Class
}

export function ClassPanel({ classData }: Props) {
  const activeTechniques = classData.techniques.filter(
    (t): t is NonNullable<typeof t> => t !== null,
  )

  return (
    <div className="worn-border" style={panelStyle({ padding: '14px 15px' })}>
      {/* Header: class name + hit die */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingBottom: 7,
          borderBottom: '1px solid rgba(139,112,48,0.18)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 8.5,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--bone-muted)',
          }}
        >
          ⚔ Classe
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            color: 'var(--bone-muted)',
          }}
        >
          Dado de Vida: d{classData.hitDie}
        </span>
      </div>

      {/* Proficiencies */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          marginBottom: 12,
        }}
      >
        {[
          { label: '⚔ Armas', value: classData.weaponProficiency },
          { label: '🛡 Armaduras', value: classData.armorProficiency },
        ].map(({ label, value }) => (
          <div key={label}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 7,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--bone-muted)',
                marginBottom: 3,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 10.5,
                color: 'var(--parchment-warm)',
                lineHeight: 1.4,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Techniques */}
      {activeTechniques.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {sectionLabel('Técnicas', '✦')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {activeTechniques.map(t => (
              <TechniqueCard key={t.name} name={t.name} description={t.description} />
            ))}
          </div>
        </div>
      )}

      {/* Talent Table */}
      <TalentTable classData={classData} />
    </div>
  )
}
