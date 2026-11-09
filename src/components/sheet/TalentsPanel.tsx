'use client'

import { useState } from 'react'
import type { Talent, TalentChoice, TalentEffectTarget, TalentOrigin } from '@/types/talent.types'
import type { LevelEntry } from '@/types/progression.types'
import type { RollResult } from '@/lib/dice'
import { getClass } from '@/data/classes/index'
import {
  EFFECT_TARGETS,
  chooseTalent,
  effectLabel,
  effectTarget,
  makeEffect,
  rowForTalent,
  rowNeedsChoice,
  targetLabel,
} from '@/lib/talents'
import { EffectChip, TalentChoiceDialog } from '@/components/shared/TalentChoiceDialog'
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
  'font-mono font-semibold mb-1 text-[10px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase'
const FIELD_INPUT_CLASS =
  'bg-secondary text-secondary-foreground h-auto px-2.5 py-2 text-[13px]'

/** The 19px square every row leads with: the level (inked on ember, as the Figma's Talent list item), or the add mark. */
const BADGE_CLASS =
  'font-heading flex size-[19px] shrink-0 items-center justify-center text-base leading-[1.2]'

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
  /** The character's class: rolled talents find their table row through it. */
  classId: string
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
export function TalentsPanel({ classId, talents, levelProgress, currentLevel, onUpdate, onRoll }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [choosingId, setChoosingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm(currentLevel))

  const classData = getClass(classId)
  const invalid = !form.name.trim() || !form.description.trim()
  const choosing = talents.find(t => t.id === choosingId)
  const choosingRow = choosing ? rowForTalent(choosing, classData) : undefined

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
    const effects = formEffects(form.effects)
    if (editingId) {
      onUpdate(talents.map(t => t.id === editingId
        ? { ...t, name: form.name, origin: form.origin, description: form.description, level, effects }
        : t,
      ))
    } else {
      onUpdate([...talents, {
        id: Math.random().toString(36).substring(2, 9),
        name: form.name,
        origin: form.origin,
        description: form.description,
        level,
        effects,
      }])
    }
    closeForm()
  }

  function startChoice(t: Talent) {
    setOpenId(null)
    setChoosingId(t.id)
  }

  function confirmChoice(choice: TalentChoice) {
    if (!choosing || !choosingRow || !classData) return
    const next = chooseTalent(choosing, choosingRow, classData.talentTable, choice)
    if (next) onUpdate(talents.map(t => (t.id === next.id ? next : t)))
  }

  function startEdit(t: Talent) {
    const level = talentLevel(t, levelProgress)
    setForm({
      name: t.name,
      origin: t.origin,
      description: t.description,
      level: level != null ? String(level) : '',
      effects: (t.effects ?? []).map(e => ({ target: effectTarget(e), amount: String(e.amount) })),
    })
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
        {rows.map(({ talent, level }) => {
          const row = rowForTalent(talent, classData)
          const canChoose = rowNeedsChoice(row)
          // Talents from before effects existed added nothing on their own;
          // the player may have added the bonus by hand.
          const legacy = talent.effects === undefined
          return (
          <Popover
            key={talent.id}
            open={openId === talent.id}
            onOpenChange={open => setOpenId(open ? talent.id : null)}
          >
            <PopoverTrigger
              title={talent.name}
              className={cn(
                'flex w-full cursor-pointer items-start gap-2.5 border border-transparent p-1.5 outline-none',
                'hover:border-input-border data-popup-open:border-input-border transition-colors',
                'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
              )}
            >
              <span className={cn(BADGE_CLASS, 'bg-[var(--ember)] text-[var(--ember-foreground)]')}>{level ?? '✦'}</span>
              <span className={ROW_TEXT_CLASS}>
                {talent.name}
                {talent.choiceLabel && (
                  <span className="mt-0.5 block font-semibold not-italic">→ {talent.choiceLabel}</span>
                )}
                {talent.pending && (
                  <span className="font-mono mt-0.5 block text-[8px] font-semibold tracking-[0.12em] text-[var(--primary-text)] uppercase not-italic">
                    ● Escolha pendente
                  </span>
                )}
              </span>
            </PopoverTrigger>

            <PopoverContent
              side="left"
              align="start"
              sideOffset={12}
              className="w-[280px] gap-0 border border-[var(--border)] border-t-2 border-t-[var(--chart-1)] bg-[var(--background)] p-0"
            >
              <div className="flex flex-col gap-1 border-b border-[var(--border)] px-3 py-2.5">
                <span className="font-mono font-semibold text-[13px] leading-tight text-[var(--foreground)]">
                  {talent.name}
                </span>
                <span className="font-mono font-semibold text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
                  {ORIGIN_LABEL[talent.origin]}{level != null && ` · nível ${level}`}
                </span>
              </div>
              <div className="border-b border-[var(--border)] px-3 py-2.5">
                <p style={{ ...DETAIL_BODY, fontSize: 13 }}>
                  <RollableText text={talent.description} label={talent.name} onRoll={onRoll} />
                </p>
              </div>
              {(talent.choiceLabel || (talent.effects?.length ?? 0) > 0 || talent.pending) && (
                <div className="flex flex-col gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
                  <span className="font-mono text-[8px] font-semibold tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
                    {talent.pending ? 'Falta escolher' : 'Aplicado à ficha'}
                  </span>
                  {talent.choiceLabel && (
                    <span className="font-body text-[13px] text-[var(--foreground)]">{talent.choiceLabel}</span>
                  )}
                  {(talent.effects?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {talent.effects!.map((effect, i) => <EffectChip key={i} label={effectLabel(effect)} />)}
                    </div>
                  )}
                  {talent.pending && (
                    <span className="font-body text-[12px] text-[var(--muted-foreground)] italic">
                      Nenhum bônus entra na ficha até a escolha ser feita.
                    </span>
                  )}
                </div>
              )}
              {canChoose && (
                <div className="flex flex-col gap-1.5 border-b border-[var(--border)] px-3 py-2.5">
                  <Button className="tactile w-full" onClick={() => startChoice(talent)}>
                    {talent.pending || legacy ? '✦ Escolher' : '↺ Alterar escolha'}
                  </Button>
                  {legacy && !talent.pending && (
                    <span className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
                      Talento antigo: se o bônus já foi somado à mão, desfaça-o antes, ou ele conta duas vezes.
                    </span>
                  )}
                </div>
              )}
              <div className="flex gap-2 px-3 py-2.5">
                <Button variant="secondary" className="tactile flex-1" onClick={() => startEdit(talent)}>
                  ✎ Editar
                </Button>
                <Button variant="hollow" className="tactile flex-1" onClick={() => removeTalent(talent.id)}>
                  ✕ Excluir
                </Button>
              </div>
              {(talent.effects?.length ?? 0) > 0 && (
                <p className="font-body m-0 px-3 pb-2.5 text-[11px] leading-snug text-[var(--muted-foreground)] italic">
                  Excluir também tira da ficha os bônus acima.
                </p>
              )}
            </PopoverContent>
          </Popover>
          )
        })}

        <button
          type="button"
          onClick={() => (formOpen ? closeForm() : openForm())}
          aria-expanded={formOpen}
          className={cn(
            'flex w-full cursor-pointer items-center gap-2.5 border border-transparent p-1.5 outline-none',
            'hover:border-input-border transition-colors',
            'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          )}
        >
          <span className={cn(BADGE_CLASS, 'border-input-border text-foreground border')} aria-hidden>
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

      {choosing && choosingRow && classData && (
        <TalentChoiceDialog
          open
          onOpenChange={open => { if (!open) setChoosingId(null) }}
          row={choosingRow}
          table={classData.talentTable}
          initial={choosing.choice}
          onConfirm={confirmChoice}
        />
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
                  <SelectValue>{(origin: string) => ORIGIN_LABEL[origin as TalentOrigin]}</SelectValue>
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

          <EffectsEditor
            value={form.effects}
            onChange={effects => setForm(f => ({ ...f, effects }))}
          />

          <Button onClick={submitForm} disabled={invalid} className="tactile w-full">
            {editingId ? '✦ Salvar' : '✦ Registrar'}
          </Button>
        </div>
      )}
    </section>
  )
}

interface EffectDraft {
  target: TalentEffectTarget
  /** As typed, so "-" on the way to "-1" survives. */
  amount: string
}

function emptyForm(level: number) {
  return {
    name: '',
    origin: 'general' as TalentOrigin,
    description: '',
    level: String(level),
    effects: [] as EffectDraft[],
  }
}

/** The drafts that are real numbers, as effects. */
function formEffects(drafts: EffectDraft[]) {
  return drafts
    .map(d => ({ target: d.target, amount: parseInt(d.amount, 10) }))
    .filter(d => Number.isFinite(d.amount) && d.amount !== 0)
    .map(d => makeEffect(d.target, d.amount))
}

/**
 * The bonuses a hand-written talent adds — a boon from the GM, an item's
 * blessing. Whatever is listed here goes onto the sheet with the talent and
 * comes off with it.
 */
function EffectsEditor({ value, onChange }: { value: EffectDraft[]; onChange: (next: EffectDraft[]) => void }) {
  function patch(index: number, next: Partial<EffectDraft>) {
    onChange(value.map((d, i) => (i === index ? { ...d, ...next } : d)))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={FIELD_LABEL_CLASS}>Bônus na ficha</span>
      {value.map((draft, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Select value={draft.target} onValueChange={target => patch(i, { target: target as TalentEffectTarget })}>
            <SelectTrigger aria-label="Onde o bônus entra" className={cn(FIELD_INPUT_CLASS, 'min-w-0 flex-1')}>
              <SelectValue>{(target: string) => targetLabel(target as TalentEffectTarget)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EFFECT_TARGETS.map(target => (
                <SelectItem key={target} value={target}>{targetLabel(target)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            inputMode="numeric"
            aria-label="Valor do bônus"
            value={draft.amount}
            onChange={e => patch(i, { amount: e.target.value.replace(/[^\d-]/g, '').slice(0, 3) })}
            className={cn(FIELD_INPUT_CLASS, 'w-12 shrink-0 text-center')}
          />
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Remover bônus"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
          >
            ✕
          </Button>
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        className="tactile self-start"
        onClick={() => onChange([...value, { target: 'str', amount: '1' }])}
      >
        + Bônus
      </Button>
    </div>
  )
}

/** The form keeps the level as typed; anything that isn't a level is no level. */
function parseLevel(value: string): number | undefined {
  const level = parseInt(value, 10)
  return Number.isFinite(level) && level > 0 ? level : undefined
}
