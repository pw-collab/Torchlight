'use client'

import { useState } from 'react'
import type { Class, ClassTechnique, TechniqueKind, Stat } from '@/types/class.types'
import type { TechniqueState } from '@/types/technique.types'
import { rollDie, modifier, modifierStr } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'

// ─── Style constants ──────────────────────────────────────────────────────────

const STAT_SHORT: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

function panelStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'var(--parchment-mid)',
    border: '1px solid var(--bone-dim)',
    ...extra,
  }
}

type BtnVariant = 'blood' | 'amber' | 'mist' | 'dark' | 'danger' | 'green'
function btnStyle(variant: BtnVariant): React.CSSProperties {
  const map: Record<BtnVariant, [string, string, string]> = {
    blood:  ['rgba(139,21,21,0.35)',  'var(--blood-mid)',       'var(--bone-white)'],
    amber:  ['rgba(106,58,10,0.3)',   '#6B3A0A',               'var(--bone-white)'],
    mist:   ['rgba(42,26,58,0.35)',   'rgba(107,78,138,0.5)',  'var(--bone-white)'],
    dark:   ['rgba(42,34,16,0.4)',    'rgba(139,112,48,0.3)',  'var(--bone-muted)'],
    danger: ['rgba(139,21,21,0.2)',   'rgba(196,32,32,0.4)',   'var(--blood-bright)'],
    green:  ['rgba(42,80,69,0.3)',    '#2A5045',               'var(--bone-white)'],
  }
  const [bg, border, color] = map[variant]
  return {
    background: bg, border: `1px solid ${border}`, color,
    fontFamily: 'var(--font-body)', fontStyle: 'italic' as const, fontSize: 10, padding: '4px 10px',
    cursor: 'pointer', transition: 'all 220ms',
    whiteSpace: 'nowrap' as const,
  }
}

// ─── State helpers ────────────────────────────────────────────────────────────

function getState(states: TechniqueState[], id: string): TechniqueState {
  return states.find(s => s.id === id) ?? { id }
}

function patchState(states: TechniqueState[], patch: TechniqueState): TechniqueState[] {
  const idx = states.findIndex(s => s.id === patch.id)
  if (idx >= 0) return states.map((s, i) => (i === idx ? { ...s, ...patch } : s))
  return [...states, patch]
}

// ─── KIND: passive with modifier ─────────────────────────────────────────────

function PassiveModifierLine({
  technique,
  stats,
}: {
  technique: ClassTechnique
  stats: Record<string, number>
}) {
  const mod = technique.modifier!
  const score = stats[mod.stat] ?? 10
  const bonus = modifier(score)
  const effective = mod.onlyIfPositive ? Math.max(0, bonus) : bonus
  const label = STAT_SHORT[mod.stat as Stat] ?? mod.stat.toUpperCase()

  return (
    <div
      style={{
        marginTop: 6,
        padding: '6px 8px',
        background: 'rgba(42,34,16,0.4)',
        border: '1px solid rgba(139,112,48,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--bone-muted)' }}>
        {label} {score}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--bone-muted)' }}>→</span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700,
        color: effective > 0 ? 'var(--verdigris-light)' : 'var(--bone-muted)',
      }}>
        {modifierStr(score)}
      </span>
      <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)' }}>
        → {effective > 0 ? `+${effective}` : effective} slots extras de carga
        {mod.onlyIfPositive && effective === 0 && ' (inativo — mod. negativo)'}
      </span>
    </div>
  )
}

// ─── KIND: choice ─────────────────────────────────────────────────────────────

function ChoiceSection({
  technique,
  state,
  onChange,
}: {
  technique: ClassTechnique
  state: TechniqueState
  onChange: (s: TechniqueState) => void
}) {
  const cfg = technique.choice!
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const currentLabel = (() => {
    if (!state.choice) return null
    if (cfg.options) {
      return cfg.options.find(o => o.value === state.choice)?.label ?? state.choice
    }
    return state.choice
  })()

  function commit(value: string) {
    if (value.trim()) onChange({ ...state, choice: value.trim() })
    setEditing(false)
    setDraft('')
  }

  return (
    <div style={{ marginTop: 6 }}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {currentLabel ? (
            <>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--bone-muted)',
              }}>
                {cfg.informativeOnly ? 'Registrado' : 'Escolha'}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--candle-amber)',
                background: 'rgba(106,58,10,0.18)',
                border: '1px solid rgba(196,120,42,0.3)',
                padding: '2px 8px',
              }}>
                {currentLabel}
              </span>
              <button
                onClick={() => { setDraft(state.choice ?? ''); setEditing(true) }}
                style={{ ...btnStyle('dark'), fontSize: 7, padding: '3px 7px' }}
              >
                ✏ alterar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={btnStyle('amber')}
            >
              + {cfg.prompt}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {cfg.kind === 'free_text' ? (
            <input
              autoFocus
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(draft); if (e.key === 'Escape') setEditing(false) }}
              placeholder={cfg.prompt}
              style={{
                background: 'var(--ink-deep)',
                border: '1px solid rgba(139,112,48,0.4)',
                color: 'var(--parchment-light)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                padding: '4px 8px',
                outline: 'none',
                flex: 1,
                minWidth: 120,
              }}
            />
          ) : (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(cfg.options ?? []).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => commit(opt.value)}
                  style={{
                    ...btnStyle(state.choice === opt.value ? 'amber' : 'dark'),
                    fontSize: 8,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {cfg.kind === 'free_text' && (
            <button onClick={() => commit(draft)} style={btnStyle('green')}>✓</button>
          )}
          <button onClick={() => setEditing(false)} style={btnStyle('dark')}>✕</button>
        </div>
      )}
    </div>
  )
}

