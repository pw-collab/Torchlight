'use client'

import { useState } from 'react'
import { modifier, modifierStr } from '@/lib/dice'
import { canReroll } from '@/lib/reroll'
import type { Stat } from '@/types/class.types'
import { StepProse } from '@/components/creator/StepSection'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const STAT_META: Record<Stat, { label: string; full: string }> = {
  str: { label: 'FOR', full: 'Força' },
  dex: { label: 'DES', full: 'Destreza' },
  con: { label: 'CON', full: 'Constituição' },
  int: { label: 'INT', full: 'Inteligência' },
  wis: { label: 'SAB', full: 'Sabedoria' },
  cha: { label: 'CAR', full: 'Carisma' },
}

const STAT_KEYS: Stat[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const STAT_CAPTION_CLASS =
  'font-heading text-[8px] tracking-[0.18em] text-[var(--candle-amber)]/70 uppercase'

/** One of the six 3d6 results, and the attribute it was placed on. */
export interface StatRoll {
  id: string
  value: number
  /** The three faces, kept for the receipt line under each result. */
  dice: [number, number, number]
  assignedTo: Stat | null
}

export const EMPTY_STATS: Record<Stat, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }

function d6(): number {
  return Math.floor(Math.random() * 6) + 1
}

export function rollStatSets(): StatRoll[] {
  return Array.from({ length: 6 }, (_, i) => {
    const dice: [number, number, number] = [d6(), d6(), d6()]
    return {
      id: `${Date.now().toString(36)}-${i}`,
      value: dice[0] + dice[1] + dice[2],
      dice,
      assignedTo: null,
    }
  })
}

/** The attribute map implied by an assignment — unplaced attributes read 0. */
export function statsFromRolls(rolls: StatRoll[]): Record<Stat, number> {
  const stats = { ...EMPTY_STATS }
  for (const roll of rolls) {
    if (roll.assignedTo) stats[roll.assignedTo] = roll.value
  }
  return stats
}

interface Props {
  stats: Record<Stat, number>
  onChange: (stats: Record<Stat, number>) => void
  /**
   * Creation mode: the six rolled sets, distributed by the player. Passing
   * `onRollsChange` switches the step from the sheet's manual editor to the
   * roll-and-place flow.
   */
  rolls?: StatRoll[]
  onRollsChange?: (rolls: StatRoll[]) => void
  /** Sheet editing: plain number inputs alongside the roller. */
  editMode?: boolean
}

