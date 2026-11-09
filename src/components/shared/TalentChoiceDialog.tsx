'use client'

import { useState } from 'react'
import type { Stat, TalentTableEntry } from '@/types/class.types'
import type { TalentChoice } from '@/types/talent.types'
import { STAT_FULL, STAT_KEYS } from '@/data/stats'
import { effectLabel, pickableRows, resolveChoice } from '@/lib/talents'
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
import { cn } from '@/lib/utils'

const LABEL_CLASS =
  'font-mono font-semibold text-[9px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The table row the talent came from. */
  row: TalentTableEntry
  /** The whole class table, for rows that let the player take another row. */
  table: TalentTableEntry[]
  /** The answer already on the talent, when the choice is being changed. */
  initial?: TalentChoice
  onConfirm: (choice: TalentChoice) => void
}

/**
 * Where a talent's choice is made: which attribute gets the +2, how the points
 * are split, which weapon type the mastery covers, or which other row of the
 * table a "choose a talent" result becomes. Confirming hands back the choice;
 * turning it into numbers on the sheet is `chooseTalent`'s job.
 */
export function TalentChoiceDialog({ open, onOpenChange, row, table, initial, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <ChoiceBody
          key={`${row.roll}:${JSON.stringify(initial ?? null)}`}
          row={row}
          table={table}
          initial={initial}
          onCancel={() => onOpenChange(false)}
          onConfirm={choice => {
            onConfirm(choice)
            onOpenChange(false)
          }}
        />
      )}
    </Dialog>
  )
}

function firstChoice(row: TalentTableEntry): TalentChoice {
  const options = row.options ?? []
  return { optionId: options.length === 1 ? options[0].id : '' }
}

function ChoiceBody({
  row,
  table,
  initial,
  onCancel,
  onConfirm,
}: {
  row: TalentTableEntry
  table: TalentTableEntry[]
  initial?: TalentChoice
  onCancel: () => void
  onConfirm: (choice: TalentChoice) => void
}) {
  const [choice, setChoice] = useState<TalentChoice>(initial ?? firstChoice(row))
  const resolved = resolveChoice(row, table, choice)

  return (
    <DialogContent
      className="worn-border flex max-h-[88vh] w-[calc(100%-32px)] max-w-[440px] flex-col gap-3.5 overflow-y-auto border-t-2 border-t-[var(--chart-1)] bg-[var(--card)] px-5 py-5"
    >
      <DialogHeader className="gap-1.5 border-b border-[var(--border)] pb-3 pr-8">
        <DialogTitle className="font-mono font-semibold text-[11px] tracking-[0.18em] text-[var(--foreground)] uppercase">
          ✦ Escolha do talento
        </DialogTitle>
        <DialogDescription className="font-body text-[13px] leading-snug text-[var(--foreground)] italic">
          <span className="font-mono mr-1.5 text-[10px] not-italic text-[var(--muted-foreground)]">{row.roll}</span>
          {row.effect}
        </DialogDescription>
      </DialogHeader>

      <OptionPicker row={row} table={table} value={choice} onChange={setChoice} />

      {/* What the choice comes to, before it lands on the sheet */}
      <div className="flex min-h-[42px] flex-col gap-1 border-t border-[var(--border)] pt-3">
        <span className={LABEL_CLASS}>Resultado</span>
        {resolved ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-body text-[13px] text-[var(--foreground)]">{resolved.label}</span>
            {resolved.effects.map((effect, i) => (
              <EffectChip key={i} label={effectLabel(effect)} />
            ))}
            {resolved.effects.length === 0 && (
              <span className="font-mono text-[9px] text-[var(--muted-foreground)]">sem bônus numérico</span>
            )}
          </div>
        ) : (
          <span className="font-body text-[12px] text-[var(--muted-foreground)] italic">
            Complete a escolha para continuar.
          </span>
        )}
      </div>

      <DialogFooter className="flex-row gap-2 sm:justify-stretch">
        <Button
          onClick={() => resolved && onConfirm(choice)}
          disabled={!resolved}
          className="tactile flex-[2]"
        >
          ✦ Confirmar
        </Button>
        <Button variant="hollow" onClick={onCancel} className="tactile flex-1">
          Depois
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function EffectChip({ label }: { label: string }) {
  return (
    <span className="font-mono border border-[var(--chart-1)] bg-[var(--chart-2)]/15 px-1.5 py-px text-[9px] font-semibold tracking-[0.06em] text-[var(--foreground)]">
      {label}
    </span>
  )
}

/**
 * The options of one row, and whatever the picked option asks for. A "choose
 * a talent" option opens the table's other rows, each with its own options,
 * so this nests once.
 */
function OptionPicker({
  row,
  table,
  value,
  onChange,
  nested = false,
}: {
  row: TalentTableEntry
  table: TalentTableEntry[]
  value: TalentChoice
  onChange: (choice: TalentChoice) => void
  nested?: boolean
}) {
  const options = row.options ?? []
  const selected = options.find(o => o.id === value.optionId)

  return (
    <div className="flex flex-col gap-2.5">
      {options.length > 1 && (
        <div role="radiogroup" aria-label="Opções do talento" className="flex flex-col gap-1.5">
          {options.map(option => (
            <ChoiceButton
              key={option.id}
              selected={option.id === value.optionId}
              onClick={() => onChange({ optionId: option.id })}
            >
              {option.label}
            </ChoiceButton>
          ))}
        </div>
      )}

      {selected?.distribute && (
        <PointSplitter
          points={selected.distribute.points}
          stats={selected.distribute.stats ?? STAT_KEYS}
          value={value.points ?? {}}
          onChange={points => onChange({ ...value, points })}
        />
      )}

      {selected?.note && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`talent-note-${row.roll}`} className={LABEL_CLASS}>
            {selected.note.prompt}
          </label>
          <Input
            id={`talent-note-${row.roll}`}
            type="text"
            value={value.note ?? ''}
            placeholder={selected.note.placeholder}
            onChange={e => onChange({ ...value, note: e.target.value })}
            className="bg-secondary text-secondary-foreground h-auto px-2.5 py-2 text-[13px]"
          />
        </div>
      )}

      {selected?.fromTable && !nested && (
        <TableRowPicker
          table={table}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  )
}

function TableRowPicker({
  table,
  value,
  onChange,
}: {
  table: TalentTableEntry[]
  value: TalentChoice
  onChange: (choice: TalentChoice) => void
}) {
  const rows = pickableRows(table)
  const picked = rows.find(r => r.roll === value.row)
  const innerOptions = picked?.options ?? []

  return (
    <div className="flex flex-col gap-2 border-l-2 border-[var(--border)] pl-3">
      <span className={LABEL_CLASS}>Qual talento da tabela?</span>
      <div role="radiogroup" aria-label="Talentos da tabela" className="flex flex-col gap-1.5">
        {rows.map(r => (
          <ChoiceButton
            key={r.roll}
            selected={r.roll === value.row}
            onClick={() => {
              const opts = r.options ?? []
              onChange({
                optionId: value.optionId,
                row: r.roll,
                ...(opts.length === 1 && { rowOptionId: opts[0].id }),
              })
            }}
          >
            <span className="font-mono mr-1.5 text-[10px] text-[var(--muted-foreground)]">{r.roll}</span>
            {r.effect}
          </ChoiceButton>
        ))}
      </div>

      {picked && innerOptions.length > 0 && (
        <OptionPicker
          nested
          row={picked}
          table={table}
          value={{
            optionId: value.rowOptionId ?? '',
            points: value.points,
            note: value.note,
          }}
          onChange={inner => onChange({
            optionId: value.optionId,
            row: value.row,
            rowOptionId: inner.optionId,
            points: inner.points,
            note: inner.note,
          })}
        />
      )}
    </div>
  )
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        'font-body flex w-full cursor-pointer items-start gap-2 border px-2.5 py-2 text-left text-[12.5px] leading-snug outline-none',
        'focus-visible:ring-ring/50 transition-colors focus-visible:ring-[3px]',
        selected
          ? 'border-[var(--chart-1)] bg-[var(--chart-2)]/15 text-[var(--foreground)]'
          : 'border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)] hover:text-[var(--foreground)]',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-[3px] size-2.5 shrink-0 rounded-full border',
          selected ? 'border-[var(--chart-1)] bg-[var(--chart-1)]' : 'border-[var(--muted-foreground)]',
        )}
      />
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