// ─── KIND: limited_use ────────────────────────────────────────────────────────

function UsePips({
  max,
  remaining,
  onUse,
  onReset,
  perLabel,
}: {
  max: number
  remaining: number
  onUse: () => void
  onReset: () => void
  perLabel?: string
}) {
  return (
    <div style={{ marginTop: 7, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {/* Pips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: 13,
              color: i < remaining ? 'var(--candle-amber)' : 'rgba(139,112,48,0.2)',
              filter: i < remaining ? 'drop-shadow(0 0 3px rgba(196,120,42,0.5))' : 'none',
              transition: 'all 250ms',
              lineHeight: 1,
            }}
          >
            ✦
          </span>
        ))}
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--bone-muted)' }}>
        {remaining}/{max}{perLabel ? ` ${perLabel}` : ''}
      </span>
      <button
        onClick={onUse}
        disabled={remaining <= 0}
        style={{
          ...btnStyle('blood'),
          opacity: remaining <= 0 ? 0.35 : 1,
          cursor: remaining <= 0 ? 'not-allowed' : 'pointer',
        }}
      >
        Usar
      </button>
      <button
        onClick={onReset}
        disabled={remaining >= max}
        style={{
          ...btnStyle('dark'),
          opacity: remaining >= max ? 0.35 : 1,
          cursor: remaining >= max ? 'not-allowed' : 'pointer',
        }}
      >
        Descansar
      </button>
    </div>
  )
}

// ─── KIND: spell_like ─────────────────────────────────────────────────────────

function SpellLikeSection({
  technique,
  state,
  stats,
  onChange,
  onRoll,
}: {
  technique: ClassTechnique
  state: TechniqueState
  stats: Record<string, number>
  onChange: (s: TechniqueState) => void
  onRoll?: (r: RollResult) => void
}) {
  const cfg = technique.spellLike!
  const expended = state.expendedAbilities ?? []

  // Detect if any ability overrides the default cast stat (e.g. Monk's Mysticism)
  const hasPerAbilityStat = cfg.abilities.some(a => a.castStat && a.castStat !== cfg.castStat)

  function activate(abilityId: string, abilityName: string, dc: number, abilityCastStat?: Stat) {
    const resolvedStat = abilityCastStat ?? cfg.castStat
    const statScore = stats[resolvedStat] ?? 10
    const castMod = modifier(statScore)
    const result = rollDie('d20', abilityName, `DC ${dc}`, castMod)
    onRoll?.(result)

    if (result.total < dc) {
      // Failed — mark as expended
      onChange({ ...state, expendedAbilities: [...expended, abilityId] })
    }
  }

  function resetAll() {
    onChange({ ...state, expendedAbilities: [] })
  }

  const defaultStatScore = stats[cfg.castStat] ?? 10

  return (
    <div style={{ marginTop: 8 }}>
      {/* Cast stat line */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8.5,
          color: 'var(--bone-muted)',
        }}>
          {hasPerAbilityStat
            ? 'Rolamento: d20 + atributo (varia por habilidade)'
            : `Rolamento: d20 + ${STAT_SHORT[cfg.castStat]} (${modifierStr(defaultStatScore)})`
          }
        </span>
        <button
          onClick={resetAll}
          disabled={expended.length === 0}
          style={{
            ...btnStyle('dark'),
            fontSize: 7,
            opacity: expended.length === 0 ? 0.35 : 1,
            cursor: expended.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Descansar
        </button>
      </div>

      {/* Ability list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {cfg.abilities.map(ability => {
          const isExpended = expended.includes(ability.id)
          const dc = ability.dc ?? cfg.dc
          // Per-ability stat resolution (e.g. Monk Mysticism: DEX/CON per technique)
          const abilityCastStat = ability.castStat ?? cfg.castStat
          const abilityStatScore = stats[abilityCastStat] ?? 10
          const abilityCastMod = modifier(abilityStatScore)

          return (
            <div
              key={ability.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '6px 10px',
                background: isExpended ? 'rgba(42,34,16,0.2)' : 'rgba(42,34,16,0.4)',
                border: `1px solid ${isExpended ? 'rgba(139,112,48,0.12)' : 'rgba(139,112,48,0.22)'}`,
                opacity: isExpended ? 0.6 : 1,
                transition: 'all 300ms',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: isExpended ? 'var(--bone-muted)' : 'var(--candle-amber)',
                  }}>
                    {ability.name}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: isExpended ? 'var(--blood-bright)' : 'var(--verdigris-light)',
                    background: isExpended ? 'rgba(139,21,21,0.12)' : 'rgba(42,80,69,0.15)',
                    border: `1px solid ${isExpended ? 'rgba(139,21,21,0.25)' : 'rgba(42,80,69,0.3)'}`,
                    padding: '2px 6px',
                  }}>
                    {isExpended ? '✕ Usado' : '● Disponível'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--bone-muted)' }}>
                    DC {dc} · d20{abilityCastMod >= 0 ? `+${abilityCastMod}` : abilityCastMod}
                    {hasPerAbilityStat && ` (${STAT_SHORT[abilityCastStat]})`}
                  </span>
                </div>
                {ability.description && (
                  <p style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 10,
                    color: 'var(--bone-muted)',
                    lineHeight: 1.5,
                    marginTop: 3,
                  }}>
                    {ability.description}
                  </p>
                )}
                {(ability.range || ability.duration || ability.castingTime) && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    {[
                      { label: 'Alcance', val: ability.range },
                      { label: 'Duração', val: ability.duration },
                      { label: 'Ação', val: ability.castingTime },
                    ].filter(x => x.val).map(({ label, val }) => (
                      <span key={label} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(139,112,48,0.5)' }}>
                        {label}: {val}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => activate(ability.id, ability.name, dc, ability.castStat)}
                disabled={isExpended}
                style={{
                  ...btnStyle(isExpended ? 'dark' : 'amber'),
                  opacity: isExpended ? 0.3 : 1,
                  cursor: isExpended ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                Ativar
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Technique Card ───────────────────────────────────────────────────────────

const KIND_BADGE: Record<TechniqueKind, { label: string; color: string; bg: string }> = {
  passive:      { label: 'Passivo',     color: 'rgba(107,78,138,0.8)',  bg: 'rgba(42,26,58,0.3)' },
  choice:       { label: 'Escolha',     color: 'var(--candle-amber)',   bg: 'rgba(106,58,10,0.2)' },
  limited_use:  { label: 'Usos',        color: 'var(--blood-bright)',   bg: 'rgba(139,21,21,0.15)' },
  spell_like:   { label: 'Ativação',    color: 'var(--verdigris-light)', bg: 'rgba(42,80,69,0.2)' },
}

function TechniqueCard({
  technique,
  state,
  stats,
  onStateChange,
  onRoll,
}: {
  technique: ClassTechnique
  state: TechniqueState
  stats: Record<string, number>
  onStateChange: (s: TechniqueState) => void
  onRoll?: (r: RollResult) => void
}) {
  const [open, setOpen] = useState(false)
  const kind: TechniqueKind = technique.kind ?? 'passive'
  const badge = KIND_BADGE[kind]

  // Inline summary shown in the collapsed header for some kinds
  const headerExtra = (() => {
    if (kind === 'choice' && state.choice) {
      const cfg = technique.choice!
      const label = cfg.options?.find(o => o.value === state.choice)?.label ?? state.choice
      return (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--candle-amber)',
          background: 'rgba(106,58,10,0.18)',
          border: '1px solid rgba(196,120,42,0.25)',
          padding: '1px 6px',
        }}>
          {label}
        </span>
      )
    }
    if (kind === 'limited_use' && technique.uses) {
      const max = technique.uses.max
      const remaining = state.usesRemaining ?? max
      return (
        <span style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: max }).map((_, i) => (
            <span key={i} style={{
              fontSize: 10,
              color: i < remaining ? 'var(--candle-amber)' : 'rgba(139,112,48,0.2)',
              lineHeight: 1,
            }}>✦</span>
          ))}
        </span>
      )
    }
    return null
  })()

  return (
    <div
      className="worn-border"
      style={{
        background: 'rgba(42,34,16,0.35)',
        border: '1px solid rgba(139,112,48,0.22)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          padding: '8px 10px',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--candle-amber)',
          }}>
            {technique.name}
          </span>
          {/* Kind badge */}
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 6.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: badge.color,
            background: badge.bg,
            border: `1px solid ${badge.color}40`,
            padding: '1px 5px',
            flexShrink: 0,
          }}>
            {badge.label}
          </span>
          {headerExtra}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--bone-muted)', flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Body */}
      {open && (
        <div
          style={{ padding: '0 10px 10px', borderTop: '1px solid rgba(139,112,48,0.12)' }}
          onClick={e => e.stopPropagation()}
        >
          <p style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--bone-muted)',
            lineHeight: 1.6,
            marginTop: 8,
          }}>
            {technique.description}
          </p>

          {/* Kind-specific UI */}
          {kind === 'passive' && technique.modifier && (
            <PassiveModifierLine technique={technique} stats={stats} />
          )}
          {kind === 'choice' && technique.choice && (
            <ChoiceSection technique={technique} state={state} onChange={onStateChange} />
          )}
          {kind === 'limited_use' && technique.uses && (
            <UsePips
              max={technique.uses.max}
              remaining={state.usesRemaining ?? technique.uses.max}
              perLabel={technique.uses.perLabel}
              onUse={() => {
                const cur = state.usesRemaining ?? technique.uses!.max
                if (cur > 0) onStateChange({ ...state, usesRemaining: cur - 1 })
              }}
              onReset={() => onStateChange({ ...state, usesRemaining: technique.uses!.max })}
            />
          )}
          {kind === 'spell_like' && technique.spellLike && (
            <SpellLikeSection
              technique={technique}
              state={state}
              stats={stats}
              onChange={onStateChange}
              onRoll={onRoll}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Talent Table ─────────────────────────────────────────────────────────────

function TalentTable({ classData }: { classData: Class }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)',
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
          Tabela de Talentos
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9, color: 'rgba(139,112,48,0.45)' }}>
            Role no modal de edição
          </span>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: 'var(--bone-muted)', padding: 0 }}
          >
            {open ? '▲ ocultar' : '▼ ver'}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-ink-spread" style={{ border: '1px solid rgba(139,112,48,0.2)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: 'rgba(42,34,16,0.6)', borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
            {['2D6', 'Efeito'].map((h, i) => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-muted)', padding: '5px 10px', borderRight: i === 0 ? '1px solid rgba(139,112,48,0.18)' : 'none' }}>
                {h}
              </div>
            ))}
          </div>
          {classData.talentTable.map((entry, i) => (
            <div key={entry.roll} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: i % 2 === 0 ? 'rgba(42,34,16,0.2)' : 'rgba(42,34,16,0.08)', borderBottom: i < classData.talentTable.length - 1 ? '1px solid rgba(139,112,48,0.1)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--bone-muted)', padding: '7px 10px', borderRight: '1px solid rgba(139,112,48,0.18)', display: 'flex', alignItems: 'center' }}>
                {entry.roll}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--bone-muted)', padding: '7px 10px', lineHeight: 1.4 }}>
                {entry.effect}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