export function StepStats({ stats, onChange, rolls, onRollsChange, editMode }: Props) {
  const [rolling, setRolling] = useState(false)
  const [picked, setPicked] = useState<string | null>(null)

  const distributing = onRollsChange != null
  const statValues = STAT_KEYS.map(k => stats[k])
  const allSet = statValues.every(v => v > 0)
  const eligible = allSet && canReroll(statValues)

  const rollList = rolls ?? []
  const unplaced = rollList.filter(r => r.assignedTo === null)

  function commit(next: StatRoll[]) {
    onRollsChange?.(next)
    onChange(statsFromRolls(next))
  }

  function handleRoll() {
    setRolling(true)
    setPicked(null)
    setTimeout(() => {
      if (distributing) {
        commit(rollStatSets())
      } else {
        const fresh = rollStatSets()
        onChange(
          STAT_KEYS.reduce((acc, key, i) => ({ ...acc, [key]: fresh[i].value }), {} as Record<Stat, number>),
        )
      }
      setRolling(false)
    }, 180)
  }

  /** Place the picked result on a stat, swapping out whatever sat there. */
  function assign(stat: Stat) {
    const rollId = picked
    if (!rollId) return
    commit(rollList.map(r => {
      if (r.id === rollId) return { ...r, assignedTo: stat }
      if (r.assignedTo === stat) return { ...r, assignedTo: null }
      return r
    }))
    setPicked(null)
  }

  function unassign(stat: Stat) {
    commit(rollList.map(r => (r.assignedTo === stat ? { ...r, assignedTo: null } : r)))
  }

  /** Fill the attributes top-to-bottom with the results still unplaced. */
  function autoDistribute() {
    const queue = rollList.filter(r => r.assignedTo === null)
    const open = STAT_KEYS.filter(k => !rollList.some(r => r.assignedTo === k))
    const placement = new Map(queue.map((r, i) => [r.id, open[i] ?? null]))
    commit(rollList.map(r => (placement.has(r.id) ? { ...r, assignedTo: placement.get(r.id)! } : r)))
    setPicked(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <StepProse>
        Role 3d6 para cada atributo. Você pode distribuir os seis resultados como desejar.
      </StepProse>

      {/* Roll button */}
      <Button
        onClick={handleRoll}
        disabled={rolling}
        variant="outline"
        className={cn(
          'h-auto w-full rounded-sm px-5 py-3.5 text-[11px] tracking-[0.18em] transition-all duration-200',
          rolling
            ? 'text-muted-foreground cursor-wait border-[var(--border)] bg-[var(--border)]/15'
            : 'border-[var(--primary)] bg-[var(--border)] text-[var(--parchment-light)] shadow-[0_0_12px_var(--primary)]',
        )}
      >
        {rolling
          ? '⟳ Rolando os dados...'
          : rollList.length > 0 || allSet
            ? '⟳ Rolar novamente'
            : '✦ Rolar 3d6 seis vezes'}
      </Button>

      {/* Pool of rolled results, waiting to be placed */}
      {distributing && rollList.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className={STAT_CAPTION_CLASS}>
              Resultados a distribuir
              <span className="ml-1.5 text-[var(--gold-oxidized)]">
                {unplaced.length}/{rollList.length}
              </span>
            </span>
            {unplaced.length > 0 && (
              <Button
                variant="link"
                onClick={autoDistribute}
                className="text-muted-foreground h-auto p-0 text-[9px] tracking-[0.12em] no-underline hover:text-[var(--parchment-light)]"
              >
                distribuir em ordem
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {rollList.map(roll => {
              const placed = roll.assignedTo !== null
              const active = picked === roll.id
              return (
                <button
                  key={roll.id}
                  type="button"
                  disabled={placed}
                  aria-pressed={active}
                  onClick={() => setPicked(active ? null : roll.id)}
                  className={cn(
                    'tactile flex min-w-[54px] flex-col items-center gap-0.5 rounded-sm border px-2.5 py-1.5 transition-all duration-150',
                    placed
                      ? 'cursor-default border-[var(--border)] bg-transparent opacity-35'
                      : active
                        ? 'border-[var(--primary)] bg-[var(--border)] shadow-[0_0_12px_color-mix(in_oklch,var(--primary),transparent_60%)]'
                        : 'cursor-pointer border-[var(--border)] bg-[var(--card)] hover:border-[var(--bone-dim)]',
                  )}
                >
                  <span className="font-heading text-[19px] leading-none font-bold text-[var(--parchment-light)]">
                    {roll.value}
                  </span>
                  <span className="font-mono text-muted-foreground text-[7px]">
                    {roll.dice.join('+')}
                  </span>
                </button>
              )
            })}
          </div>

          <p className="text-muted-foreground text-[10px] italic">
            {picked
              ? 'Escolha o atributo que recebe este resultado.'
              : unplaced.length > 0
                ? 'Toque em um resultado e depois no atributo que vai recebê-lo.'
                : 'Todos os resultados foram distribuídos — toque em um atributo para devolvê-lo.'}
          </p>
        </div>
      )}

      {/* Sheet editing — direct number entry */}
      {editMode && (
        <div className="grid-stats gap-1.5">
          {STAT_KEYS.map(key => {
            const val = stats[key]
            const mod = Math.floor((val - 10) / 2)
            return (
              <div
                key={key}
                className="rounded-sm border border-[var(--border)] bg-[var(--card)] px-1 py-2.5 text-center"
              >
                <Label
                  htmlFor={`stat-${key}`}
                  className={cn(STAT_CAPTION_CLASS, 'mb-1 justify-center text-[7px]')}
                >
                  {STAT_META[key].label}
                </Label>
                <Input
                  id={`stat-${key}`}
                  type="number"
                  value={val || ''}
                  min={1}
                  max={20}
                  onChange={e => {
                    const n = parseInt(e.target.value)
                    onChange({ ...stats, [key]: isNaN(n) ? 1 : Math.min(20, Math.max(1, n)) })
                  }}
                  className="font-mono h-auto rounded-[1px] border-[var(--border)] bg-[var(--ink-deep)] px-0.5 py-[3px] text-center text-sm font-bold text-[var(--parchment-light)] [-moz-appearance:textfield]"
                />
                <div
                  className={cn(
                    'font-mono mt-1 text-[8.5px]',
                    mod > 0
                      ? 'text-[var(--verdigris-light)]'
                      : mod < 0
                        ? 'text-[var(--blood-bright)]'
                        : 'text-muted-foreground',
                  )}
                >
                  {mod >= 0 ? `+${mod}` : `${mod}`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {eligible && (
        <Alert className="rounded-[1px] border-[var(--primary)] bg-[var(--primary)]/15 px-3 py-2">
          <AlertDescription className="text-center text-[11px] text-[var(--candle-amber)] italic">
            Nenhum atributo excede 14 — o destino permite um novo lançamento.
          </AlertDescription>
        </Alert>
      )}

      {/* The six attributes */}
      {(distributing || allSet) && (
        <div className="grid grid-cols-3 gap-2">
          {STAT_KEYS.map(key => {
            const val = stats[key]
            const filled = val > 0
            const mod = modifier(val)
            const isHigh = val >= 16
            const isLow = filled && val <= 6
            const awaiting = distributing && !filled

            return (
              <button
                key={key}
                type="button"
                disabled={!distributing}
                onClick={() => (filled ? unassign(key) : assign(key))}
                aria-label={
                  filled
                    ? `${STAT_META[key].full}: ${val} — toque para devolver`
                    : `${STAT_META[key].full}: vazio`
                }
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-sm border bg-[var(--card)] px-2.5 py-3.5 transition-all duration-200',
                  distributing && 'tactile cursor-pointer',
                  awaiting && picked
                    ? 'border-[var(--primary)] shadow-[0_0_12px_color-mix(in_oklch,var(--primary),transparent_65%)]'
                    : awaiting
                      ? 'border-dashed border-[var(--border)]'
                      : isHigh
                        ? 'border-[var(--chart-2)]'
                        : isLow
                          ? 'border-[var(--destructive)]'
                          : 'border-[var(--border)]',
                )}
              >
                <span className={STAT_CAPTION_CLASS}>{STAT_META[key].label}</span>
                <span
                  className={cn(
                    'font-heading text-[30px] leading-none font-bold',
                    !filled
                      ? 'text-[var(--muted-foreground)] opacity-40'
                      : isHigh
                        ? 'text-[var(--verdigris-light)]'
                        : isLow
                          ? 'text-[var(--destructive)]'
                          : 'text-[var(--parchment-light)]',
                  )}
                >
                  {filled ? val : '—'}
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    !filled
                      ? 'text-transparent'
                      : mod > 0
                        ? 'text-[var(--verdigris-light)]'
                        : mod < 0
                          ? 'text-[var(--destructive)]'
                          : 'text-muted-foreground',
                  )}
                >
                  {filled ? modifierStr(val) : '·'}
                </span>
                <span className="text-muted-foreground mt-0.5 text-[9px] opacity-60 italic">
                  {STAT_META[key].full}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {allSet && (
        <p className="text-muted-foreground text-center text-[10px] opacity-60 italic">
          Regra da casa: 3d6 por atributo, distribuídos livremente entre os seis.
        </p>
      )}
    </div>
  )
}
