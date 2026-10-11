'use client'

import { useState } from 'react'
import type { TreasureGrant } from '@/lib/gmActions'
import { TREASURE_TIERS, isEmptyGrant, type TreasureTier } from '@/lib/treasure'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CHIP, FIELD, LABEL, PRESSED, SUBMIT, parseAmount } from './ui'
import { cn } from '@/lib/utils'

/**
 * O baú aberto: moedas, um item e o XP que o achado vale.
 *
 * Moedas e XP vão para cada um que recebe — é assim que a mesa reparte o
 * saque na prática, cada um anotando o seu. O item é um objeto só, então ele
 * vai para uma pessoa: com mais de uma marcada, o campo fica fechado.
 */
export function TreasureForm({
  seats, initialRecipients, busy, onGive,
}: {
  seats: { id: string; name: string }[]
  initialRecipients: string[]
  busy?: boolean
  onGive: (recipientIds: string[], grant: TreasureGrant) => void
}) {
  const [recipients, setRecipients] = useState<string[]>(initialRecipients)
  const [gold, setGold] = useState('')
  const [silver, setSilver] = useState('')
  const [copper, setCopper] = useState('')
  const [tier, setTier] = useState<TreasureTier>('poor')
  const [itemName, setItemName] = useState('')
  const [itemDesc, setItemDesc] = useState('')
  const [slots, setSlots] = useState('1')
  const [qty, setQty] = useState('1')

  const single = recipients.length === 1
  const xp = TREASURE_TIERS.find(t => t.id === tier)?.xp ?? 0

  const grant: TreasureGrant = {
    gold: parseAmount(gold),
    silver: parseAmount(silver),
    copper: parseAmount(copper),
    xp,
    ...(single && itemName.trim() && {
      item: {
        name: itemName.trim(),
        description: itemDesc.trim(),
        slots: parseAmount(slots),
        quantity: Math.max(1, parseAmount(qty)),
      },
    }),
  }
  const ready = recipients.length > 0 && !isEmptyGrant(grant)

  const toggle = (id: string) =>
    setRecipients(prev => (prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Para quem</span>
        <div className="flex flex-wrap gap-1">
          {seats.map(seat => (
            <Button
              key={seat.id}
              type="button"
              variant="outline"
              aria-pressed={recipients.includes(seat.id)}
              onClick={() => toggle(seat.id)}
              className={cn(
                CHIP,
                recipients.includes(seat.id)
                  ? PRESSED
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {recipients.includes(seat.id) ? '✓ ' : ''}{seat.name}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRecipients(seats.map(s => s.id))}
            className={cn(CHIP, 'text-[var(--muted-foreground)]')}
          >
            Todos
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Moedas {recipients.length > 1 ? '(cada um recebe)' : ''}</span>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['PO', gold, setGold, 'var(--chart-1)'],
            ['PP', silver, setSilver, 'var(--foreground)'],
            ['PC', copper, setCopper, 'var(--muted-foreground)'],
          ] as const).map(([label, value, set, color]) => (
            <label key={label} className="flex flex-col gap-1">
              <span className="font-heading text-[10px] tracking-[0.14em] uppercase" style={{ color }}>{label}</span>
              <Input
                type="text"
                inputMode="numeric"
                value={value}
                onChange={e => set(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                placeholder="0"
                className={FIELD}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className={LABEL}>Quanto o achado vale em XP</span>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Qualidade do tesouro">
          {TREASURE_TIERS.map(t => (
            <Button
              key={t.id}
              type="button"
              variant="outline"
              aria-pressed={tier === t.id}
              onClick={() => setTier(t.id)}
              className={cn(
                CHIP,
                tier === t.id
                  ? PRESSED
                  : 'text-[var(--muted-foreground)]',
              )}
            >
              {t.label} · {t.xp} XP
            </Button>
          ))}
        </div>
      </div>

      <div className={cn('flex flex-col gap-1.5', !single && 'opacity-40')}>
        <span className={LABEL}>{single ? 'Item (opcional)' : 'Item: marque uma pessoa só'}</span>
        <Input
          value={itemName}
          onChange={e => setItemName(e.target.value.slice(0, 60))}
          disabled={!single}
          placeholder="Cálice de prata com rubis"
          aria-label="Nome do item"
          className="font-body border-border bg-secondary h-9 text-[12px]"
        />
        <div className="flex gap-2">
          <Input
            value={itemDesc}
            onChange={e => setItemDesc(e.target.value.slice(0, 200))}
            disabled={!single}
            placeholder="Descrição (opcional)"
            aria-label="Descrição do item"
            className="font-body border-border bg-secondary h-9 flex-1 text-[11px] italic"
          />
          <label className="flex items-center gap-1" title="Espaços de carga">
            <span className="font-heading text-[10px] tracking-[0.12em] text-[var(--muted-foreground)] uppercase">Esp.</span>
            <Input value={slots} onChange={e => setSlots(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} disabled={!single} inputMode="numeric" className={cn(FIELD, 'w-11')} />
          </label>
          <label className="flex items-center gap-1" title="Quantidade">
            <span className="font-heading text-[10px] tracking-[0.12em] text-[var(--muted-foreground)] uppercase">Qtd.</span>
            <Input value={qty} onChange={e => setQty(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))} disabled={!single} inputMode="numeric" className={cn(FIELD, 'w-12')} />
          </label>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => onGive(recipients, grant)}
        disabled={busy || !ready}
        className={SUBMIT}
      >
        Entregar o tesouro
      </Button>
    </div>
  )
}
