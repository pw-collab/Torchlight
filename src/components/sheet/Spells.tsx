'use client'

import { useState } from 'react'
import { getSpell, getSpellsForClass } from '@/data/spells/index'
import type { Spell } from '@/data/spells/index'
import { rollDie, modifier } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { NumInput } from '@/components/sheet/NumInput'

const TIER_LABEL = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']

const STAT_OPTIONS = [
  { value: 'str', label: 'FOR — Força' },
  { value: 'dex', label: 'DES — Destreza' },
  { value: 'con', label: 'CON — Constituição' },
  { value: 'int', label: 'INT — Inteligência' },
  { value: 'wis', label: 'SAB — Sabedoria' },
  { value: 'cha', label: 'CAR — Carisma' },
]

// ─── Spell Picker Modal ───────────────────────────────────────────────────────

function SpellPickerModal({ available, learned, onLearn, onClose }: {
  available: Spell[]
  learned: string[]
  onLearn: (id: string) => void
  onClose: () => void
}) {
  const [query, setQuery]           = useState('')
  const [tierFilter, setTierFilter] = useState<number | null>(null)

  const tiers = [...new Set(available.map(s => s.tier))].sort((a, b) => a - b)

  const q = query.toLowerCase().trim()
  const filtered = available
    .filter(s => !learned.includes(s.id))
    .filter(s => tierFilter === null || s.tier === tierFilter)
    .filter(s => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))

  const tabBtn = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    fontWeight: 700,
    padding: '3px 9px',
    borderRadius: 2,
    cursor: 'pointer',
    border: `1px solid ${active ? 'rgba(107,78,138,0.6)' : 'rgba(107,78,138,0.2)'}`,
    background: active ? 'rgba(107,78,138,0.3)' : 'rgba(42,26,58,0.4)',
    color: active ? 'var(--parchment-light)' : 'rgba(139,110,170,0.7)',
    transition: 'all 180ms',
    flexShrink: 0,
  })

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="worn-border"
        style={{
          background: 'linear-gradient(148deg, rgba(42,26,58,.3) 0%, rgba(14,10,3,.97) 100%), #1E1228',
          border: '1px solid rgba(107,78,138,0.45)',
          borderTop: '2px solid rgba(107,78,138,0.7)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.85)',
          padding: '18px 20px',
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          gap: 10,
        }}
      >
        {/* Header */}
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B6AAA' }}>
          ☽ Aprender Magia
        </div>

        {/* Search */}
        <input
          autoFocus
          type="text"
          placeholder="Buscar por nome ou descrição..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(14,10,3,0.8)',
            border: '1px solid rgba(107,78,138,0.35)',
            color: 'var(--parchment-light)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            padding: '6px 9px',
            outline: 'none',
            borderRadius: 2,
            boxSizing: 'border-box',
          }}
        />

        {/* Tier filter pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button onClick={() => setTierFilter(null)} style={tabBtn(tierFilter === null)}>
            Todas
          </button>
          {tiers.map(t => (
            <button key={t} onClick={() => setTierFilter(tierFilter === t ? null : t)} style={tabBtn(tierFilter === t)}>
              {TIER_LABEL[t - 1] ?? t}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(107,78,138,0.6)', marginTop: -4 }}>
          {filtered.length} magia{filtered.length !== 1 ? 's' : ''} disponíve{filtered.length !== 1 ? 'is' : 'l'}
        </div>

        {/* Spell list */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {filtered.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'rgba(107,78,138,0.5)', padding: '8px 0' }}>
              Nenhuma magia encontrada.
            </p>
          )}
          {filtered.map(spell => (
            <button
              key={spell.id}
              onClick={() => { onLearn(spell.id); onClose() }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                background: 'rgba(42,26,58,0.25)',
                border: '1px solid rgba(107,78,138,0.18)',
                borderRadius: 2,
                padding: '8px 10px',
                cursor: 'pointer',
                transition: 'all 160ms',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,78,138,0.22)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(107,78,138,0.45)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,26,58,0.25)'
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(107,78,138,0.18)'
              }}
            >
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
                marginTop: 1,
              }}>
                {TIER_LABEL[spell.tier - 1] ?? spell.tier}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: '#8B6AAA', letterSpacing: '0.03em', marginBottom: 2 }}>
                  {spell.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(107,78,138,0.55)' }}>
                  {spell.school && `${spell.school} · `}DC {10 + spell.tier}
                  {spell.range && ` · ${spell.range}`}
                  {spell.duration && ` · ${spell.duration}`}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 8,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: 'rgba(42,26,58,0.4)',
            border: '1px solid rgba(107,78,138,0.25)',
            color: 'rgba(139,110,170,0.7)',
            padding: '7px 0',
            borderRadius: 2,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  classId: string
  equippedSpells: string[]
  spellcastingBonus?: number
  castingAttr?: string
  stats?: Record<string, number>
  onUpdate?: (patch: { spellcastingBonus?: number; castingAttr?: string }) => void
  onRoll?: (result: RollResult) => void
  onSpellsChange?: (spells: string[]) => void
}

