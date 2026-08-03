'use client'

import { useState } from 'react'
import { rollStats, modifier, modifierStr } from '@/lib/dice'
import { canReroll } from '@/lib/reroll'
import type { Stat } from '@/types/class.types'
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

interface Props {
  stats: Record<Stat, number>
  onChange: (stats: Record<Stat, number>) => void
  editMode?: boolean
}

export function StepStats({ stats, onChange, editMode }: Props) {
  const [rolling, setRolling] = useState(false)
  const statValues = STAT_KEYS.map(k => stats[k])
  const allSet = statValues.every(v => v > 0)
  const eligible = allSet && canReroll(statValues)

  function handleRoll() {
    setRolling(true)
    setTimeout(() => {
      onChange(rollStats() as Record<Stat, number>)
      setRolling(false)
    }, 180)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Roll button */}
      <Button
        onClick={handleRoll}
        disabled={rolling}
        variant="outline"
        className={cn(
          'h-auto w-full rounded-sm px-5 py-3.5 text-[11px] tracking-[0.18em] transition-all duration-200',
          rolling
            ? 'text-muted-foreground cursor-wait border-[rgba(139,112,48,0.2)] bg-[rgba(139,112,48,0.06)]'
            : 'border-[rgba(196,120,42,0.45)] bg-[rgba(139,112,48,0.14)] text-[var(--parchment-light)] shadow-[0_0_12px_rgba(196,120,42,0.1)]',
        )}
      >
        {rolling ? '⟳ Rolando os dados...' : allSet ? '⟳ Rolar novamente' : '✦ Rolar 3d6 por atributo'}
      </Button>

      {editMode && (
        <div className="grid-stats gap-1.5">
          {STAT_KEYS.map(key => {
            const val = stats[key]
            const mod = Math.floor((val - 10) / 2)
            return (
              <div
                key={key}
                className="rounded-sm border border-[rgba(139,112,48,0.2)] bg-[rgba(20,14,6,0.5)] px-1 py-2.5 text-center"
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
                  className="font-mono h-auto rounded-[1px] border-[rgba(139,112,48,0.28)] bg-[var(--ink-deep)] px-0.5 py-[3px] text-center text-sm font-bold text-[var(--parchment-light)] [-moz-appearance:textfield]"
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
        <Alert className="rounded-[1px] border-[rgba(196,120,42,0.2)] bg-[rgba(196,120,42,0.06)] px-3 py-2">
          <AlertDescription className="text-center text-[11px] text-[var(--candle-amber)] italic">
            Nenhum atributo excede 14 — o destino permite um novo lançamento.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats grid */}
      {allSet && (
        <div className="grid grid-cols-3 gap-2">
          {STAT_KEYS.map(key => {
            const val = stats[key]
            const mod = modifier(val)
            const modStr = modifierStr(val)
            const isHigh = val >= 16
            const isLow = val <= 6

            return (
              <div
                key={key}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-sm border bg-[rgba(20,14,6,0.5)] px-2.5 py-3.5',
                  isHigh
                    ? 'border-[rgba(61,112,96,0.4)]'
                    : isLow
                      ? 'border-[rgba(139,21,21,0.35)]'
                      : 'border-[rgba(139,112,48,0.2)]',
                )}
              >
                <span className={STAT_CAPTION_CLASS}>{STAT_META[key].label}</span>
                <span
                  className={cn(
                    'font-heading text-[30px] leading-none font-bold',
                    isHigh
                      ? 'text-[var(--verdigris-light)]'
                      : isLow
                        ? 'text-[var(--blood-mid)]'
                        : 'text-[var(--parchment-light)]',
                  )}
                >
                  {val}
                </span>
                <span
                  className={cn(
                    'font-mono text-[11px]',
                    mod > 0
                      ? 'text-[var(--verdigris-light)]'
                      : mod < 0
                        ? 'text-[var(--blood-mid)]'
                        : 'text-muted-foreground',
                  )}
                >
                  {modStr}
                </span>
                <span className="text-muted-foreground mt-0.5 text-[9px] opacity-60 italic">
                  {STAT_META[key].full}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {allSet && (
        <p className="text-muted-foreground text-center text-[10px] opacity-60 italic">
          Regra Shadowdark: 3d6 por atributo, em ordem. Sem modificações.
        </p>
      )}
    </div>
  )
}
