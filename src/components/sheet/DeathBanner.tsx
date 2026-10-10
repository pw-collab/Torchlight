'use client'

import { motion } from 'framer-motion'
import type { ActiveCondition } from '@/types/character.types'
import { DEATH_DC, STABILIZE_DC, dyingRounds, mortalState, roundsLabel } from '@/lib/dying'
import { Button } from '@/components/ui/button'

interface Props {
  conditions: ActiveCondition[]
  /** É a vez deste personagem na trilha: a rolagem é agora. */
  myTurn?: boolean
  /** Ausente para quem só está olhando a ficha — o Mestre rola do painel dele. */
  onDeathRoll?: () => void
  busy?: boolean
}

/**
 * Cair a 0 PV, visto da ficha (ver `lib/dying`).
 *
 * Era um número vermelho no retrato e mais nada; a mesa tinha de lembrar a
 * regra, rolar o relógio e contar as rodadas de cabeça, logo no momento mais
 * tenso do jogo. Aqui a ficha diz quanto falta, oferece a rolagem da vez e
 * escurece as bordas da tela enquanto o relógio corre.
 *
 * Fica no fluxo da página, como o pedido do Mestre: não é um aviso que some.
 */
export function DeathBanner({ conditions, myTurn, onDeathRoll, busy }: Props) {
  const state = mortalState(conditions)
  if (state === 'standing') return null

  const rounds = dyingRounds(conditions) ?? 0
  const accent = state === 'stable' ? 'var(--chart-2)' : 'var(--destructive)'

  return (
    <>
      {state !== 'stable' && <div aria-hidden className="death-vignette" data-state={state} />}

      <motion.div
        role="status"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="worn-border flex flex-wrap items-center gap-3 px-3.5 py-3"
        style={{
          background: `color-mix(in oklch, ${accent}, transparent ${myTurn ? 80 : 88}%)`,
          // Longhands: the accent changes when the state does (dying → stable).
          borderStyle: 'solid',
          borderWidth: 1,
          borderLeftWidth: 3,
          borderColor: accent,
        }}
      >
        <span
          aria-hidden
          className={state === 'dying' ? 'animate-flicker text-[20px] leading-none' : 'text-[20px] leading-none'}
        >
          {state === 'stable' ? '✚' : '☠'}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
            {state === 'dying' ? `Morrendo · ${roundsLabel(rounds)}` : state === 'stable' ? 'Estável' : 'Morto'}
          </span>
          <span className="font-heading text-[14px] leading-tight" style={{ color: accent }}>
            {state === 'dying'
              ? myTurn
                ? 'Sua vez: role contra a morte'
                : rounds === 1
                  ? 'Última rodada'
                  : `${rounds} rodadas para a morte`
              : state === 'stable'
                ? 'Inconsciente, mas fora de perigo'
                : 'O relógio chegou a zero'}
          </span>
          <span className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
            {state === 'dying'
              ? `Na sua vez, role um d20: só um 20 natural te levanta com 1 PV. Um aliado pode te estabilizar com INT DC ${STABILIZE_DC}.`
              : state === 'stable'
                ? 'Qualquer cura te põe de pé.'
                : 'Converse com o Mestre sobre o que vem agora.'}
          </span>
        </span>

        {state === 'dying' && onDeathRoll && (
          <Button
            type="button"
            variant="hollow"
            onClick={onDeathRoll}
            disabled={busy}
            title={`d20 contra DC ${DEATH_DC}: um 20 natural levanta com 1 PV, qualquer outra coisa gasta uma rodada`}
            className={
              'font-heading h-11 shrink-0 px-4 text-[11px] font-bold tracking-[0.14em] uppercase ' +
              'bg-[var(--destructive)] text-[var(--background)] ' +
              (myTurn ? 'animate-flicker' : '')
            }
          >
            Rolar contra a morte
          </Button>
        )}
      </motion.div>
    </>
  )
}