export function Spells({
  classId, equippedSpells,
  spellcastingBonus = 0, castingAttr = 'int',
  stats, onUpdate, onRoll, onSpellsChange,
}: Props) {
  const available  = getSpellsForClass(classId)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  if (available.length === 0) return null

  function learnSpell(id: string) {
    if (!onSpellsChange || equippedSpells.includes(id)) return
    onSpellsChange([...equippedSpells, id])
  }

  function forgetSpell(id: string) {
    if (!onSpellsChange) return
    onSpellsChange(equippedSpells.filter(s => s !== id))
  }

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
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(107,78,138,0.2)', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B4E8A', flex: 1 }}>
          ☽ Magias
        </span>

        {/* Learn button */}
        {onSpellsChange && (
          <button
            onClick={() => setShowPicker(true)}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 7.5,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'rgba(42,26,58,0.5)',
              border: '1px solid rgba(107,78,138,0.4)',
              color: '#8B6AAA',
              padding: '4px 10px',
              borderRadius: 2,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 200ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,78,138,0.25)'
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--parchment-light)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,26,58,0.5)'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#8B6AAA'
            }}
          >
            + Aprender
          </button>
        )}

        {/* Casting controls */}
        {onUpdate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(107,78,138,0.7)', whiteSpace: 'nowrap' }}>
              Bônus
            </span>
            <NumInput
              value={spellcastingBonus}
              onCommit={n => onUpdate?.({ spellcastingBonus: n })}
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

      {/* ── Spell list ── */}
      {equippedSpells.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
          Nenhuma magia aprendida.{onSpellsChange ? ' Use "+ Aprender" para adicionar.' : ''}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {equippedSpells.map(id => {
            const spell  = getSpell(id) ?? available.find(s => s.id === id)
            const isOpen = expanded === id

            return (
              <div
                key={id}
                className="worn-border"
                style={{
                  background: 'rgba(42,26,58,0.2)',
                  border: '1px solid rgba(107,78,138,0.25)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Card header */}
                <div
                  onClick={() => spell && setExpanded(isOpen ? null : id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: spell ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  {spell && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700,
                      color: '#6B4E8A', background: 'rgba(107,78,138,0.15)',
                      border: '1px solid rgba(107,78,138,0.3)', padding: '1px 5px',
                      borderRadius: 1, flexShrink: 0,
                    }}>
                      {TIER_LABEL[spell.tier - 1] ?? spell.tier}
                    </span>
                  )}
                  <span style={{ flex: 1, fontFamily: 'var(--font-heading)', fontSize: 11, color: '#8B6AAA', letterSpacing: '0.04em' }}>
                    {spell?.name ?? id}
                  </span>

                  {/* Cast button */}
                  {spell && onRoll && stats && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        const castMod = modifier(stats[castingAttr] ?? 10) + spellcastingBonus
                        const spellDC = 10 + spell.tier
                        const result  = rollDie('d20', `Conjurar: ${spell.name}`, `DC ${spellDC}`, castMod)
                        result.isCritical = result.result === 20
                        result.isFumble   = result.result === 1
                        onRoll(result)
                      }}
                      style={{
                        fontFamily: 'var(--font-heading)', fontSize: 7.5, letterSpacing: '0.1em',
                        textTransform: 'uppercase', background: 'rgba(42,26,58,0.6)',
                        border: '1px solid rgba(107,78,138,0.4)', color: '#8B6AAA',
                        padding: '4px 8px', borderRadius: 2, cursor: 'pointer',
                        whiteSpace: 'nowrap', transition: 'all 200ms',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(107,78,138,0.3)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--parchment-light)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(42,26,58,0.6)'
                        ;(e.currentTarget as HTMLButtonElement).style.color = '#8B6AAA'
                      }}
                    >
                      ☽ Conjurar
                    </button>
                  )}

                  {/* Forget button */}
                  {onSpellsChange && (
                    <button
                      onClick={e => { e.stopPropagation(); forgetSpell(id) }}
                      title="Esquecer magia"
                      style={{
                        background: 'none', border: 'none',
                        color: 'rgba(139,21,21,0.45)', fontSize: 11,
                        cursor: 'pointer', lineHeight: 1, padding: '0 2px',
                        transition: 'color 180ms', flexShrink: 0,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--blood-bright)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,21,21,0.45)')}
                    >
                      ✕
                    </button>
                  )}

                  {spell && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--bone-muted)', flexShrink: 0 }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {/* Expanded details */}
                {spell && isOpen && (
                  <div
                    style={{ padding: '0 12px 10px', borderTop: '1px solid rgba(107,78,138,0.15)', animation: 'inkSpread 200ms cubic-bezier(0.4,0,0.2,1) both' }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', gap: 14, marginTop: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                      {([
                        { label: 'Alcance',    value: spell.range },
                        { label: 'Duração',    value: spell.duration },
                        { label: 'Conjuração', value: spell.castingTime },
                        ...(spell.school ? [{ label: 'Escola', value: spell.school }] : []),
                        { label: 'DC', value: String(10 + spell.tier) },
                      ] as { label: string; value: string | null | undefined }[]).map(({ label, value }) => value ? (
                        <div key={label}>
                          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B4E8A', marginBottom: 1 }}>
                            {label}
                          </div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--parchment-light)' }}>
                            {value}
                          </div>
                        </div>
                      ) : null)}
                    </div>
                    <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                      {spell.description}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Spell picker modal */}
      {showPicker && (
        <SpellPickerModal
          available={available}
          learned={equippedSpells}
          onLearn={learnSpell}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
