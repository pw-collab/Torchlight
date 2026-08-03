'use client'

import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getSpell, getSpellsForClass } from '@/data/spells/index'
import type { Spell } from '@/data/spells/index'
import { rollDie, modifier } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { NumInput } from '@/components/sheet/NumInput'
import { RollableText } from '@/components/shared/RollableText'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { buttonStyle } from '@/components/shared/buttonStyles'

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
        <div>
          <OrnateTitle color="#8B6AAA" fontSize={10}>☽ Aprender Magia</OrnateTitle>
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

// ─── Spell Card (replicates ClassPanel's TechniqueCard grid + popover) ────────

const SPELL_STYLE = {
  normal: '#8B6AAA',
  failed: '#ff444c',
}

function SpellCard({
  id, spell, isFailed, castingAttr, spellcastingBonus, stats, onRoll,
  onForget, onFail, onRecover,
}: {
  id: string
  spell: Spell | undefined
  isFailed: boolean
  castingAttr: string
  spellcastingBonus: number
  stats?: Record<string, number>
  onRoll?: (r: RollResult) => void
  onForget?: () => void
  onFail: () => void
  onRecover: () => void
}) {
  const color = isFailed ? SPELL_STYLE.failed : SPELL_STYLE.normal
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

  const name    = spell?.name ?? id
  const tier    = spell ? (TIER_LABEL[spell.tier - 1] ?? String(spell.tier)) : '·'
  const dc      = spell ? 10 + spell.tier : null
  const school  = spell?.school ?? 'Arcano'

  function cast() {
    if (!spell || !onRoll || !stats) return
    const castMod  = modifier(stats[castingAttr] ?? 10) + spellcastingBonus
    const spellDC  = 10 + spell.tier
    const result   = rollDie('d20', `Conjurar: ${spell.name}`, `DC ${spellDC}`, castMod)
    result.isCritical = result.result === 20
    result.isFumble   = result.result === 1
    onRoll(result)
    if (result.total < spellDC) onFail()
  }

  const popover = open
    ? createPortal(
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(3px)', WebkitBackdropFilter: 'blur(3px)', padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="animate-ink-spread"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#0a0805', border: '1px solid rgba(238,233,221,0.25)', boxShadow: '0 4px 7px rgba(0,0,0,0.65)', padding: 4, width: 'min(340px, calc(100vw - 32px))', height: 'min(400px, calc(100dvh - 32px))', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ border: '1px solid rgba(238,233,221,0.25)', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 9px 12px' }}>
              {/* Heading */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexShrink: 0 }}>
                <span style={{ width: 32, height: 32, flexShrink: 0, border: `1px solid ${color}`, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-heading)', fontSize: 13, color, lineHeight: 1 }}>
                  {tier}
                </span>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color, lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color, letterSpacing: '1px', textTransform: 'uppercase', lineHeight: 1 }}>
                    {isFailed ? 'Falhou' : `${school}${dc != null ? ` · DC ${dc}` : ''}`}
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
              <div style={{ height: 1, background: color, flexShrink: 0 }} />
              {/* Scrollable content */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {spell && (
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {([
                      { label: 'Alcance',    value: spell.range },
                      { label: 'Duração',    value: spell.duration },
                      { label: 'Conjuração', value: spell.castingTime },
                    ] as { label: string; value: string | null | undefined }[]).map(({ label, value }) => value ? (
                      <div key={label}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color, marginBottom: 1 }}>
                          {label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#eee9dd' }}>
                          {value}
                        </div>
                      </div>
                    ) : null)}
                  </div>
                )}
                {spell && (
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#eee9dd', lineHeight: 1.5, textAlign: 'left', margin: 0, whiteSpace: 'pre-line' }}>
                    <RollableText text={spell.description} label={spell.name} onRoll={onRoll} />
                  </p>
                )}
                {isFailed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: '#ff444c', background: 'rgba(255,68,76,0.12)', border: '1px solid rgba(255,68,76,0.35)', padding: '2px 7px', letterSpacing: '0.1em' }}>
                      FALHOU
                    </span>
                    <button onClick={onRecover} className="tactile" style={{ ...buttonStyle('hollow'), border: '1px solid #4fa98c', color: '#4fa98c' }}>
                      Recuperar
                    </button>
                  </div>
                )}
              </div>
              {/* Actions */}
              {(onForget || (spell && onRoll && stats && !isFailed)) && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginTop: 2 }}>
                  {spell && onRoll && stats && !isFailed && (
                    <button onClick={cast} className="tactile" style={{ ...buttonStyle('red'), background: color, flex: 1 }}>
                      Conjurar
                    </button>
                  )}
                  {onForget && (
                    <button onClick={onForget} className="tactile" style={{ ...buttonStyle('hollow'), flex: 1 }}>
                      Esquecer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title={name}
        className="tactile card-lift"
        style={{
          background: '#0a0805',
          border: `1px solid ${open ? color : 'rgba(238,233,221,0.25)'}`,
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
          opacity: isFailed ? 0.7 : 1,
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
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 10, letterSpacing: '2.7px', color, lineHeight: 1 }}>↝</span>
              <span>✦</span>
            </div>
          </div>

          {/* Arch — tier numeral */}
          <div style={{ width: 56, height: 56, border: '1px solid rgba(238,233,221,0.25)', borderRadius: '999px 999px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0, gap: 2 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, color: '#eee9dd', lineHeight: 1, userSelect: 'none' }}>{tier}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color, lineHeight: 1, letterSpacing: '0.04em' }}>
              {isFailed ? 'FALHOU' : dc != null ? `DC ${dc}` : ''}
            </span>
          </div>

          {/* Title */}
          <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: '#eee9dd', textAlign: 'center', width: '100%', lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name}
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
            <span style={{ flex: 1, height: 1, background: color }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color, lineHeight: 1 }}>☽</span>
            <span style={{ flex: 1, height: 1, background: color }} />
          </div>

          {/* School label */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 8, color, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', width: '100%' }}>
            {school}
          </p>

          {/* Description */}
          <div style={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#a69d85', lineHeight: 1.5, margin: 0, textAlign: 'left', display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {spell?.description ?? ''}
            </p>
          </div>
        </div>
      </button>
      {popover}
    </>
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
  const [showPicker,   setShowPicker]   = useState(false)
  const [failedSpells, setFailedSpells] = useState<string[]>([])

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
        border: '1px solid rgba(107,78,138,0.3)',
        padding: 40,
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(107,78,138,0.2)', flexWrap: 'wrap' }}>
        <OrnateTitle color="#6B4E8A" className="flex-1">☽ Magias</OrnateTitle>

        {/* Learn button */}
        {onSpellsChange && (
          <button
            onClick={() => setShowPicker(true)}
            className="tactile"
            style={buttonStyle('dark')}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#14110a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0a0805' }}
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
              className={cn(
                'font-mono h-auto w-[46px] rounded-sm px-1 py-[3px] text-[13px] font-bold',
                'border-[rgba(107,78,138,0.35)] bg-[rgba(42,26,58,0.5)]',
                spellcastingBonus > 0
                  ? 'text-[var(--verdigris-light)]'
                  : spellcastingBonus < 0
                    ? 'text-[var(--blood-bright)]'
                    : 'text-[var(--bone-white)]',
              )}
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

      {/* ── Spell grid — replicates ClassPanel's technique card design ── */}
      {equippedSpells.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
          Nenhuma magia aprendida.{onSpellsChange ? ' Use "+ Aprender" para adicionar.' : ''}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: 10, alignItems: 'start' }}>
          {equippedSpells.map(id => {
            const spell = getSpell(id) ?? available.find(s => s.id === id)
            const isFailed = failedSpells.includes(id)
            return (
              <SpellCard
                key={id}
                id={id}
                spell={spell}
                isFailed={isFailed}
                castingAttr={castingAttr}
                spellcastingBonus={spellcastingBonus}
                stats={stats}
                onRoll={onRoll}
                onForget={onSpellsChange ? () => forgetSpell(id) : undefined}
                onFail={() => setFailedSpells(fs => [...fs, id])}
                onRecover={() => setFailedSpells(fs => fs.filter(s => s !== id))}
              />
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
