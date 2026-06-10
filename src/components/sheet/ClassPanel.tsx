'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Class, ClassTechnique, TechniqueKind, Stat } from '@/types/class.types'
import type { TechniqueState } from '@/types/technique.types'
import { rollDie, modifier, modifierStr } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { RollableText } from '@/components/shared/RollableText'
import { roman } from '@/components/shared/TarotCard'
import { OrnateTitle } from '@/components/shared/OrnateTitle'

// ─── Style constants ──────────────────────────────────────────────────────────

const HEX_CLIP = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
const POPOVER_W = 300

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

const KIND_STYLE: Record<TechniqueKind, { label: string; color: string; soft: string; glyph: string }> = {
  passive:      { label: 'Passivo',  color: 'rgba(155,120,190,0.9)',  soft: 'rgba(107,78,138,0.38)', glyph: '☿' },
  choice:       { label: 'Escolha',  color: 'var(--candle-amber)',    soft: 'rgba(196,120,42,0.35)', glyph: '⚖' },
  limited_use:  { label: 'Usos',     color: 'var(--blood-bright)',    soft: 'rgba(139,21,21,0.38)',  glyph: '⌛' },
  spell_like:   { label: 'Ativação', color: 'var(--verdigris-light)', soft: 'rgba(61,112,96,0.4)',   glyph: '☽' },
}

function TechniqueCard({
  technique,
  index,
  state,
  stats,
  onStateChange,
  onRoll,
}: {
  technique: ClassTechnique
  index: number
  state: TechniqueState
  stats: Record<string, number>
  onStateChange: (s: TechniqueState) => void
  onRoll?: (r: RollResult) => void
}) {
  const kind: TechniqueKind = technique.kind ?? 'passive'
  const style = KIND_STYLE[kind]
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return }
    const r = btnRef.current.getBoundingClientRect()
    let left = r.left + r.width / 2 - POPOVER_W / 2
    left = Math.max(8, Math.min(left, window.innerWidth - POPOVER_W - 8))
    const spaceBelow = window.innerHeight - r.bottom - 8
    const top = spaceBelow >= 80 ? r.bottom + 8 : Math.max(8, r.top - 8 - 380)
    setPos({ top, left })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
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

  const popover = open && pos
    ? createPortal(
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.55)' }} />
          <div
            className="animate-ink-spread"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: POPOVER_W,
              zIndex: 141,
              background: 'linear-gradient(168deg, rgba(20,8,4,0.98) 0%, rgba(8,6,4,0.99) 100%)',
              border: `1px solid ${style.soft}`,
              borderTop: `2px solid ${style.color}`,
              borderRadius: 6,
              boxShadow: `0 10px 40px rgba(0,0,0,0.80), 0 0 20px ${style.soft}`,
              overflow: 'hidden',
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px 8px',
              borderBottom: `1px solid ${style.soft}`,
              background: `linear-gradient(90deg, rgba(0,0,0,0) 0%, ${style.soft} 100%)`,
            }}>
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{style.glyph}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--bone-white)', letterSpacing: '0.06em', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {technique.name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: style.color, opacity: 0.85, marginTop: 2 }}>
                  {roman(index + 1)} · {style.label}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bone-muted)', fontSize: 13, lineHeight: 1, padding: '2px 4px', flexShrink: 0, opacity: 0.6 }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '12px 14px 16px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)', lineHeight: 1.6, margin: 0 }}>
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
              {kind === 'spell_like' && technique.spellLike && (
                <SpellLikeSection technique={technique} state={state} stats={stats} onChange={onStateChange} onRoll={onRoll} />
              )}
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        title={technique.name}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Hex border (outer) + fill (inner) */}
        <div style={{
          width: 80,
          height: 88,
          clipPath: HEX_CLIP,
          background: style.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: open ? `drop-shadow(0 0 10px ${style.color})` : `drop-shadow(0 0 4px ${style.soft})`,
          transition: 'filter 250ms',
        }}>
          <div style={{
            width: 76,
            height: 84,
            clipPath: HEX_CLIP,
            background: open
              ? `linear-gradient(180deg, rgba(30,10,4,0.98) 0%, #0D0A05 100%)`
              : `linear-gradient(180deg, rgba(18,8,2,0.97) 0%, #080604 100%)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            transition: 'background 250ms',
          }}>
            <span style={{
              fontSize: 20,
              lineHeight: 1,
              userSelect: 'none',
              filter: `drop-shadow(0 0 5px ${style.soft})`,
            }}>
              {style.glyph}
            </span>
            {statusLine && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 7,
                color: statusLine.color,
                lineHeight: 1,
                letterSpacing: '0.04em',
              }}>
                {statusLine.text}
              </span>
            )}
          </div>
        </div>

        {/* Name label below hex */}
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 8,
          letterSpacing: '0.05em',
          color: open ? 'var(--parchment-light)' : 'var(--bone-muted)',
          textAlign: 'center',
          lineHeight: 1.3,
          maxWidth: 90,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 250ms',
        }}>
          {technique.name}
        </span>
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)',
      }}>
        <OrnateTitle>Tabela de Talentos</OrnateTitle>
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
    <div className="worn-border" style={panelStyle({ padding: 40 })}>
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
          <div style={{ marginBottom: 8, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
            <OrnateTitle>Técnicas</OrnateTitle>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 12, justifyItems: 'center' }}>
            {activeTechniques.map((t, i) => (
              <TechniqueCard
                key={t.id}
                technique={t}
                index={i}
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
