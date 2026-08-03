'use client'

import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  gold: number
  silver: number
  copper: number
  onUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
}

export function CurrencyPanel({ gold, silver, copper, onUpdate }: Props) {
  const coins = [
    { key: 'gold' as const, label: 'PO', color: 'var(--gold-bright)', value: gold },
    { key: 'silver' as const, label: 'PP', color: 'var(--bone-white)', value: silver },
    { key: 'copper' as const, label: 'PC', color: 'var(--candle-amber)', value: copper },
  ]

  return (
    <Card className="worn-border bg-transparent p-10 ring-0">
      <CardHeader className="border-b border-[var(--border)] px-0 pb-[7px]">
        <OrnateTitle>Tesouro</OrnateTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-3 gap-2 px-0">
        {coins.map(({ key, label, color, value }) => (
          <div
            key={key}
            className="worn-border border border-[var(--border)] bg-[var(--card)] px-2.5 py-2 text-center"
          >
            <Label
              htmlFor={`currency-${key}`}
              className="text-muted-foreground mb-1 block justify-center text-[9px] italic"
            >
              {label}
            </Label>
            <Input
              id={`currency-${key}`}
              type="number"
              value={value}
              min={0}
              onChange={e => onUpdate({ [key]: Math.max(0, parseInt(e.target.value) || 0) })}
              className="font-heading h-auto cursor-text border-none bg-transparent p-0 text-center text-[22px] font-bold"
              style={{ color }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
