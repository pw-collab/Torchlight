'use client'

import { ancestries } from '@/data/ancestries/index'

interface Props {
  name: string
  ancestryId: string
  onNameChange: (name: string) => void
  onAncestryChange: (id: string) => void
}

const ANCESTRY_FLAVOR: Record<string, string> = {
  human:      'Ambiciosos e adaptáveis, os humanos prosperam em qualquer domínio das Terras das Névoas.',
  elf:        'Antiquíssimos e distantes, os elfos guardam segredos que antecedem as próprias trevas.',
  dwarf:      'Forjados em cavernas profundas, os anões carregam a pedra no sangue e a teimosia no espírito.',
  halfling:   'Pequenos e sorridentes mesmo diante do horror, os halflings sobrevivem pela sorte e pela astúcia.',
  resurrected:'Mortos que retornam sem memória, os Ressurretos carregam o estigma da morte como uma segunda pele.',
}

export function StepAncestry({ name, ancestryId, onNameChange, onAncestryChange }: Props) {
  const selected = ancestries.find(a => a.id === ancestryId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Name */}
      <div>
        <label style={{
          display: 'block',
          fontFamily: 'var(--font-heading)',
          fontSize: 8,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--candle-amber)',
          marginBottom: 10,
        }}>
          Nome do Personagem
        </label>
        <input
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Como te chamam nas Terras das Névoas?"
          style={{
            width: '100%',
            background: 'rgba(13,10,5,0.8)',
            border: '1px solid rgba(139,112,48,0.3)',
            borderRadius: 2,
            padding: '12px 14px',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            color: 'var(--parchment-pale)',
            outline: 'none',
            letterSpacing: '0.02em',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.6)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,112,48,0.3)' }}
        />
      </div>

      {/* Ancestry grid */}
      <div>
        <label style={{
          display: 'block',
          fontFamily: 'var(--font-heading)',
          fontSize: 8,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--candle-amber)',
          marginBottom: 10,
        }}>
          Ancestralidade
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ancestries.map(a => {
            const active = a.id === ancestryId
            return (
              <button
                key={a.id}
                onClick={() => onAncestryChange(a.id)}
                style={{
                  background: active ? 'rgba(139,112,48,0.14)' : 'rgba(20,14,6,0.5)',
                  border: `1px solid ${active ? 'rgba(196,120,42,0.55)' : 'rgba(139,112,48,0.2)'}`,
                  borderRadius: 2,
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 250ms',
                  boxShadow: active ? '0 0 14px rgba(196,120,42,0.12)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.borderColor = 'rgba(139,112,48,0.4)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.borderColor = 'rgba(139,112,48,0.2)'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 14,
                    color: active ? 'var(--parchment-pale)' : 'var(--parchment-light)',
                    letterSpacing: '0.04em',
                  }}>
                    {a.name}
                  </span>
                  {a.pariahLevel && (
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 7,
                      color: a.pariahLevel === '0/6' ? 'var(--verdigris-light)' : a.pariahLevel === '6/6' ? 'var(--blood-mid)' : 'var(--bone-muted)',
                      letterSpacing: '0.06em',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '2px 5px',
                      borderRadius: 1,
                    }}>
                      PÁRIA {a.pariahLevel}
                    </span>
                  )}
                </div>
                {a.traits.map(t => (
                  <p key={t.name} style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 10,
                    color: 'var(--bone-muted)',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}>
                    <span style={{ color: 'var(--parchment-warm)', fontStyle: 'normal' }}>{t.name}: </span>
                    {t.description}
                  </p>
                ))}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ancestry flavor */}
      {selected && ANCESTRY_FLAVOR[selected.id] && (
        <div style={{
          borderLeft: '2px solid rgba(139,112,48,0.3)',
          paddingLeft: 14,
          marginTop: -8,
        }}>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--bone-muted)',
            lineHeight: 1.6,
          }}>
            {ANCESTRY_FLAVOR[selected.id]}
          </p>
        </div>
      )}
    </div>
  )
}
