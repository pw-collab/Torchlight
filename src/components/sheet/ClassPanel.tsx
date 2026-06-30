'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Class, ClassTechnique, TechniqueKind, Stat } from '@/types/class.types'
import type { TechniqueState } from '@/types/technique.types'
import { rollDie, modifier, modifierStr } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { RollableText } from '@/components/shared/RollableText'

// ─── Style constants ──────────────────────────────────────────────────────────

const STAT_SHORT: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

function panelStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: '1px solid rgba(139,112,48,0.33)',
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

  function activate(abilityId: string, abilityName: string, dc: number, abilityCastStat?: Stat) {
    const resolvedStat = abilityCastStat ?? cfg.castStat
    const statScore = stats[resolvedStat] ?? 10
    const castMod = modifier(statScore)
    const result = rollDie('d20', abilityName, `DC ${dc}`, castMod)
    onRoll?.(result)
    if (result.total < dc) {
      onChange({ ...state, expendedAbilities: [...expended, abilityId] })
    }
  }

  function restore(abilityId: string) {
    onChange({ ...state, expendedAbilities: expended.filter(id => id !== abilityId) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 196, flexShrink: 0, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto' }}>
      {cfg.abilities.map(ability => {
        const isExpended = expended.includes(ability.id)
        const dc = ability.dc ?? cfg.dc
        const abilityCastStat = ability.castStat ?? cfg.castStat
        const abilityStatScore = stats[abilityCastStat] ?? 10
        const abilityCastMod = modifier(abilityStatScore)
        const statusColor = isExpended ? '#ff6044' : '#e0a040'
        return (
          <div key={ability.id} style={{ background: '#0a0805', border: '1px solid rgba(238,233,221,0.25)', boxShadow: '0 4px 7px rgba(0,0,0,0.65)', padding: 4, flexShrink: 0 }}>
            <div style={{ border: '1px solid rgba(238,233,221,0.25)', display: 'flex', flexDirection: 'column', gap: 6, padding: 9 }}>
              {/* Title */}
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#eee9dd', textAlign: 'center', width: '100%', lineHeight: 1.1, opacity: isExpended ? 0.25 : 1 }}>
                {ability.name}
              </p>
              {/* Status divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
                <span style={{ flex: 1, height: 1, background: statusColor }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: statusColor, whiteSpace: 'nowrap', lineHeight: 1 }}>
                  {isExpended ? 'Indisponível' : 'Disponível'}
                </span>
                <span style={{ flex: 1, height: 1, background: statusColor }} />
              </div>
              {/* Roll line */}
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(238,233,221,0.25)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                DC {dc} · d20{abilityCastMod >= 0 ? `+${abilityCastMod}` : abilityCastMod} ({STAT_SHORT[abilityCastStat]})
              </p>
              {/* Description */}
              {ability.description && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#a69d85', lineHeight: 1.5, width: '100%', textAlign: 'left', margin: 0, opacity: isExpended ? 0.25 : 1 }}>
                  {ability.description}
                </p>
              )}
              {/* Action */}
              {isExpended ? (
                <button
                  onClick={() => restore(ability.id)}
                  className="tactile"
                  style={{ width: '100%', background: 'transparent', border: '1px solid #ff6044', color: '#ff6044', fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', padding: '11px 13px', cursor: 'pointer' }}
                >
                  Restaurar
                </button>
              ) : (
                <button
                  onClick={() => activate(ability.id, ability.name, dc, ability.castStat)}
                  className="tactile"
                  style={{ width: '100%', background: '#e0a040', border: '1px solid #0a0805', color: '#0a0805', fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '3px', textTransform: 'uppercase', padding: '11px 13px', cursor: 'pointer' }}
                >
                  Ativar
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Technique Card ───────────────────────────────────────────────────────────

const KIND_STYLE: Record<TechniqueKind, { label: string; color: string; soft: string; glyph: string }> = {
  passive:      { label: 'Passivo',  color: '#a56fde', soft: 'rgba(165,111,222,0.35)', glyph: '☿' },
  choice:       { label: 'Escolha',  color: '#c8b890', soft: 'rgba(200,184,144,0.35)', glyph: '⚖' },
  limited_use:  { label: 'Usos',     color: '#ff444c', soft: 'rgba(255,68,76,0.35)',   glyph: '⌛' },
  spell_like:   { label: 'Ativação', color: '#4fa98c', soft: 'rgba(79,169,140,0.35)',  glyph: '☽' },
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
  const kind: TechniqueKind = technique.kind ?? 'passive'
  const style = KIND_STYLE[kind]
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handler)
    }
  }, [open])

  // Compact status indicator shown inside the hex
  const statusLine = (() => {
    if (kind === 'limited_use' && technique.uses) {
      const remaining = state.usesRemaining ?? technique.uses.max
      return { text: `${remaining}/${technique.uses.max}`, color: remaining > 0 ? 'var(--candle-amber)' : 'var(--blood-bright)' }
    }
    if (kind === 'spell_like' && technique.spellLike) {
      const expended = state.expendedAbilities?.length ?? 0
      const total = technique.spellLike.abilities.length
      return { text: `${total - expended}/${total}`, color: expended > 0 ? 'var(--blood-bright)' : 'var(--verdigris-light)' }
    }
    if (kind === 'choice' && state.choice) {
      const cfg = technique.choice!
      const label = cfg.options?.find(o => o.value === state.choice)?.label ?? state.choice
      return { text: label.length > 8 ? label.slice(0, 7) + '…' : label, color: 'var(--candle-amber)' }
    }
    return null
  })()

  const popover = open
    ? createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', maxWidth: '100%', maxHeight: 'calc(100dvh - 32px)' }}
          >
            {/* Central card */}
            <div
              className="animate-ink-spread"
              style={{ background: '#0a0805', border: '1px solid rgba(238,233,221,0.25)', boxShadow: '0 4px 7px rgba(0,0,0,0.65)', padding: 4, width: 'min(340px, 86vw)', maxHeight: 'calc(100dvh - 32px)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
            >
              <div style={{ border: '1px solid rgba(238,233,221,0.25)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 9px 12px' }}>
                {/* Heading */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
                  <span style={{ width: 32, height: 32, flexShrink: 0, border: `1px solid ${style.color}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontSize: 14, color: style.color, lineHeight: 1 }}>
                    {style.glyph}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                    <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: style.color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {technique.name}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color: style.color, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1 }}>
                      {style.label}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fechar"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(238,233,221,0.45)', fontSize: 14, lineHeight: 1, padding: 2, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#eee9dd')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(238,233,221,0.45)')}
                  >
                    ✕
                  </button>
                </div>
                {/* Divider */}
                <div style={{ height: 1, background: style.color, flexShrink: 0 }} />
                {/* Scrollable content */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#eee9dd', lineHeight: 1.5, textAlign: 'left', margin: 0 }}>
                    <RollableText text={technique.description} label={technique.name} onRoll={onRoll} />
                  </p>
                  {kind === 'passive' && technique.modifier && <PassiveModifierLine technique={technique} stats={stats} />}
                  {kind === 'choice' && technique.choice && <ChoiceSection technique={technique} state={state} onChange={onStateChange} />}
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
                </div>
              </div>
            </div>

            {/* Ability column — activation techniques */}
            {kind === 'spell_like' && technique.spellLike && (
              <SpellLikeSection technique={technique} state={state} stats={stats} onChange={onStateChange} onRoll={onRoll} />
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title={technique.name}
        className="tactile card-lift"
        style={{
          background: '#0a0805',
          border: `1px solid ${open ? style.color : 'rgba(238,233,221,0.25)'}`,
          boxShadow: '0 4px 7px rgba(0,0,0,0.65)',
          padding: 4,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: 224,
          boxSizing: 'border-box',
          transition: 'border-color 250ms',
        }}
      >
        <div style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          border: '1px solid rgba(238,233,221,0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '10px 9px 12px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {/* Corner marks + roll arrow */}
          <div aria-hidden style={{ position: 'absolute', inset: 4, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-body)', fontSize: 6, color: 'rgba(238,233,221,0.25)', lineHeight: '6px' }}>
              <span>✦</span><span>✦</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-body)', fontSize: 6, color: 'rgba(238,233,221,0.25)', lineHeight: '6px' }}>
              <span>✦</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10, letterSpacing: '2.7px', color: style.color, lineHeight: 1 }}>↝</span>
              <span>✦</span>
            </div>
          </div>

          {/* Arch icon */}
          <div style={{ width: 56, height: 56, border: '1px solid rgba(238,233,221,0.25)', borderRadius: '999px 999px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 22, color: '#eee9dd', lineHeight: 1, userSelect: 'none' }}>{style.glyph}</span>
            {statusLine && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: statusLine.color, lineHeight: 1, letterSpacing: '0.04em' }}>{statusLine.text}</span>
            )}
          </div>

          {/* Title */}
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#eee9dd', textAlign: 'center', width: '100%', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {technique.name}
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
            <span style={{ flex: 1, height: 1, background: style.color }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: style.color, lineHeight: 1 }}>⨝</span>
            <span style={{ flex: 1, height: 1, background: style.color }} />
          </div>

          {/* Kind label */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color: style.color, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
            {style.label}
          </p>

          {/* Description */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#a69d85', lineHeight: 1.5, margin: 0, textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {technique.description}
            </p>
          </div>
        </div>
      </button>
      {popover}
    </>
  )
}

// ─── Talent Table ─────────────────────────────────────────────────────────────

function TalentTable({ classData }: { classData: Class }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <SectionSubheading trailing={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,184,144,0.45)' }}>
            Role no modal de edição
          </span>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: '#c8b890', padding: 0 }}
          >
            {open ? '▲ ocultar' : '▼ ver'}
          </button>
        </div>
      }>
        Tabela de Talentos
      </SectionSubheading>

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
    <div className="worn-border" style={panelStyle({ padding: 42 })}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid rgba(200,184,144,0.25)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#ff444c', lineHeight: 1 }}>⪧</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 24, color: '#c8b890', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {classData.name}
          </span>
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#c8b890', flexShrink: 0 }}>
          d{classData.hitDie}
        </span>
      </div>

      {/* Proficiencies */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Armas',     value: classData.weaponProficiency },
          { label: 'Armaduras', value: classData.armorProficiency },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e5e35', marginBottom: 3 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#c8b890', lineHeight: 1.4 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Techniques */}
      {activeTechniques.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionSubheading>Técnicas</SectionSubheading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 10, alignItems: 'start' }}>
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

// ─── Section subheading (⁕ Title) ─────────────────────────────────────────────

function SectionSubheading({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingBottom: 7, borderBottom: '1px solid rgba(200,184,144,0.18)' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#ff444c', lineHeight: 1 }}>⁕</span>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 17, color: '#c8b890', lineHeight: 1 }}>{children}</span>
      </span>
      {trailing}
    </div>
  )
}
