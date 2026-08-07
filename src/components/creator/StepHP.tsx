'use client'

import { useState } from 'react'
import { modifier, modifierStr } from '@/lib/dice'
import { getClass } from '@/data/classes/index'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'

interface Props {
  classId: string
  con: number
  hpMax: number
  onRoll: (hp: number) => void
  editMode?: boolean
}

const CAPTION_CLASS =
  'font-heading block text-[8px] tracking-[0.18em] text-[var(--candle-amber)]/70 uppercase'

export function StepHP({ classId, con, hpMax, onRoll, editMode }: Props) {
  const cls = getClass(classId)
  const conMod = modifier(con)
  const [rolling, setRolling] = useState(false)
  const [rawRoll, setRawRoll] = useState<number | null>(null)

  function rollHP() {
    if (!cls) return
    setRolling(true)
    setTimeout(() => {
      const roll = Math.floor(Math.random() * cls.hitDie) + 1
      const hp = Math.max(1, roll + conMod)
      setRawRoll(roll)
      onRoll(hp)
      setRolling(false)
    }, 240)
  }

  return (
    <div className="flex flex-col items-center gap-5">
      {cls && (
        <Item
          variant="outline"
          className="w-full justify-between rounded-sm border-[var(--border)] bg-[var(--card)] px-4.5 py-3.5"
        >
          <ItemContent className="gap-1">
            <ItemDescription className={CAPTION_CLASS}>Dado de Vida</ItemDescription>
            <ItemTitle className="font-heading text-[22px] tracking-[0.04em] text-[var(--parchment-pale)]">
              d{cls.hitDie}
            </ItemTitle>
          </ItemContent>
          <ItemContent className="items-end gap-1 text-right">
            <ItemDescription className={CAPTION_CLASS}>Mod. CON</ItemDescription>
            <ItemTitle
              className={cn(
                'font-heading text-[22px]',
                conMod >= 0 ? 'text-[var(--verdigris-light)]' : 'text-[var(--destructive)]',
              )}
            >
              {modifierStr(con)}
            </ItemTitle>
          </ItemContent>
        </Item>
      )}

      <Button
        onClick={rollHP}
        disabled={rolling || !cls}
        variant="outline"
        className={cn(
          'h-auto w-full rounded-sm px-5 py-3.5 text-[11px] tracking-[0.18em] transition-all duration-200',
          rolling
            ? 'text-muted-foreground cursor-wait border-[var(--destructive)] bg-[var(--destructive)]/15'
            : 'border-[var(--destructive)] bg-[var(--destructive)]/15 text-[var(--blood-bright)]',
        )}
      >
        {rolling ? '⟳ Rolando...' : hpMax > 0 ? '⟳ Rolar novamente' : '✦ Rolar HP Inicial'}
      </Button>

      {editMode && (
        <Field className="w-full items-center gap-2">
          <FieldLabel
            htmlFor="hp-max"
            className="font-heading text-[8px] tracking-[0.22em] text-[var(--destructive)]/70 uppercase"
          >
            HP Máximo
          </FieldLabel>
          <Input
            id="hp-max"
            type="number"
            value={hpMax || ''}
            min={1}
            max={999}
            onChange={e => {
              const n = parseInt(e.target.value)
              onRoll(isNaN(n) ? 1 : Math.min(999, Math.max(1, n)))
            }}
            className="font-heading h-auto w-[120px] rounded-sm border-[var(--destructive)] bg-[var(--ink-deep)] px-3 py-2 text-center text-5xl font-bold text-[var(--parchment-pale)] [-moz-appearance:textfield]"
          />
        </Field>
      )}

      {!editMode && hpMax > 0 && rawRoll !== null && (
        <div className="flex w-full flex-col items-center gap-2 rounded-sm border border-[var(--destructive)] bg-[var(--destructive)]/15 px-4 py-6">
          <span className="font-heading text-[8px] tracking-[0.22em] text-[var(--destructive)]/70 uppercase">
            HP Máximo
          </span>
          <span className="font-heading text-[64px] leading-none font-bold text-[var(--parchment-pale)]">
            {hpMax}
          </span>
          <span className="text-muted-foreground text-[11px] italic">
            {rawRoll} (d{cls?.hitDie}) {conMod >= 0 ? '+' : ''}{conMod} (CON)
            {hpMax < rawRoll + conMod ? ' → mínimo 1' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
