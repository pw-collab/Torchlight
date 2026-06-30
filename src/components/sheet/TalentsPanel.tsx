'use client'

import { useState } from 'react'
import type { Talent, TalentOrigin } from '@/types/talent.types'
import type { RollResult } from '@/lib/dice'
import { RollableText } from '@/components/shared/RollableText'

const ORIGIN_LABEL: Record<TalentOrigin, string> = {
  ancestry: 'Ancestralidade',
  class: 'Classe',
  general: 'Geral',
}

const ORIGIN_ACCENT: Record<TalentOrigin, { color: string; soft: string }> = {
  class:    { color: '#a56fde', soft: 'rgba(165,111,222,0.12)' },
  general:  { color: '#c8b890', soft: 'rgba(200,184,144,0.10)' },
  ancestry: { color: '#4fa98c', soft: 'rgba(79,169,140,0.12)' },
}

const ORIGIN_GLYPH: Record<TalentOrigin, string> = {
  ancestry: '☽',
  class: '☿',
  general: '✦',
}

interface Props {
  talents: Talent[]
  onUpdate: (talents: Talent[]) => void
  onRoll?: (r: RollResult) => void
}

export function TalentsPanel({ talents, onUpdate, onRoll }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', origin: 'general' as TalentOrigin, description: '' })

  function closeForm() {
    setForm({ name: '', origin: 'general', description: '' })
    setEditingId(null)
    setFormOpen(false)
  }

  function submitForm() {
    if (!form.name.trim() || !form.description.trim()) return
    if (editingId) {
      onUpdate(talents.map(t => t.id === editingId
        ? { ...t, name: form.name, origin: form.origin, description: form.description }
        : t,
      ))
    } else {
      onUpdate([...talents, {
        id: Math.random().toString(36).substring(2, 9),
        name: form.name,
        origin: form.origin,
        description: form.description,
      }])
    }
    closeForm()
  }

  function startEdit(t: Talent) {
    setForm({ name: t.name, origin: t.origin, description: t.description })
    setEditingId(t.id)
    setFormOpen(true)
    setExpandedId(null)
  }

  function removeTalent(id: string) {
    if (id === editingId) closeForm()
    if (id === expandedId) setExpandedId(null)
    onUpdate(talents.filter(t => t.id !== id))
  }

  const inp: React.CSSProperties = {
    width: '100%',
    background: '#0a0805',
    border: '1px solid rgba(200,184,144,0.25)',
    color: '#c8b890',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    padding: '8px 10px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div className="worn-border" style={{ padding: 42 }}>
      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 8, borderBottom: '2px solid rgba(200,184,144,0.25)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#ff444c', lineHeight: 1 }}>⪧</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 24, color: '#c8b890', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Talentos &amp; Habilidades
          </span>
        </span>
        <button
          onClick={() => formOpen ? closeForm() : setFormOpen(true)}
          className="tactile"
          style={{
            background: '#0a0805',
            border: '1px solid #c8b890',
            color: '#c8b890',
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            height: 44,
            minHeight: 44,
            padding: '0 19px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#14110a' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0a0805' }}
        >
          {formOpen ? '✕ Fechar' : '+ Adicionar'}
        </button>
      </div>

      {/* Add / edit form */}
      {formOpen && (
        <div
          className="animate-ink-spread"
          style={{
            background: '#0a0805',
            border: '1px solid rgba(200,184,144,0.25)',
            padding: '14px 16px',
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,184,144,0.6)', marginBottom: 4 }}>Nome</div>
              <input type="text" value={form.name} placeholder="ex.: Visão nas Trevas" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inp} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,184,144,0.6)', marginBottom: 4 }}>Origem</div>
              <select value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value as TalentOrigin }))} style={inp}>
                <option value="ancestry">Ancestralidade</option>
                <option value="class">Classe</option>
                <option value="general">Geral</option>
              </select>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(200,184,144,0.6)', marginBottom: 4 }}>Descrição</div>
            <input type="text" value={form.description} placeholder="O que este talento faz?" onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inp} />
          </div>
          <button
            onClick={submitForm}
            disabled={!form.name.trim() || !form.description.trim()}
            className="tactile"
            style={{
              background: '#ff444c',
              border: 'none',
              color: '#0a0805',
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '10px 0',
              cursor: 'pointer',
              opacity: !form.name.trim() || !form.description.trim() ? 0.45 : 1,
            }}
          >
            {editingId ? '✦ Salvar Alterações' : '✦ Registrar Talento'}
          </button>
        </div>
      )}

      {/* List */}
      {talents.length === 0 && !formOpen ? (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'rgba(200,184,144,0.5)', marginTop: 16 }}>
          Nenhum talento registrado nos arquivos.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          {talents.map(t => (
            <TalentRow
              key={t.id}
              talent={t}
              expanded={expandedId === t.id}
              onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              onRemove={() => removeTalent(t.id)}
              onEdit={() => startEdit(t)}
              onRoll={onRoll}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TalentRow({ talent, expanded, onToggle, onRemove, onEdit, onRoll }: {
  talent: Talent
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
  onRoll?: (r: RollResult) => void
}) {
  const accent = ORIGIN_ACCENT[talent.origin].color
  const soft = ORIGIN_ACCENT[talent.origin].soft

  const actionBtn = (kind: 'edit' | 'remove'): React.CSSProperties => ({
    fontFamily: 'var(--font-heading)',
    fontSize: 12,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    background: '#0a0805',
    border: `1px solid ${kind === 'edit' ? 'rgba(200,184,144,0.4)' : 'rgba(255,68,76,0.45)'}`,
    color: kind === 'edit' ? '#c8b890' : '#ff444c',
    padding: '8px 14px',
    cursor: 'pointer',
    transition: 'background 180ms, border-color 180ms',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Row */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="tactile"
        style={{
          background: '#14110a',
          border: `1px solid ${accent}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 6,
          width: '100%',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Icon */}
        <span style={{ background: '#0a0805', border: `1px solid ${accent}`, width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 18, color: '#eee9dd', lineHeight: 1 }}>
          {ORIGIN_GLYPH[talent.origin]}
        </span>

        {/* Name */}
        <span style={{ flex: '1 0 0', minWidth: 0, fontFamily: 'var(--font-heading)', fontSize: 16, color: accent, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {talent.name}
        </span>

        {/* Trailing: category + roll/expand affordance */}
        <span style={{ display: 'flex', alignItems: 'stretch', gap: 8, alignSelf: 'stretch', background: '#18140c', border: '1px solid #0a0805', paddingLeft: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'var(--font-stat)', fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: accent, whiteSpace: 'nowrap' }}>
            {ORIGIN_LABEL[talent.origin]}
          </span>
          <span aria-hidden style={{ background: accent, border: '1px solid #0a0805', alignSelf: 'stretch', aspectRatio: '1 / 1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 16, color: '#0a0805', lineHeight: 1, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 200ms' }}>
            ↝
          </span>
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="animate-ink-spread"
          style={{ background: soft, border: `1px solid ${accent}`, borderTop: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13.5, color: '#d8cdb0', lineHeight: 1.6, margin: 0 }}>
            <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onEdit}
              style={actionBtn('edit')}
              onMouseEnter={e => { e.currentTarget.style.background = '#14110a'; e.currentTarget.style.borderColor = '#c8b890' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0a0805'; e.currentTarget.style.borderColor = 'rgba(200,184,144,0.4)' }}
            >
              ✎ Editar
            </button>
            <button
              onClick={onRemove}
              style={actionBtn('remove')}
              onMouseEnter={e => { e.currentTarget.style.background = '#1a0a0a'; e.currentTarget.style.borderColor = '#ff444c' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#0a0805'; e.currentTarget.style.borderColor = 'rgba(255,68,76,0.45)' }}
            >
              ✕ Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
