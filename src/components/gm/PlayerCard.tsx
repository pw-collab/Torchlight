'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Character } from '@/types/character.types'
import { brightest, minutesLeft } from '@/lib/light'
import { useNow } from '@/hooks/useNow'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/** O que o Mestre pode fazer com um personagem daqui. */
export type GmAction =
  | { type: 'hp'; delta: number }
  | { type: 'luck'; delta: number }
  | { type: 'xp'; delta: number }
  | { type: 'snuff' }

interface Props {
  character: Character
  /** De quem é o personagem, vindo do elenco da mesa. */
  playerName: string | null
  /** Presença: está com a ficha aberta agora, não apenas inscrito na mesa. */
  present: boolean
  expanded: boolean
  onToggle: () => void
  onAct: (action: GmAction) => void
  busy?: boolean
}

const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2 text-[8.5px] tracking-[0.1em] uppercase'

/**
 * Um personagem na mesa, do lado do Mestre.
 *
 * O card era um botão que expandia e nada mais — leitura pura, apesar de o
 * Mestre já ter permissão de escrita em qualquer ficha desde a migração 008.
 * Agora ele é o painel de controle da mesa: dano e cura, Fortuna, XP e a
 * escuridão. Toda ação vira linha do log, então o jogador vê na tela dele o
 * que aconteceu — nada acontece em silêncio.
 */
export function PlayerCard({ character, playerName, present, expanded, onToggle, onAct, busy }: Props) {
  const [amount, setAmount] = useState('')

  const hpPercent = Math.max(0, (character.hpCurrent / character.hpMax) * 100)
  const hpBarColor = hpPercent > 50 ? 'var(--chart-2)' : hpPercent > 25 ? 'var(--primary)' : 'var(--destructive)'
  const isDead = character.hpCurrent <= 0

  // A luz vem do inventário (lib/light), o mesmo relógio de parede que a ficha
  // do jogador lê — o card mostrava 🌑 para a mesa inteira enquanto lia o campo
  // legado `torch_end_at`, que ninguém escreve desde a luz por item.
  const now = useNow()
  const light = brightest(character.inventory, now)
  const torchMins = light ? minutesLeft(light, now) : null
  const torchLow = torchMins !== null && torchMins <= 10

  const parsed = Math.abs(parseInt(amount, 10))
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : 0

  function applyHp(sign: 1 | -1) {
    if (value === 0) return
    onAct({ type: 'hp', delta: sign * value })
    setAmount('')
  }

  return (
    <Card
      size="sm"
      className={cn(
        'group/player gap-2 rounded-[2px_1px_3px_1px] border bg-[var(--card)] px-3.5 py-3',
        'text-left shadow-[0_3px_12px_rgba(0,0,0,0.6)] transition-all duration-[450ms] ease-[var(--ease-ritual)]',
        isDead ? 'border-[var(--destructive)]' : 'border-[var(--border)]',
        expanded && 'border-t-2 border-t-[var(--muted-foreground)] shadow-[0_5px_18px_rgba(0,0,0,0.7)]',
        busy && 'opacity-60',
      )}
    >
      <CardHeader className="flex-row items-center justify-between gap-2 px-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          {/* Presença: aceso quando a ficha está aberta do outro lado. */}
          <span
            aria-hidden
            title={present ? 'Na mesa agora' : 'Fora do app'}
            className="size-1.5 shrink-0 rounded-full"
            style={{
              background: present ? 'var(--chart-2)' : 'var(--muted-foreground)',
              boxShadow: present ? '0 0 6px var(--chart-2)' : 'none',
              opacity: present ? 1 : 0.35,
            }}
          />
          <span className="flex min-w-0 flex-col">
            <CardTitle className="font-heading truncate text-[13px] leading-tight font-semibold tracking-[0.05em] text-[var(--foreground)]">
              {character.name}
            </CardTitle>
            {playerName && (
              <span className="font-body truncate text-[9px] text-[var(--muted-foreground)] italic">
                {playerName}
              </span>
            )}
          </span>
        </button>

        {isDead && (
          <Badge
            variant="destructive"
            className="font-heading shrink-0 text-[7.5px] tracking-[0.16em] text-[var(--destructive)] uppercase"
          >
            ☠ Caído
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-2 px-0">
        <Progress
          value={hpPercent}
          className="gap-0"
          aria-label={`Pontos de vida: ${character.hpCurrent} de ${character.hpMax}`}
        >
          <ProgressTrack className="h-[3px] rounded-[1px] bg-[var(--muted)]">
            <ProgressIndicator
              className="transition-[width] duration-[400ms]"
              style={{ background: hpBarColor, boxShadow: `0 0 4px ${hpBarColor}80` }}
            />
          </ProgressTrack>
        </Progress>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[var(--foreground)]">
            PV {character.hpCurrent}/{character.hpMax}
          </span>
          <span className="font-mono text-[9px] text-[var(--muted-foreground)]">CA {character.ac}</span>
          <span className="font-heading text-[8.5px] text-[var(--chart-1)]">✦ {character.luckTokens}</span>
          <span
            className={cn(
              'font-mono text-[9px]',
              torchLow
                ? 'text-[var(--destructive)]'
                : torchMins !== null
                  ? 'text-[var(--chart-1)]'
                  : 'text-[var(--muted-foreground)]/40',
            )}
          >
            {torchMins !== null ? (torchLow ? `⚠ ${torchMins}min` : `🕯 ${torchMins}min`) : '🌑'}
          </span>
        </div>

        {/* ── O painel de controle ──────────────────────────────────────── */}
        <div className="mt-1 flex flex-col gap-1.5 border-t border-[var(--border)] pt-2">
          <div className="flex items-center gap-1.5">
            <Input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
              onKeyDown={e => { if (e.key === 'Enter') applyHp(-1) }}
              placeholder="0"
              aria-label={`Quantidade de dano ou cura para ${character.name}`}
              className="font-mono border-border bg-secondary h-8 w-12 shrink-0 px-1 text-center text-[12px]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => applyHp(-1)}
              disabled={value === 0 || busy}
              className={cn(PILL, 'flex-1 border-[var(--destructive)] text-[var(--destructive)] disabled:opacity-30')}
            >
              Dano
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => applyHp(1)}
              disabled={value === 0 || busy}
              className={cn(PILL, 'flex-1 border-[var(--chart-2)] text-[var(--chart-2)] disabled:opacity-30')}
            >
              Cura
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onAct({ type: 'luck', delta: -1 })}
              disabled={character.luckTokens <= 0 || busy}
              title="Gastar um token de Fortuna"
              className={cn(PILL, 'w-9 px-0 text-[var(--chart-1)] disabled:opacity-30')}
            >
              ✦−
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAct({ type: 'luck', delta: 1 })}
              disabled={busy}
              title="Conceder um token de Fortuna"
              className={cn(PILL, 'w-9 px-0 text-[var(--chart-1)]')}
            >
              ✦+
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAct({ type: 'xp', delta: 1 })}
              disabled={busy}
              title="Conceder 1 de experiência"
              className={cn(PILL, 'flex-1')}
            >
              +1 XP
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onAct({ type: 'snuff' })}
              disabled={torchMins === null || busy}
              title="Uma rajada apaga a luz deste personagem"
              className={cn(PILL, 'w-9 px-0 disabled:opacity-30')}
            >
              🌑
            </Button>
          </div>

          <Link
            href={`/sheet/${character.id}`}
            className="font-heading text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase underline underline-offset-2 transition-colors hover:text-[var(--foreground)]"
          >
            Abrir ficha
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
