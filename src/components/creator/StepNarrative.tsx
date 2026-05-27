'use client'

import { useState } from 'react'

interface BackgroundDetails {
  concept?: string
  origin?: string
  backstory?: string
  traumaticEvents?: string
}

interface Relations {
  family?: string[]
  allies?: string[]
  rivals?: string[]
  faction?: string
}

interface Impulses {
  secrets?: string
  flaws?: string
  fears?: string
  objectives?: string
}

interface Props {
  backgroundDetails: BackgroundDetails
  relations: Relations
  impulses: Impulses
  onBackgroundChange: (patch: BackgroundDetails) => void
  onRelationsChange: (patch: Relations) => void
  onImpulsesChange: (patch: Impulses) => void
}

export function StepNarrative({
  backgroundDetails, relations, impulses,
  onBackgroundChange, onRelationsChange, onImpulsesChange,
}: Props) {
  const [relInput, setRelInput] = useState({ family: '', allies: '', rivals: '' })

  function addRelItem(field: 'family' | 'allies' | 'rivals') {
    const val = relInput[field].trim()
    if (!val) return
    const prev = relations[field] ?? []
    if (prev.includes(val)) return
    onRelationsChange({ ...relations, [field]: [...prev, val] })
    setRelInput(r => ({ ...r, [field]: '' }))
  }

  function removeRelItem(field: 'family' | 'allies' | 'rivals', val: string) {
    onRelationsChange({ ...relations, [field]: (relations[field] ?? []).filter(x => x !== val) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Histórico */}
      <section>
        <div style={sectionLabel}>✎ Histórico</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {(
            [
              { key: 'concept',        label: 'Conceito',           placeholder: 'Em uma frase, quem és tu?' },
              { key: 'origin',         label: 'Origem',             placeholder: 'De onde e como chegaste aqui?' },
              { key: 'backstory',      label: 'Passado',            placeholder: 'O que moldou o personagem antes da aventura...' },
              { key: 'traumaticEvents',label: 'Eventos Traumáticos', placeholder: 'Cicatrizes que o tempo não apagou...' },
            ] as { key: keyof BackgroundDetails; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={fieldLabel}>{label}</label>
              <textarea
                defaultValue={backgroundDetails[key] ?? ''}
                onBlur={e => onBackgroundChange({ ...backgroundDetails, [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                style={textareaStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.5)' }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Relações */}
      <section>
        <div style={sectionLabel}>◈ Relações</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          {(
            [
              { key: 'family', label: 'Família' },
              { key: 'allies', label: 'Aliados' },
              { key: 'rivals', label: 'Rivais' },
            ] as { key: 'family' | 'allies' | 'rivals'; label: string }[]
          ).map(({ key, label }) => (
            <div key={key}>
              <label style={fieldLabel}>{label}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 5, marginTop: 5 }}>
                {(relations[key] ?? []).map(v => (
                  <button
                    key={v}
                    onClick={() => removeRelItem(key, v)}
                    style={relChip}
                  >
                    {v} ×
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={relInput[key]}
                  onChange={e => setRelInput(r => ({ ...r, [key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addRelItem(key)}
                  placeholder={`Nome de ${label.toLowerCase()}...`}
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.5)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(139,112,48,0.25)' }}
                />
                <button onClick={() => addRelItem(key)} style={addBtn}>+ Add</button>
              </div>
            </div>
          ))}

          <div>
            <label style={fieldLabel}>Facção</label>
            <input
              type="text"
              defaultValue={relations.faction ?? ''}
              onBlur={e => onRelationsChange({ ...relations, faction: e.target.value })}
              placeholder="Guilda, culto, ordem ou grupo..."
              style={{ ...inputStyle, marginTop: 5 }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.5)' }}
            />
          </div>
        </div>
      </section>

      {/* Impulsos */}
      <section>
        <div style={sectionLabel}>⚡ Impulsos</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {(
            [
              { key: 'secrets',    label: 'Segredos',   placeholder: 'O que ninguém pode saber...' },
              { key: 'flaws',      label: 'Falhas',     placeholder: 'Os vícios e fraquezas que te definem...' },
              { key: 'fears',      label: 'Medos',      placeholder: 'O que te paralisa no escuro...' },
              { key: 'objectives', label: 'Objetivos',  placeholder: 'O que te faz continuar andando...' },
            ] as { key: keyof Impulses; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={fieldLabel}>{label}</label>
              <textarea
                defaultValue={impulses[key] ?? ''}
                onBlur={e => onImpulsesChange({ ...impulses, [key]: e.target.value })}
                placeholder={placeholder}
                rows={3}
                style={textareaStyle}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(196,120,42,0.5)' }}
              />
            </div>
          ))}
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
  marginBottom: 2,
}

const fieldLabel: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 7,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--bone-muted)',
  display: 'block',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(13,10,5,0.7)',
  border: '1px solid rgba(139,112,48,0.22)',
  borderRadius: 2,
  padding: '9px 11px',
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 11,
  color: 'var(--parchment-pale)',
  resize: 'vertical',
  outline: 'none',
  lineHeight: 1.5,
  transition: 'border-color 200ms',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'rgba(13,10,5,0.7)',
  border: '1px solid rgba(139,112,48,0.25)',
  borderRadius: 2,
  padding: '7px 10px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--parchment-pale)',
  outline: 'none',
  transition: 'border-color 200ms',
  width: '100%',
}

const addBtn: React.CSSProperties = {
  background: 'rgba(139,112,48,0.12)',
  border: '1px solid rgba(139,112,48,0.28)',
  borderRadius: 2,
  padding: '7px 12px',
  fontFamily: 'var(--font-heading)',
  fontSize: 8,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--parchment-light)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const relChip: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--parchment-light)',
  background: 'rgba(20,14,6,0.6)',
  border: '1px solid rgba(139,112,48,0.3)',
  borderRadius: 10,
  padding: '3px 10px',
  cursor: 'pointer',
  transition: 'all 150ms',
}
