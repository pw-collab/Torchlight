'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Character, CharacterRow } from '@/types/character.types'
import type { Stat } from '@/types/class.types'
import type { Class } from '@/types/class.types'
import type { Talent } from '@/types/talent.types'
import { rollClassTalent } from '@/data/classes/index'

const STAT_LABELS: Record<Stat, string> = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
}

const STAT_KEYS: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

interface EditForm {
  name: string
  level: number
  hpMax: number
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
}

interface Props {
  character: Character
  classData?: Class
  onSave: (patch: Partial<CharacterRow>) => Promise<void>
  onClose: () => void
}

function statMod(score: number): string {
  const m = Math.floor((score - 10) / 2)
  return m >= 0 ? `+${m}` : `${m}`
}

function isValid(form: EditForm): boolean {
  return (
    form.name.trim().length > 0 &&
    Number.isInteger(form.level) && form.level >= 1 && form.level <= 10 &&
    Number.isInteger(form.hpMax) && form.hpMax >= 1 && form.hpMax <= 999 &&
    STAT_KEYS.every(s => {
      const v = form[s]
      return Number.isInteger(v) && v >= 1 && v <= 20
    })
  )
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 7,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: 'var(--bone-muted)',
      marginBottom: 3,
    }}>
      {children}
    </div>
  )
}

function SectionDivider({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 8.5,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: 'var(--bone-muted)',
      paddingBottom: 7,
      borderBottom: '1px solid rgba(139,112,48,0.18)',
      marginBottom: 12,
    }}>
      {children}
    </div>
  )
}

