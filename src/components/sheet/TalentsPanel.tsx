'use client'

import { useState, useRef, useEffect } from 'react'
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

/** Lines of description shown on the card face before the "…" expander kicks in */
const CLAMP_LINES = 4

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
          onClick={() => formOpen ? closeForm() : setFormOpen(true)}
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
          {formOpen ? '✕ Fechar' : '+ Adicionar'}
        </button>
      </div>

      {formOpen && (
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
            onClick={submitForm}
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
            {editingId ? '✦ Salvar Alterações' : '✦ Registrar Talento'}
          </button>
        </div>
      )}

      {talents.length === 0 && !formOpen ? (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
          Nenhum talento registrado nos arquivos.
        </p>
      ) : (
        <div className="tarot-grid" style={{ alignItems: 'start' }}>
          {talents.map((t, i) => (
            <TalentCard
              key={t.id}
              talent={t}
              index={i}
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

function TalentCard({ talent, index, expanded, onToggle, onRemove, onEdit, onRoll }: {
  talent: Talent
  index: number
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
  onEdit: () => void
  onRoll?: (r: RollResult) => void
}) {
  const accent = ORIGIN_ACCENT[talent.origin]
  const descRef = useRef<HTMLParagraphElement>(null)
  const [showFull, setShowFull] = useState(false)
  const [overflows, setOverflows] = useState(false)

  // Measure only while clamped — once expanded, scrollHeight === clientHeight.
  useEffect(() => {
    if (showFull) return
    const el = descRef.current
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1)
  }, [talent.description, showFull])

  const actionBtn = (kind: 'edit' | 'remove'): React.CSSProperties => ({
    flex: 1,
    fontFamily: 'var(--font-heading)',
    fontSize: 8,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    background: kind === 'edit' ? 'rgba(42,34,16,0.6)' : 'rgba(60,12,12,0.5)',
    border: `1px solid ${kind === 'edit' ? 'rgba(139,112,48,0.45)' : 'rgba(139,21,21,0.5)'}`,
    color: kind === 'edit' ? 'var(--candle-amber)' : 'var(--blood-bright)',
    padding: '7px 0',
    borderRadius: 2,
    cursor: 'pointer',
    transition: 'all 180ms',
  })

  return (
    <TarotCard
      face="cream"
      numeral={roman(index + 1)}
      glyph={ORIGIN_GLYPH[talent.origin]}
      title={talent.name}
      subtitle={ORIGIN_LABEL[talent.origin]}
      accent={accent.color}
      accentSoft={accent.soft}
      expanded={expanded}
      onToggle={onToggle}
      body={
        <div
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default' }}
        >
          <p
            ref={descRef}
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 10.5,
              color: 'rgba(42,30,10,0.78)',
              lineHeight: 1.55,
              margin: 0,
              textAlign: 'center',
              width: '100%',
              ...(showFull ? {} : {
                display: '-webkit-box',
                WebkitLineClamp: CLAMP_LINES,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }),
            }}
          >
            <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
          </p>
          {(overflows || showFull) && (
            <button
              onClick={() => setShowFull(s => !s)}
              title={showFull ? 'Recolher' : 'Mostrar texto completo'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: showFull ? 8 : 13,
                letterSpacing: '0.12em',
                lineHeight: 1,
                color: 'rgba(42,30,10,0.55)',
                padding: '2px 10px',
                transition: 'color 180ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(42,30,10,0.9)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(42,30,10,0.55)')}
            >
              {showFull ? '▴ recolher' : '…'}
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onEdit}
          style={actionBtn('edit')}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,112,48,0.3)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,34,16,0.6)')}
        >
          ✎ Editar
        </button>
        <button
          onClick={onRemove}
          style={actionBtn('remove')}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,21,21,0.35)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(60,12,12,0.5)')}
        >
          ✕ Excluir
        </button>
      </div>
    </TarotCard>
  )
}
