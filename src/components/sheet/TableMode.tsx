'use client'

import { createPortal } from 'react-dom'
import type { Character } from '@/types/character.types'
import type { TableClock } from '@/lib/dungeonClock'
import { tableNow } from '@/lib/dungeonClock'
import { brightest, minutesLeft } from '@/lib/light'
import { useNow } from '@/hooks/useNow'
import { ConditionChips } from '@/components/sheet/ConditionChips'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  character: Character
  clock?: TableClock | null
  onClose: () => void
}

/**
 * O celular apoiado do outro lado da mesa.
 *
 * A ficha inteira é para quem está com ela na mão. Quem joga com o aparelho
 * encostado no copo, a meio metro de distância, precisa de quatro números e
 * nada mais — e precisa deles grandes o bastante para ler de relance, sem
 * pegar o telefone e sem perder a cena.
 *
 * É a mesma verdade da ficha, na mesma sessão: só a escala muda.
 */
export function TableMode({ character, clock, onClose }: Props) {
  const now = tableNow(clock, useNow())
  const light = brightest(character.inventory, now)
  const torchMins = light ? minutesLeft(light, now) : null
  const torchLow = torchMins !== null && torchMins <= 10

  const hpPercent = character.hpMax > 0 ? Math.max(0, (character.hpCurrent / character.hpMax) * 100) : 0
  const hurt = hpPercent <= 25
  const down = character.hpCurrent <= 0

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="animate-mist-rise fixed inset-0 z-[200] flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      {/* Cabeçalho: quem é, e a saída. */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <span className="font-heading truncate text-[13px] tracking-[0.08em] text-[var(--muted-foreground)] uppercase">
          {character.name}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="font-heading h-11 min-h-11 shrink-0 rounded-[1px] px-3.5 text-[10px] tracking-[0.14em] uppercase"
        >
          ✕ Sair
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-6">
        {/* PV — o número que a mesa pergunta. */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-heading text-[11px] tracking-[0.24em] text-[var(--muted-foreground)] uppercase">
            Pontos de Vida
          </span>
          <span
            className={cn('font-heading leading-none font-bold', down && 'animate-flicker')}
            style={{
              fontSize: 'clamp(72px, 26vw, 168px)',
              color: down
                ? 'var(--destructive)'
                : hurt
                  ? 'var(--destructive)'
                  : 'var(--foreground)',
            }}
          >
            {character.hpCurrent}
          </span>
          <span className="font-mono text-[15px] text-[var(--muted-foreground)]">
            de {character.hpMax}
          </span>

          <span aria-hidden className="mt-1 block h-1 w-full max-w-[320px] bg-[var(--muted)]">
            <span
              className="block h-full transition-[width] duration-500"
              style={{
                width: `${hpPercent}%`,
                background: hurt ? 'var(--destructive)' : 'var(--chart-2)',
              }}
            />
          </span>
        </div>

        {/* CA, Fortuna e luz — a linha que se confere de longe. */}
        <div className="grid grid-cols-3 gap-3">
          <BigStat label="CA" value={String(character.ac)} />
          <BigStat label="Fortuna" value={`✦ ${character.luckTokens}`} accent="var(--chart-1)" />
          <BigStat
            label="Luz"
            value={torchMins !== null ? `${torchMins}` : '—'}
            suffix={torchMins !== null ? 'min' : undefined}
            accent={
              torchMins === null
                ? 'var(--muted-foreground)'
                : torchLow
                  ? 'var(--destructive)'
                  : 'var(--chart-1)'
            }
          />
        </div>

        {character.conditions.length > 0 && (
          <div className="flex justify-center">
            <ConditionChips conditions={character.conditions} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function BigStat({
  label, value, suffix, accent = 'var(--foreground)',
}: {
  label: string
  value: string
  suffix?: string
  accent?: string
}) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <span className="font-heading text-[9px] tracking-[0.18em] text-[var(--muted-foreground)] uppercase">
        {label}
      </span>
      <span
        className="font-heading leading-none font-bold"
        style={{ fontSize: 'clamp(28px, 9vw, 46px)', color: accent }}
      >
        {value}
      </span>
      {suffix && (
        <span className="font-mono text-[10px] text-[var(--muted-foreground)]">{suffix}</span>
      )}
    </div>
  )
}
