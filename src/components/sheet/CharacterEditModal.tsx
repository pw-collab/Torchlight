'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Character, CharacterRow } from '@/types/character.types'
import type { Stat } from '@/types/class.types'
import type { Class } from '@/types/class.types'
import type { Talent } from '@/types/talent.types'
import { rollClassTalent } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getDomain } from '@/data/domains/index'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

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

const INPUT_CLASS =
  'h-auto w-full rounded-[1px] border-[var(--border)] bg-[var(--ink-deep)] px-[7px] py-[5px] text-[11px] text-[var(--parchment-light)]'

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
      borderBottom: '1px solid var(--border)',
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

  // ── Language state ──────────────────────────────────────────────────────────
  const [localLanguages, setLocalLanguages] = useState<string[]>(() => character.languages)
  const [langInput, setLangInput] = useState('')

  // Resolve ancestry domain pool for the picker (derived, not state)
  const ancestryData = getAncestry(character.ancestryId)
  const anyDomain = ancestryData?.domainOptions?.includes('*') ?? false
  const domainId = anyDomain ? undefined : ancestryData?.domainOptions?.[0]
  const domain = domainId ? getDomain(domainId) : undefined
  const domainPool = domain?.languages ?? []

  function addLang(lang: string) {
    const trimmed = lang.trim()
    if (!trimmed || localLanguages.includes(trimmed)) return
    setLocalLanguages(prev => [...prev, trimmed])
  }

  function removeLang(lang: string) {
    setLocalLanguages(prev => prev.filter(l => l !== lang))
  }

  function addLangFromInput() {
    addLang(langInput)
    setLangInput('')
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
      languages: localLanguages,
    } as Partial<CharacterRow>)
    setSaving(false)
  }

  const valid = isValid(form)

  return (
    <Dialog open onOpenChange={open => { if (!open) handleClose() }}>
      <DialogContent
        showCloseButton={false}
        className="worn-border flex max-h-[88vh] w-full max-w-[560px] flex-col gap-3.5 overflow-y-auto border-t-2 border-t-[var(--border)] bg-[var(--card)] px-6 py-5.5"
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <DialogHeader className="flex-row items-center justify-between border-b border-[var(--border)] pb-3.5">
          <DialogTitle className="font-heading text-[11px] tracking-[0.18em] text-[var(--parchment-light)] uppercase">
            ✦ Editar Personagem
          </DialogTitle>
          <DialogDescription className="sr-only">
            Ajuste nome, nível, vitalidade, atributos, talentos e idiomas do personagem.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            aria-label="Fechar"
            className="text-muted-foreground text-sm leading-none hover:bg-transparent"
          >
            ✕
          </Button>
        </DialogHeader>

        {/* ── Identity ────────────────────────────────────────────────── */}
        <div>
          <SectionDivider>✦ Identidade</SectionDivider>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
            <div>
              <FieldLabel>Nome</FieldLabel>
              <Input
                type="text"
                value={form.name}
                onChange={e => set({ name: e.target.value })}
                aria-label="Nome"
                className={INPUT_CLASS}
                maxLength={60}
              />
            </div>
            <div>
              <FieldLabel>Nível (1–10)</FieldLabel>
              <Input
                type="number"
                value={form.level}
                min={1} max={10}
                onChange={numField('level', 1, 10)}
                aria-label="Nível"
                className={cn(INPUT_CLASS, '[-moz-appearance:textfield]')}
              />
            </div>
          </div>
        </div>

        {/* ── Combat ──────────────────────────────────────────────────── */}
        <div>
          <SectionDivider>⚔ Combate</SectionDivider>
          <div style={{ maxWidth: 180 }}>
            <FieldLabel>HP Máximo</FieldLabel>
            <Input
              type="number"
              value={form.hpMax}
              min={1} max={999}
              onChange={numField('hpMax', 1, 999)}
              aria-label="HP máximo"
              className={cn(INPUT_CLASS, '[-moz-appearance:textfield]')}
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
                  background: 'var(--card), var(--parchment-mid)',
                  border: '1px solid var(--border)',
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
                <Input
                  type="number"
                  value={form[key]}
                  min={1} max={20}
                  onChange={numField(key, 1, 20)}
                  aria-label={STAT_LABELS[key]}
                  className="font-mono h-auto w-full rounded-[1px] border-[var(--border)] bg-[var(--ink-deep)] px-0.5 py-[3px] text-center text-[13px] font-bold text-[var(--parchment-light)] [-moz-appearance:textfield]"
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
              <Button
                variant="link"
                onClick={() => setTableOpen(o => !o)}
                className="text-muted-foreground h-auto p-0 text-[7.5px] tracking-[0.12em] no-underline"
              >
                {tableOpen ? '▲ ocultar tabela' : '▼ ver tabela'}
              </Button>
              <Button
                variant="outline"
                onClick={rollAndAdd}
                className="text-foreground h-auto rounded-[1px] border-[var(--primary)] bg-[var(--primary)]/15 px-3 py-[5px] text-[8px] tracking-[0.1em] transition-all duration-[220ms] hover:bg-[var(--primary)]"
              >
                ✦ Rolar 2d6
              </Button>
            </div>

            {/* Collapsible talent table */}
            {tableOpen && (
              <div
                className="animate-ink-spread"
                style={{ border: '1px solid var(--border)', borderRadius: 1, overflow: 'hidden', marginBottom: 10 }}
              >
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr', background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                  {['2D6', 'Efeito'].map((h, i) => (
                    <div key={h} style={{
                      fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em',
                      textTransform: 'uppercase', color: 'var(--bone-muted)', padding: '5px 10px',
                      borderRight: i === 0 ? '1px solid var(--border)' : 'none',
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
                          ? 'var(--primary)'
                          : i % 2 === 0 ? 'var(--card)' : 'var(--card)',
                        borderBottom: i < classData.talentTable.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 200ms',
                      }}
                    >
                      <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                        color: isLastRoll ? 'var(--foreground)' : 'var(--muted-foreground)',
                        padding: '6px 10px', borderRight: '1px solid var(--border)',
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
                  background: 'var(--primary)',
                  border: '1px solid var(--border)',
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
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        padding: '7px 10px',
                        borderRadius: 1,
                      }}
                    >
                      <span style={{
                        fontFamily: 'var(--font-heading)', fontSize: 7,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--candle-amber)',
                        background: 'var(--primary)',
                        border: '1px solid var(--primary)',
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
                            color: 'var(--muted-foreground)', marginTop: 2,
                          }}>
                            {talent.description}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeClassTalent(talent.id)}
                        title="Remover talento"
                        aria-label="Remover talento"
                        className="h-auto w-auto shrink-0 px-0.5 text-[11px] leading-none text-[var(--destructive)] transition-colors duration-[180ms] hover:bg-transparent hover:text-[var(--blood-bright)]"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Languages ───────────────────────────────────────────────── */}
        <div>
          <SectionDivider>✦ Idiomas</SectionDivider>

          {/* Language rules info */}
          {(() => {
            const rules = ancestryData?.languageRules
            if (!rules) return null
            const intVal = Math.floor((form.int - 10) / 2)
            const resolve = (v: number | 'int_mod') =>
              v === 'int_mod' ? Math.max(0, intVal) : v

            const domainN = resolve(rules.domainPicks)
            const freeN = rules.freePicks !== undefined ? resolve(rules.freePicks) : 0
            const domainLabel = anyDomain
              ? 'qualquer domínio'
              : domain?.name ?? 'domínio de origem'

            const parts: string[] = []
            if (domainN > 0) {
              parts.push(`${domainN} idioma${domainN !== 1 ? 's' : ''} de ${domainLabel}`)
            }
            if (freeN > 0) {
              const freeTag = rules.freePicks === 'int_mod' ? ' (mod INT)' : ''
              parts.push(`${freeN} idioma${freeN !== 1 ? 's' : ''} adicional${freeN !== 1 ? 'is' : ''}${freeTag}`)
            }
            if (ancestryData?.fixedLanguages?.length) {
              parts.push(`fixos: ${ancestryData.fixedLanguages.join(', ')}`)
            }

            return (
              <div style={{
                fontFamily: 'var(--font-body)', fontStyle: 'italic',
                fontSize: 9.5, color: 'var(--bone-muted)', marginBottom: 10,
              }}>
                {parts.length > 0
                  ? `Idiomas concedidos: ${parts.join(' · ')}.`
                  : 'Adicione idiomas manualmente.'
                }
              </div>
            )
          })()}

          {/* Current languages — chips with remove */}
          {localLanguages.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {localLanguages.map(lang => (
                <span
                  key={lang}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 2,
                    padding: '3px 7px 3px 9px',
                    fontFamily: 'var(--font-body)',
                    fontSize: 10.5,
                    color: 'var(--parchment-light)',
                  }}
                >
                  {lang}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeLang(lang)}
                    title={`Remover ${lang}`}
                    aria-label={`Remover ${lang}`}
                    className="h-auto w-auto px-px text-[10px] leading-none text-[var(--destructive)] transition-colors duration-[160ms] hover:bg-transparent hover:text-[var(--blood-bright)]"
                  >
                    ✕
                  </Button>
                </span>
              ))}
            </div>
          ) : (
            <p style={{
              fontFamily: 'var(--font-body)', fontStyle: 'italic',
              fontSize: 10.5, color: 'var(--bone-muted)', marginBottom: 10,
            }}>
              Nenhum idioma registrado.
            </p>
          )}

          {/* Domain pool picker */}
          {domainPool.length > 0 && (() => {
            const available = domainPool.filter(l => !localLanguages.includes(l))
            if (available.length === 0) return null
            return (
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: 7,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'var(--bone-muted)', marginBottom: 5,
                }}>
                  Idiomas do domínio {domain?.name}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {available.map(lang => (
                    <Button
                      key={lang}
                      variant="outline"
                      onClick={() => addLang(lang)}
                      className="font-sans text-muted-foreground h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[10px] tracking-normal normal-case transition-all duration-[160ms] hover:border-[var(--border)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
                    >
                      + {lang}
                    </Button>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Free-text add */}
          <div style={{ display: 'flex', gap: 6 }}>
            <Input
              type="text"
              value={langInput}
              onChange={e => setLangInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLangFromInput() } }}
              placeholder="Outro idioma…"
              aria-label="Outro idioma"
              maxLength={40}
              className={cn(INPUT_CLASS, 'flex-1')}
            />
            <Button
              variant="outline"
              onClick={addLangFromInput}
              disabled={!langInput.trim()}
              className={cn(
                'h-auto rounded-[1px] px-3 text-[7.5px] tracking-[0.1em] transition-all duration-200',
                langInput.trim()
                  ? 'text-foreground border-[var(--chart-2)] bg-[var(--chart-2)]/15'
                  : 'text-muted-foreground border-[var(--chart-2)] bg-[var(--chart-2)]/15',
              )}
            >
              ✦ Adicionar
            </Button>
          </div>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <DialogFooter className="mt-1 flex-row gap-2 sm:justify-stretch">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!valid || saving}
            className={cn(
              'h-auto flex-[2] rounded-[1px] py-2.5 text-[9px] tracking-[0.12em] transition-all duration-300',
              valid
                ? 'text-foreground border-[var(--chart-2)] bg-[var(--chart-2)]/15'
                : 'text-muted-foreground border-[var(--chart-2)] bg-[var(--chart-2)]/15',
              saving && 'opacity-60',
            )}
          >
            {saving ? <Spinner /> : '✦ Salvar Alterações'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={saving}
            className="text-muted-foreground h-auto flex-1 rounded-[1px] border-[var(--border)] bg-[var(--card)] py-2.5 text-[9px] tracking-[0.12em] transition-all duration-300"
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
