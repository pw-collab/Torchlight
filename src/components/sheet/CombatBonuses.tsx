'use client'

import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Props {
  meleeBonus: number
  rangedBonus: number
  spellcastingBonus: number
  onUpdate: (patch: { meleeBonus?: number; rangedBonus?: number; spellcastingBonus?: number }) => void
}

export function CombatBonuses({ meleeBonus, rangedBonus, spellcastingBonus, onUpdate }: Props) {
  const items = [
    { label: 'Corpo-a-Corpo', key: 'meleeBonus' as const, value: meleeBonus },
    { label: 'À Distância', key: 'rangedBonus' as const, value: rangedBonus },
    { label: 'Conjuração', key: 'spellcastingBonus' as const, value: spellcastingBonus },
  ]

  return (
    <Card className="worn-border bg-[var(--parchment-mid)] py-3 shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
      <CardHeader className="border-b border-[rgba(139,112,48,0.18)] px-3.5 pb-[7px]">
        <OrnateTitle>Bônus de Combate</OrnateTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-3 gap-2 px-3.5">
        {items.map(({ label, key, value }) => (
          <div
            key={key}
            className="worn-border border border-[rgba(139,112,48,0.22)] bg-[rgba(42,34,16,0.4)] px-2.5 py-2 text-center"
          >
            <Label
              htmlFor={`combat-${key}`}
              className="text-muted-foreground mb-1 block justify-center text-[9px] italic"
            >
              {label}
            </Label>
            <Input
              id={`combat-${key}`}
              type="number"
              value={value}
              onChange={e => onUpdate({ [key]: parseInt(e.target.value) || 0 })}
              className={cn(
                'font-heading h-auto cursor-text border-none bg-transparent p-0 text-center text-[22px] font-bold',
                value > 0
                  ? 'text-[var(--verdigris-light)]'
                  : value < 0
                    ? 'text-[var(--blood-bright)]'
                    : 'text-[var(--bone-white)]',
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
