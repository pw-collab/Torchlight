'use client'

import { useState } from 'react'
import type { Talent, TalentOrigin } from '@/types/talent.types'

const ORIGIN_LABEL: Record<TalentOrigin, string> = {
  ancestry: 'Ancestralidade',
  class: 'Classe',
  general: 'Geral',
}

const ORIGIN_COLOR: Record<TalentOrigin, string> = {
  ancestry: 'var(--verdigris-light)',
  class: 'var(--candle-amber)',
  general: 'var(--bone-muted)',
}

interface Props {
  talents: Talent[]
  onUpdate: (talents: Talent[]) => void
}

export function TalentsPanel({ talents, onUpdate }: Props) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', origin: 'general' as TalentOrigin, description: '' })

  function addTalent() {
    if (!form.name.trim() || !form.description.trim()) return
    const talent: Talent = {
      id: Math.random().toString(36).substring(2, 9),
      name: form.name,
      origin: form.origin,
      description: form.description,
    }
    onUpdate([...talents, talent])
    setForm({ name: '', origin: 'general', description: '' })
    setAdding(false)
  }

  function removeTalent(id: string) {
    onUpdate(talents.filter(t => t.id !== id))
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'var(--ink-deep)',
    border: '1px solid rgba(139,112,48,0.28)',
    color: 'var(--parchment-light)',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    padding: '5px 7px',
    outline: 'none',
    borderRadius: 1,
    boxSizing: 'border-box',
  }

  return (
    <div
      className="worn-border"
      style={{
        background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
        border: '1px solid rgba(139,112,48,0.33)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
        padding: '14px 15px',
        borderRadius: 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
          Talentos & Habilidades
        </span>
        <button
          onClick={() => setAdding(a => !a)}
          style={{
            background: 'rgba(42,34,16,0.5)',
            border: '1px solid rgba(139,112,48,0.3)',
            color: 'var(--parchment-light)',
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 10,
            padding: '4px 10px',
            cursor: 'pointer',
            borderRadius: 1,
          }}
        >
          {adding ? '✕ Fechar' : '+ Adicionar'}
        </button>
      </div>

      {adding && (
        <div
          className="worn-border animate-ink-spread"
          style={{
            background: 'rgba(42,34,16,0.4)',
            border: '1px solid rgba(139,112,48,0.28)',
            padding: '12px 14px',
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: 'var(--bone-muted)', marginBottom: 3 }}>Nome</div>
              <input type="text" value={form.name} placeholder="ex.: Visão nas Trevas" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: 'var(--bone-muted)', marginBottom: 3 }}>Origem</div>
              <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value as TalentOrigin }))} style={inp}>
                <option value="ancestry">Ancestralidade</option>
                <option value="class">Classe</option>
                <option value="general">Geral</option>
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: 'var(--bone-muted)', marginBottom: 3 }}>Descrição</div>
            <input type="text" value={form.description} placeholder="O que este talento faz?" onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />
          </div>
          <button
            onClick={addTalent}
            disabled={!form.name.trim() || !form.description.trim()}
            style={{
              background: 'var(--blood-mid)',
              border: '1px solid var(--blood-bright)',
              color: 'var(--bone-white)',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 11,
              padding: '7px 0',
              cursor: 'pointer',
              borderRadius: 1,
              opacity: !form.name.trim() || !form.description.trim() ? 0.45 : 1,
            }}
          >
            ✦ Registrar Talento
          </button>
        </div>
      )}

      {talents.length === 0 && !adding ? (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
          Nenhum talento registrado nos anais.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {talents.map((t, i) => (
            <TalentRow
              key={t.id}
              talent={t}
              last={i === talents.length - 1}
              onRemove={() => removeTalent(t.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function TalentRow({ talent, last, onRemove }: { talent: Talent; last: boolean; onRemove: () => void }) {
  const [hov, setHov] = useState(false)
  const [expanded, setExpanded] = useState(false)

  return (
    <li
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '8px 0',
        borderBottom: last ? 'none' : '1px solid rgba(139,112,48,0.1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 7.5,
          color: ORIGIN_COLOR[talent.origin],
          background: `${ORIGIN_COLOR[talent.origin]}18`,
          border: `1px solid ${ORIGIN_COLOR[talent.origin]}40`,
          padding: '1px 5px',
          borderRadius: 1,
          flexShrink: 0,
        }}>
          {ORIGIN_LABEL[talent.origin]}
        </span>

        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--parchment-light)',
            textAlign: 'left', flex: 1, padding: 0,
          }}
        >
          {talent.name}
        </button>

        {hov && (
          <button
            onClick={onRemove}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--blood-mid)', fontSize: 10, padding: 2,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {expanded && (
        <p style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--bone-muted)',
          lineHeight: 1.6,
          marginTop: 4,
          paddingLeft: 12,
          animation: 'inkSpread 200ms cubic-bezier(0.4,0,0.2,1) both',
        }}>
          {talent.description}
        </p>
      )}
    </li>
  )
}