function PointSplitter({
  points,
  stats,
  value,
  onChange,
}: {
  points: number
  stats: Stat[]
  value: Partial<Record<Stat, number>>
  onChange: (points: Partial<Record<Stat, number>>) => void
}) {
  const spent = stats.reduce((sum, s) => sum + (value[s] ?? 0), 0)
  const left = points - spent

  function bump(stat: Stat, delta: number) {
    const current = value[stat] ?? 0
    const next = current + delta
    if (next < 0 || (delta > 0 && left <= 0)) return
    const out = { ...value, [stat]: next }
    if (next === 0) delete out[stat]
    onChange(out)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className={LABEL_CLASS}>Distribua os pontos</span>
        <span className={cn('font-mono text-[11px] font-semibold', left === 0 ? 'text-[var(--chart-1)]' : 'text-[var(--foreground)]')}>
          {left} restante{left === 1 ? '' : 's'}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {stats.map(stat => {
          const n = value[stat] ?? 0
          return (
            <div
              key={stat}
              className={cn(
                'flex items-center justify-between gap-1 border px-2 py-1',
                n > 0 ? 'border-[var(--chart-1)]' : 'border-[var(--border)]',
              )}
            >
              <span className="font-mono truncate text-[10px] text-[var(--foreground)]">{STAT_FULL[stat]}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => bump(stat, -1)}
                  disabled={n === 0}
                  aria-label={`Tirar um ponto de ${STAT_FULL[stat]}`}
                >
                  −
                </Button>
                <span className="font-mono w-5 text-center text-[11px] font-semibold">+{n}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => bump(stat, 1)}
                  disabled={left <= 0}
                  aria-label={`Dar um ponto a ${STAT_FULL[stat]}`}
                >
                  +
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

