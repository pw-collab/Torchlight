'use client'

import { useState } from 'react'
import type { Talent, TalentOrigin } from '@/types/talent.types'
import type { LevelEntry } from '@/types/progression.types'
import type { RollResult } from '@/lib/dice'
import { DETAIL_BODY } from '@/components/shared/GlyphCard'
import { ORIGIN_LABEL } from '@/components/shared/CardOrigin'
import { RollableText } from '@/components/shared/RollableText'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const FIELD_LABEL_CLASS =
  'font-heading mb-1 text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase'
const FIELD_INPUT_CLASS =
  'bg-secondary text-secondary-foreground h-auto px-2.5 py-2 text-[13px]'

/** The 19px square every row leads with — the level, or the add mark. */
const BADGE_CLASS =
  'font-heading flex size-[19px] shrink-0 items-center justify-center text-base leading-[1.2] font-bold text-[var(--chart-1)]'

/** The row's text: small italic, as the design sets the talent's effect. */
const ROW_TEXT_CLASS =
  'font-body min-w-0 flex-1 text-left text-[10px] leading-[1.2] text-[var(--foreground)] italic'

/**
 * The level a talent was gained at. Its own field when it has one; otherwise
 * the progression track's record of the roll that produced it.
 */
export function talentLevel(talent: Talent, levelProgress: LevelEntry[]): number | undefined {
  return talent.level ?? levelProgress.find(e => e.talentId === talent.id)?.level
}

interface Props {
  talents: Talent[]
  /** Matches rolled talents back to the level that gave them. */
  levelProgress: LevelEntry[]
  /** What the add form offers as the level, before anyone changes it. */
  currentLevel: number
  onUpdate: (talents: Talent[]) => void
  onRoll?: (r: RollResult) => void
}

/**
 * The talent list — the Atributos panel's last column.
 *
 * One row per talent: the level it came at, then its effect. Rolls on the
 * progression track land here on their own; anything the table hands out
 * besides (a reward, a boon) goes in through "Adicionar". A row opens its
 * detail beside the list, with the edit and delete actions.
 */
