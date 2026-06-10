'use client'

import { useState } from 'react'
import type { Talent, TalentOrigin } from '@/types/talent.types'
import type { RollResult } from '@/lib/dice'
import { RollableText } from '@/components/shared/RollableText'
import { TarotCard, roman } from '@/components/shared/TarotCard'
import { OrnateTitle } from '@/components/shared/OrnateTitle'

const ORIGIN_LABEL: Record<TalentOrigin, string> = {
  ancestry: 'Ancestralidade',
  class: 'Classe',
  general: 'Geral',
}

const ORIGIN_ACCENT: Record<TalentOrigin, { color: string; soft: string }> = {
  ancestry: { color: 'var(--verdigris-light)', soft: 'rgba(61,112,96,0.4)' },
  class:    { color: 'var(--candle-amber)',    soft: 'rgba(196,120,42,0.35)' },
  general:  { color: 'var(--bone-muted)',      soft: 'rgba(139,112,48,0.35)' },
}

const ORIGIN_GLYPH: Record<TalentOrigin, string> = {
  ancestry: '⚘',
  class: '⚔',
  general: '✦',
}

interface Props {
  talents: Talent[]
  onUpdate: (talents: Talent[]) => void
  onRoll?: (r: RollResult) => void
}

export function TalentsPanel({ talents, onUpdate, onRoll }: Props) {
  const [adding, setAdding] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
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
    fontSize: 12,
    padding: '6px 8px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div
      className="worn-border"
      style={{
        border: '1px solid rgba(139,112,48,0.33)',
        padding: '40px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
        <OrnateTitle fontSize={11}>Talentos & Habilidades</OrnateTitle>
        <button
          onClick={() => setAdding(a => !a)}
          style={{
            background: 'rgba(42,34,16,0.5)',
            border: '1px solid rgba(139,112,48,0.3)',
            color: 'var(--parchment-light)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            padding: '6px 12px',
            cursor: 'pointer',
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
              fontSize: 12,
              padding: '7px 0',
              cursor: 'pointer',
              opacity: !form.name.trim() || !form.description.trim() ? 0.45 : 1,
            }}
          >
            ✦ Registrar Talento
          </button>
        </div>
      )}

      {talents.length === 0 && !adding ? (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
          Nenhum talento registrado nos arquivos.
        </p>
      ) : (
        <div className="tarot-grid">
          {talents.map((t, i) => (
            <TalentCard
              key={t.id}
              talent={t}
              index={i}
              expanded={expandedId === t.id}
              onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onRemove={() => removeTalent(t.id)}
              onRoll={onRoll}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TalentCard({ talent, index, expanded, onToggle, onRemove, onRoll }: {
  talent: Talent
  index: number
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onRoll?: (r: RollResult) => void
}) {
  const accent = ORIGIN_ACCENT[talent.origin]

  return (
    <TarotCard
      numeral={roman(index + 1)}
      glyph={ORIGIN_GLYPH[talent.origin]}
      title={talent.name}
      subtitle={ORIGIN_LABEL[talent.origin]}
      accent={accent.color}
      accentSoft={accent.soft}
      expanded={expanded}
      onToggle={onToggle}
      corner={
        <button
          onClick={onRemove}
          title="Remover talento"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(139,21,21,0.5)', fontSize: 10, padding: 2, lineHeight: 1,
            transition: 'color 180ms',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--blood-bright)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,21,21,0.5)')}
        >
          ✕
        </button>
      }
    >
      <p style={{
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 11,
        color: 'var(--bone-muted)',
        lineHeight: 1.6,
        margin: 0,
      }}>
        <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
      </p>
    </TarotCard>
  )
}
