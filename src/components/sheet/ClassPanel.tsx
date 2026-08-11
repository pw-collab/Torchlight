'use client'

import { useState } from 'react'
import type { Class, ClassTechnique, TechniqueKind, Stat } from '@/types/class.types'
import type { Ancestry } from '@/types/ancestry.types'
import type { TechniqueState } from '@/types/technique.types'
import { rollDie, modifier, modifierStr } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { GlyphCard, POPOVER_BODY } from '@/components/shared/GlyphCard'
import { DetailChip, ChipDetail } from '@/components/shared/DetailChip'
import { RollableText } from '@/components/shared/RollableText'
import { SectionSubheading } from '@/components/shared/SectionHeading'
import { Button, type buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { VariantProps } from 'class-variance-authority'

type ButtonVariants = VariantProps<typeof buttonVariants>

// ─── Style constants ──────────────────────────────────────────────────────────

const STAT_SHORT: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

function panelStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: '1px solid var(--border)',
    ...extra,
  }
}

type BtnVariant = 'blood' | 'amber' | 'mist' | 'dark' | 'danger' | 'green'

/** Legacy variant names mapped onto the shadcn Button variants. */
const BTN_VARIANT_MAP: Record<BtnVariant, ButtonVariants['variant']> = {
  blood:  'default',
  amber:  'default',
  green:  'default',
  mist:   'secondary',
  dark:   'secondary',
  danger: 'hollow',
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
        background: 'var(--card)',
        border: '1px solid var(--border)',
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
                background: 'color-mix(in oklch, var(--primary), transparent 82%)',
                border: '1px solid color-mix(in oklch, var(--primary), transparent 70%)',
                padding: '2px 8px',
              }}>
                {currentLabel}
              </span>
              <Button
                variant={BTN_VARIANT_MAP.dark}
                onClick={() => { setDraft(state.choice ?? ''); setEditing(true) }}
                className="h-auto px-[7px] py-[3px] text-[7px]"
              >
                ✏ alterar
              </Button>
            </>
          ) : (
            <Button variant={BTN_VARIANT_MAP.amber} onClick={() => setEditing(true)}>
              + {cfg.prompt}
            </Button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {cfg.kind === 'free_text' ? (
            <Input
              autoFocus
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commit(draft); if (e.key === 'Escape') setEditing(false) }}
              placeholder={cfg.prompt}
              aria-label={cfg.prompt}
              className="h-auto min-w-[120px] flex-1 border-[var(--border)] bg-[var(--ink-deep)] px-2 py-1 text-sm text-[var(--parchment-light)]"
            />
          ) : (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {(cfg.options ?? []).map(opt => (
                <Button
                  key={opt.value}
                  variant={BTN_VARIANT_MAP[state.choice === opt.value ? 'amber' : 'dark']}
                  onClick={() => commit(opt.value)}
                  aria-pressed={state.choice === opt.value}
                  className="text-[8px]"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          )}
          {cfg.kind === 'free_text' && (
            <Button variant={BTN_VARIANT_MAP.green} onClick={() => commit(draft)} aria-label="Confirmar">✓</Button>
          )}
          <Button variant={BTN_VARIANT_MAP.dark} onClick={() => setEditing(false)} aria-label="Cancelar">✕</Button>
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
              color: i < remaining ? 'var(--candle-amber)' : 'var(--border)',
              filter: i < remaining ? 'drop-shadow(0 0 3px var(--primary))' : 'none',
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
      <Button
        variant={BTN_VARIANT_MAP.blood}
        onClick={onUse}
        disabled={remaining <= 0}
        className="disabled:opacity-35"
      >
        Usar
      </Button>
      <Button
        variant={BTN_VARIANT_MAP.dark}
        onClick={onReset}
        disabled={remaining >= max}
        className="disabled:opacity-35"
      >
        Descansar
      </Button>
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
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', justifyContent: 'center', maxWidth: '100%', overflowX: 'auto', padding: '0 16px 2px', boxSizing: 'border-box' }}>
      {cfg.abilities.map(ability => {
        const isExpended = expended.includes(ability.id)
        const dc = ability.dc ?? cfg.dc
        const abilityCastStat = ability.castStat ?? cfg.castStat
        const abilityStatScore = stats[abilityCastStat] ?? 10
        const abilityCastMod = modifier(abilityStatScore)
        const statusColor = isExpended ? 'var(--destructive)' : 'var(--chart-1)'
        return (
          <div key={ability.id} style={{ background: 'var(--secondary)', border: '1px solid var(--border)', boxShadow: '0 4px 7px rgba(0,0,0,0.65)', padding: 4, width: 180, flexShrink: 0 }}>
            <div style={{ border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, padding: 9 }}>
              {/* Title */}
              <p style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--foreground)', textAlign: 'center', width: '100%', lineHeight: 1.1, opacity: isExpended ? 0.25 : 1 }}>
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
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted-foreground)', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                DC {dc} · d20{abilityCastMod >= 0 ? `+${abilityCastMod}` : abilityCastMod} ({STAT_SHORT[abilityCastStat]})
              </p>
              {/* Description */}
              {ability.description && (
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.5, width: '100%', textAlign: 'left', margin: 0, opacity: isExpended ? 0.25 : 1 }}>
                  {ability.description}
                </p>
              )}
              {/* Action */}
              {isExpended ? (
                <Button
                  onClick={() => restore(ability.id)}
                  variant="hollow"
                  className="tactile w-full border-[var(--destructive)] text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                >
                  Restaurar
                </Button>
              ) : (
                <Button
                  onClick={() => activate(ability.id, ability.name, dc, ability.castStat)}
                  className="tactile text-primary-foreground w-full border-[var(--primary)] bg-[var(--primary)] hover:bg-[var(--primary)]/80"
                >
                  Ativar
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Technique Card ───────────────────────────────────────────────────────────

// The four kinds used to be told apart by hue (purple / parchment / red /
// verdigris). This theme is monochrome apart from the reds, so they are told
// apart by lightness instead — every value still clears 4.5:1 on --card.
const KIND_STYLE: Record<TechniqueKind, { label: string; color: string; glyph: string }> = {
  passive:      { label: 'Passivo',  color: 'var(--chart-1)',          glyph: '☿' },
  choice:       { label: 'Escolha',  color: 'var(--muted-foreground)', glyph: '⚖' },
  limited_use:  { label: 'Usos',     color: 'var(--destructive)',      glyph: '⌛' },
  spell_like:   { label: 'Ativação', color: 'var(--foreground)',       glyph: '☽' },
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

  return (
    <GlyphCard
      glyph={style.glyph}
      title={technique.name}
      caption={style.label}
      accent={style.color}
      description={technique.description}
      status={statusLine}
      overlay={
        // Ability cards — activation techniques, pinned to the bottom of the screen
        kind === 'spell_like' && technique.spellLike ? (
          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', left: 0, right: 0, bottom: 16 }}>
            <SpellLikeSection technique={technique} state={state} stats={stats} onChange={onStateChange} onRoll={onRoll} />
          </div>
        ) : null
      }
    >
      <p style={POPOVER_BODY}>
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
    </GlyphCard>
  )
}

// ─── Talent Table ─────────────────────────────────────────────────────────────

function TalentTable({ classData }: { classData: Class }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <SectionSubheading className="mb-3" trailing={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted-foreground)' }}>
            Role no modal de edição
          </span>
          <Button
            variant="link"
            onClick={() => setOpen(o => !o)}
            className="font-sans text-secondary-foreground h-auto p-0 text-xs tracking-normal normal-case italic no-underline"
          >
            {open ? '▲ ocultar' : '▼ ver'}
          </Button>
        </div>
      }>
        Tabela de Talentos
      </SectionSubheading>

      {open && (
        <div className="animate-ink-spread" style={{ border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
            {['2D6', 'Efeito'].map((h, i) => (
              <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-muted)', padding: '5px 10px', borderRight: i === 0 ? '1px solid var(--border)' : 'none' }}>
                {h}
              </div>
            ))}
          </div>
          {classData.talentTable.map((entry, i) => (
            <div key={entry.roll} style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: i % 2 === 0 ? 'var(--card)' : 'var(--card)', borderBottom: i < classData.talentTable.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--bone-muted)', padding: '7px 10px', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
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
  /** Fills the ancestry tag beside the class one. Omitted, the tag is dropped. */
  ancestry?: Ancestry
  /** The sheet's languages, listed inside the ancestry tag. */
  languages?: string[]
  stats: Record<string, number>
  techniqueStates: TechniqueState[]
  onStateChange: (states: TechniqueState[]) => void
  onRoll?: (result: RollResult) => void
}

export function ClassPanel({ classData, ancestry, languages = [], stats, techniqueStates, onStateChange, onRoll }: Props) {
  const activeTechniques = classData.techniques.filter(
    (t): t is ClassTechnique => t !== null,
  )

  function handleTechniqueState(updated: TechniqueState) {
    onStateChange(patchState(techniqueStates, updated))
  }

  return (
    <div className="worn-border" style={panelStyle({ padding: 42 })}>
      {/* Header — class and ancestry condensed into tags, with the
          proficiencies, traits and languages one hover (or tap) away. */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16, paddingBottom: 8, borderBottom: '2px solid var(--border)' }}>
        <DetailChip
          label={classData.name}
          trailing={`d${classData.hitDie}`}
          detailLabel="proficiências da classe"
        >
          <ChipDetail label="Armas">{classData.weaponProficiency}</ChipDetail>
          <ChipDetail label="Armaduras">{classData.armorProficiency}</ChipDetail>
        </DetailChip>

        {ancestry && (
          <DetailChip label={ancestry.name} detailLabel="talentos e idiomas da ancestralidade">
            {ancestry.traits.map(trait => (
              <ChipDetail key={trait.name} label={trait.name}>
                {trait.description}
              </ChipDetail>
            ))}
            <ChipDetail label="Idiomas">
              {languages.length > 0 ? languages.join(', ') : 'Nenhum idioma registrado.'}
            </ChipDetail>
          </DetailChip>
        )}
      </div>

      {/* Techniques */}
      {activeTechniques.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionSubheading className="mb-3">Técnicas</SectionSubheading>
          <div className="grid-6-cards">
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