interface Props {
  classData: Class
  stats: Record<string, number>
  techniqueStates: TechniqueState[]
  onStateChange: (states: TechniqueState[]) => void
  onRoll?: (result: RollResult) => void
}

export function ClassPanel({ classData, stats, techniqueStates, onStateChange, onRoll }: Props) {
  const activeTechniques = classData.techniques.filter(
    (t): t is ClassTechnique => t !== null,
  )

  function handleTechniqueState(updated: TechniqueState) {
    onStateChange(patchState(techniqueStates, updated))
  }

  return (
    <div className="worn-border" style={panelStyle({ padding: '14px 15px' })}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--parchment-pale)', letterSpacing: '0.03em' }}>
          {classData.name}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--bone-muted)' }}>
          d{classData.hitDie}
        </span>
      </div>

      {/* Proficiencies */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {[
          { label: 'Armas',     value: classData.weaponProficiency },
          { label: 'Armaduras', value: classData.armorProficiency },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9, color: 'var(--bone-muted)', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--parchment-light)', lineHeight: 1.4 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Techniques */}
      {activeTechniques.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 8, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
            Técnicas
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {activeTechniques.map(t => (
              <TechniqueCard
                key={t.id}
                technique={t}
                state={getState(techniqueStates, t.id)}
                stats={stats}
                onStateChange={handleTechniqueState}
                onRoll={onRoll}
              />
            ))}
          </div>
        </div>
      )}

      {/* Talent Table */}
      <TalentTable classData={classData} />
    </div>
  )
}