export function TalentsPanel({ talents, levelProgress, currentLevel, onUpdate, onRoll }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(currentLevel))

  const invalid = !form.name.trim() || !form.description.trim()

  // In the order they were earned; a talent with no level on record goes last.
  const rows = talents
    .map((talent, index) => ({ talent, index, level: talentLevel(talent, levelProgress) }))
    .sort((a, b) => (a.level ?? Infinity) - (b.level ?? Infinity) || a.index - b.index)

  function openForm() {
    setForm(emptyForm(currentLevel))
    setFormOpen(true)
  }

  function closeForm() {
    setForm(emptyForm(currentLevel))
    setEditingId(null)
    setFormOpen(false)
  }

  function submitForm() {
    if (invalid) return
    const level = parseLevel(form.level)
    if (editingId) {
      onUpdate(talents.map(t => t.id === editingId
        ? { ...t, name: form.name, origin: form.origin, description: form.description, level }
        : t,
      ))
    } else {
      onUpdate([...talents, {
        id: Math.random().toString(36).substring(2, 9),
        name: form.name,
        origin: form.origin,
        description: form.description,
        level,
      }])
    }
    closeForm()
  }

  function startEdit(t: Talent) {
    const level = talentLevel(t, levelProgress)
    setForm({ name: t.name, origin: t.origin, description: t.description, level: level != null ? String(level) : '' })
    setEditingId(t.id)
    setFormOpen(true)
    setOpenId(null)
  }

  function removeTalent(id: string) {
    if (id === editingId) closeForm()
    if (id === openId) setOpenId(null)
    onUpdate(talents.filter(t => t.id !== id))
  }

  return (
    <section className="attr-panel__talents" aria-label="Talentos">
      <h2 className="font-heading text-card-foreground m-0 text-lg leading-[17px] font-semibold">
        Talentos
      </h2>

      <div className="flex flex-col gap-1.5">
        {rows.map(({ talent, level }) => (
          <Popover
            key={talent.id}
            open={openId === talent.id}
            onOpenChange={open => setOpenId(open ? talent.id : null)}
          >
            <PopoverTrigger
              title={talent.name}
              className={cn(
                'flex w-full cursor-pointer items-start gap-2.5 border border-transparent p-1.5 outline-none',
                'hover:border-input data-popup-open:border-input transition-colors',
                'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              )}
            >
              <span className={cn(BADGE_CLASS, 'bg-input')}>{level ?? '✦'}</span>
              <span className={ROW_TEXT_CLASS}>{talent.name}</span>
            </PopoverTrigger>

            <PopoverContent
              side="left"
              align="start"
              sideOffset={12}
              className="w-[280px] gap-0 border border-[var(--border)] border-t-2 border-t-[var(--chart-1)] bg-[var(--background)] p-0"
            >
              <div className="flex flex-col gap-1 border-b border-[var(--border)] px-3 py-2.5">
                <span className="font-heading text-[13px] leading-tight text-[var(--foreground)]">
                  {talent.name}
                </span>
                <span className="font-heading text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
                  {ORIGIN_LABEL[talent.origin]}{level != null && ` · nível ${level}`}
                </span>
              </div>
              <div className="border-b border-[var(--border)] px-3 py-2.5">
                <p style={{ ...DETAIL_BODY, fontSize: 13 }}>
                  <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
                </p>
              </div>
              <div className="flex gap-2 px-3 py-2.5">
                <Button variant="secondary" className="tactile flex-1" onClick={() => startEdit(talent)}>
                  ✎ Editar
                </Button>
                <Button variant="hollow" className="tactile flex-1" onClick={() => removeTalent(talent.id)}>
                  ✕ Excluir
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ))}

        <button
          type="button"
          onClick={() => (formOpen ? closeForm() : openForm())}
          aria-expanded={formOpen}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2.5 border border-transparent p-1.5 outline-none',
            'hover:border-input transition-colors',
            'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          )}
        >
          <span className={cn(BADGE_CLASS, 'border-input border')} aria-hidden>
            {formOpen ? '✕' : '+'}
          </span>
          <span className={ROW_TEXT_CLASS}>{formOpen ? 'Fechar' : 'Adicionar'}</span>
        </button>
      </div>

      {talents.length === 0 && !formOpen && (
        <p className="font-body m-0 text-[11px] leading-snug text-[var(--muted-foreground)] italic">
          Os talentos ganhos em jogo ficam aqui: rolagens de nível e concessões do mestre.
          Os de ancestralidade e arquétipo já constam entre as técnicas.
        </p>
      )}

      {/* Add / edit form — stacked, since the column is narrow */}
      {formOpen && (
        <div className="animate-ink-spread bg-secondary border-border flex flex-col gap-2.5 border p-3">
          <Field>
            <FieldLabel htmlFor="talent-name" className={FIELD_LABEL_CLASS}>Nome</FieldLabel>
            <Input
              id="talent-name"
              type="text"
              value={form.name}
              placeholder="ex.: Visão nas Trevas"
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={FIELD_INPUT_CLASS}
            />
          </Field>

          <div className="flex gap-2">
            <Field className="min-w-0 flex-1">
              <FieldLabel htmlFor="talent-origin" className={FIELD_LABEL_CLASS}>Origem</FieldLabel>
              <Select
                value={form.origin}
                onValueChange={value => setForm(f => ({ ...f, origin: value as TalentOrigin }))}
              >
                <SelectTrigger id="talent-origin" className={cn(FIELD_INPUT_CLASS, 'w-full')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['ancestry', 'class', 'general'] as TalentOrigin[]).map(origin => (
                    <SelectItem key={origin} value={origin}>{ORIGIN_LABEL[origin]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="w-16 shrink-0">
              <FieldLabel htmlFor="talent-level" className={FIELD_LABEL_CLASS}>Nível</FieldLabel>
              <Input
                id="talent-level"
                type="text"
                inputMode="numeric"
                value={form.level}
                placeholder="—"
                onChange={e => {
                  const next = e.target.value.replace(/\D/g, '').slice(0, 2)
                  setForm(f => ({ ...f, level: next }))
                }}
                className={cn(FIELD_INPUT_CLASS, 'text-center')}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="talent-desc" className={FIELD_LABEL_CLASS}>Descrição</FieldLabel>
            <Input
              id="talent-desc"
              type="text"
              value={form.description}
              placeholder="O que este talento faz?"
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={FIELD_INPUT_CLASS}
            />
          </Field>

          <Button onClick={submitForm} disabled={invalid} className="tactile w-full">
            {editingId ? '✦ Salvar' : '✦ Registrar'}
          </Button>
        </div>
      )}
    </section>
  )
}

function emptyForm(level: number) {
  return { name: '', origin: 'general' as TalentOrigin, description: '', level: String(level) }
}

/** The form keeps the level as typed; anything that isn't a level is no level. */
function parseLevel(value: string): number | undefined {
  const level = parseInt(value, 10)
  return Number.isFinite(level) && level > 0 ? level : undefined
}