export function CharacterEditModal({ character, classData, onSave, onClose }: Props) {
  const [form, setForm] = useState<EditForm>(() => ({
    name: character.name,
    level: character.level,
    hpMax: character.hpMax,
    str: character.stats.str,
    dex: character.stats.dex,
    con: character.stats.con,
    int: character.stats.int,
    wis: character.stats.wis,
    cha: character.stats.cha,
  }))
  const [saving, setSaving] = useState(false)

  // ── Talent state ────────────────────────────────────────────────────────────
  const [localTalents, setLocalTalents] = useState<Talent[]>(() => character.talents)
  const [lastRoll, setLastRoll] = useState<{
    roll: number; die1: number; die2: number; effect: string
  } | null>(null)
  const [tableOpen, setTableOpen] = useState(false)

  const classTalents = localTalents.filter(t => t.origin === 'class')

  function rollAndAdd() {
    if (!classData) return
    const r = rollClassTalent(classData.id)
    if (!r) return
    const rollInfo = { roll: r.roll, die1: r.die1, die2: r.die2, effect: r.entry.effect }
    setLastRoll(rollInfo)
    const newTalent: Talent = {
      id: Math.random().toString(36).substring(2, 9),
      name: r.entry.effect,
      origin: 'class',
      description: `Talento de classe — 2d6: ${r.roll} (${r.die1}+${r.die2}) — ${classData.name}`,
    }
    setLocalTalents(prev => [...prev, newTalent])
  }

  function removeClassTalent(id: string) {
    setLocalTalents(prev => prev.filter(t => t.id !== id))
  }

  // ── Form helpers ────────────────────────────────────────────────────────────
  const set = (patch: Partial<EditForm>) => setForm(f => ({ ...f, ...patch }))

  const numField = (key: keyof EditForm, min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value)
    set({ [key]: isNaN(v) ? min : Math.min(max, Math.max(min, v)) } as Partial<EditForm>)
  }

  const handleClose = useCallback(() => {
    if (!saving) onClose()
  }, [saving, onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleClose])

  async function handleSave() {
    if (!isValid(form) || saving) return
    setSaving(true)
    await onSave({
      name: form.name.trim(),
      level: form.level,
      hp_max: form.hpMax,
      hp_current: Math.min(character.hpCurrent, form.hpMax),
      str: form.str,
      dex: form.dex,
      con: form.con,
      int: form.int,
      wis: form.wis,
      cha: form.cha,
      talents: localTalents,
    } as Partial<CharacterRow>)
    setSaving(false)
  }

  const valid = isValid(form)

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="worn-border"
        style={{
          background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210',
          border: '1px solid rgba(139,112,48,0.42)',
          borderTop: '2px solid #7A6030',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          minWidth: 460,
          maxWidth: 560,
          width: '100%',
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--parchment-light)',
          }}>
            ✦ Editar Personagem
          </span>
          <button
            onClick={handleClose}
            style={{
              background: 'none', border: 'none',
              color: 'var(--bone-muted)', fontFamily: 'var(--font-heading)',
              fontSize: 14, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ borderBottom: '1px solid rgba(139,112,48,0.22)' }} />

        {/* ── Identity ────────────────────────────────────────────────── */}
        <div>
          <SectionDivider>✦ Identidade</SectionDivider>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <FieldLabel>Nome</FieldLabel>
              <input
                type="text"
                value={form.name}
                onChange={e => set({ name: e.target.value })}
                style={inp}
                maxLength={60}
              />
            </div>
            <div>
              <FieldLabel>Nível (1–10)</FieldLabel>
              <input
                type="number"
                value={form.level}
                min={1} max={10}
                onChange={numField('level', 1, 10)}
                style={{ ...inp, MozAppearance: 'textfield' } as React.CSSProperties}
              />
            </div>
          </div>
        </div>

        {/* ── Combat ──────────────────────────────────────────────────── */}
        <div>
          <SectionDivider>⚔ Combate</SectionDivider>
          <div style={{ maxWidth: 180 }}>
            <FieldLabel>HP Máximo</FieldLabel>
            <input
              type="number"
              value={form.hpMax}
              min={1} max={999}
              onChange={numField('hpMax', 1, 999)}
              style={{ ...inp, MozAppearance: 'textfield' } as React.CSSProperties}
            />
            {form.hpMax < character.hpCurrent && (
              <div style={{
                fontFamily: 'var(--font-body)', fontStyle: 'italic',
                fontSize: 9.5, color: 'var(--candle-amber)', marginTop: 4,
              }}>
                ⚠ PV atual ({character.hpCurrent}) será reduzido para {form.hpMax}
              </div>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)', marginTop: 8 }}>
            CA é calculada automaticamente pela armadura equipada na aba Inventário.
          </div>
        </div>

        {/* ── Ability Scores ───────────────────────────────────────────── */}
        <div>
          <SectionDivider>✦ Atributos</SectionDivider>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
            {STAT_KEYS.map(key => (
              <div
                key={key}
                style={{
                  background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
                  border: '1px solid rgba(139,112,48,0.22)',
                  borderRadius: 1,
                  padding: '6px 4px',
                  textAlign: 'center',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 6.5,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  color: 'var(--bone-muted)', marginBottom: 4,
                }}>
                  {STAT_LABELS[key]}
                </div>
                <input
                  type="number"
                  value={form[key]}
                  min={1} max={20}
                  onChange={numField(key, 1, 20)}
                  style={{
                    width: '100%', background: 'var(--ink-deep)',
                    border: '1px solid rgba(139,112,48,0.28)',
                    color: 'var(--parchment-light)', fontFamily: 'var(--font-mono)',
                    fontSize: 13, fontWeight: 700, padding: '3px 2px',
                    outline: 'none', borderRadius: 1, textAlign: 'center',
                    boxSizing: 'border-box', MozAppearance: 'textfield',
                  } as React.CSSProperties}
                />
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8.5, marginTop: 3,
                  color: (() => {
                    const m = Math.floor((form[key] - 10) / 2)
                    return m > 0 ? 'var(--verdigris-light)' : m < 0 ? 'var(--blood-bright)' : 'var(--bone-muted)'
                  })(),
                }}>
                  {statMod(form[key])}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Class Talent Table ───────────────────────────────────────── */}
        {classData && (
          <div>
            <SectionDivider>✦ Talentos de Classe — {classData.name}</SectionDivider>

            {/* Roll row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
              <button
                onClick={() => setTableOpen(o => !o)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-heading)', fontSize: 7.5,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--bone-muted)', padding: 0,
                }}
              >
                {tableOpen ? '▲ ocultar tabela' : '▼ ver tabela'}
              </button>
              <button
                onClick={rollAndAdd}
                style={{
                  background: 'rgba(106,58,10,0.3)',
                  border: '1px solid #6B3A0A',
                  color: 'var(--bone-white)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 8,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  borderRadius: 1,
                  transition: 'all 220ms',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(106,58,10,0.55)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(106,58,10,0.3)')}
              >
                ✦ Rolar 2d6
              </button>
            </div>

            {/* Collapsible talent table */}
            {tableOpen && (
              <div
                className="animate-ink-spread"
                style={{ border: '1px solid rgba(139,112,48,0.2)', borderRadius: 1, overflow: 'hidden', marginBottom: 10 }}
              >
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: 'rgba(42,34,16,0.7)', borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
                  {['2D6', 'Efeito'].map((h, i) => (
                    <div key={h} style={{
                      fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: 'var(--bone-muted)', padding: '5px 10px',
                      borderRight: i === 0 ? '1px solid rgba(139,112,48,0.18)' : 'none',
                    }}>
                      {h}
                    </div>
                  ))}
                </div>
                {/* Data rows */}
                {classData.talentTable.map((entry, i) => {
                  const isLastRoll = lastRoll !== null && lastRoll.roll >= entry.min && lastRoll.roll <= entry.max
                  return (
                    <div
                      key={entry.roll}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '48px 1fr',
                        background: isLastRoll
                          ? 'rgba(106,58,10,0.28)'
                          : i % 2 === 0 ? 'rgba(42,34,16,0.22)' : 'rgba(42,34,16,0.08)',
                        borderBottom: i < classData.talentTable.length - 1 ? '1px solid rgba(139,112,48,0.1)' : 'none',
                        transition: 'background 200ms',
                      }}
                    >
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        color: isLastRoll ? 'var(--candle-amber)' : 'var(--bone-muted)',
                        padding: '6px 10px', borderRight: '1px solid rgba(139,112,48,0.18)',
                        display: 'flex', alignItems: 'center',
                      }}>
                        {entry.roll}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5,
                        color: isLastRoll ? 'var(--parchment-light)' : 'var(--bone-muted)',
                        padding: '6px 10px', lineHeight: 1.4,
                      }}>
                        {entry.effect}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Last roll result */}
            {lastRoll && (
              <div
                className="worn-border animate-ink-spread"
                style={{
                  background: 'rgba(106,58,10,0.15)',
                  border: '1px solid rgba(139,112,48,0.35)',
                  padding: '8px 12px',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--candle-amber)', lineHeight: 1 }}>
                    {lastRoll.roll}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'var(--bone-muted)', marginTop: 1 }}>
                    ({lastRoll.die1}+{lastRoll.die2})
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--parchment-light)', lineHeight: 1.5, marginTop: 2 }}>
                    {lastRoll.effect}
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--verdigris-light)', marginTop: 4 }}>
                    ✦ Adicionado aos talentos de classe
                  </p>
                </div>
              </div>
            )}

            {/* Acquired class talents list */}
            <div>
              <div style={{
                fontFamily: 'var(--font-heading)', fontSize: 7.5, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 7,
              }}>
                Talentos adquiridos ({classTalents.length})
              </div>

              {classTalents.length === 0 ? (
                <p style={{
                  fontFamily: 'var(--font-body)', fontStyle: 'italic',
                  fontSize: 11, color: 'var(--bone-muted)',
                }}>
                  Nenhum talento de classe ainda. Use "Rolar 2d6" em cada nível ímpar.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {classTalents.map(talent => (
                    <div
                      key={talent.id}
                      className="worn-border"
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        background: 'rgba(42,34,16,0.35)',
                        border: '1px solid rgba(139,112,48,0.2)',
                        padding: '7px 10px',
                        borderRadius: 1,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-heading)', fontSize: 7,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--candle-amber)',
                        background: 'rgba(196,120,42,0.12)',
                        border: '1px solid rgba(196,120,42,0.25)',
                        padding: '1px 5px', borderRadius: 1, flexShrink: 0, marginTop: 1,
                      }}>
                        Classe
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: 'var(--font-heading)', fontSize: 10.5,
                          color: 'var(--parchment-light)', lineHeight: 1.3,
                        }}>
                          {talent.name}
                        </div>
                        {talent.description && (
                          <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: 8,
                            color: 'rgba(139,112,48,0.5)', marginTop: 2,
                          }}>
                            {talent.description}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeClassTalent(talent.id)}
                        title="Remover talento"
                        style={{
                          background: 'none', border: 'none',
                          cursor: 'pointer', color: 'rgba(139,21,21,0.45)',
                          fontSize: 11, padding: '0 2px', lineHeight: 1,
                          transition: 'color 180ms', flexShrink: 0,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--blood-bright)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(139,21,21,0.45)')}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={!valid || saving}
            style={{
              flex: 2,
              background: valid ? 'rgba(42,80,69,0.35)' : 'rgba(42,80,69,0.15)',
              border: `1px solid ${valid ? '#2A5045' : 'rgba(42,80,69,0.3)'}`,
              color: valid ? 'var(--bone-white)' : 'var(--bone-muted)',
              fontFamily: 'var(--font-heading)', fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '9px 0',
              cursor: valid && !saving ? 'pointer' : 'not-allowed',
              borderRadius: 1, transition: 'all 300ms',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '...' : '✦ Salvar Alterações'}
          </button>
          <button
            onClick={handleClose}
            disabled={saving}
            style={{
              flex: 1,
              background: 'rgba(42,34,16,0.4)',
              border: '1px solid rgba(139,112,48,0.3)',
              color: 'var(--bone-muted)',
              fontFamily: 'var(--font-heading)', fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              padding: '9px 0',
              cursor: saving ? 'not-allowed' : 'pointer',
              borderRadius: 1, transition: 'all 300ms',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
