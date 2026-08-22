'use client'

import { motion } from 'framer-motion'
import type { Encounter, EncounterActor } from '@/types/encounter.types'
import { turnOrder } from '@/types/encounter.types'
import { Button } from '@/components/ui/button'

interface Props {
  encounter: Encounter
  actors: EncounterActor[]
  /** A linha deste personagem na trilha, se ele estiver nela. */
  mine: EncounterActor | undefined
  onRollInitiative: () => void
  busy?: boolean
}

/**
 * O combate visto da ficha.
 *
 * O jogador precisa de três coisas e nenhuma a mais: entrar na ordem, saber
 * quando é a vez dele, e saber quem está agindo enquanto não é. A trilha
 * completa é do Mestre; aqui fica só o que muda o que a pessoa faz agora.
 */
export function TurnBanner({ encounter, actors, mine, onRollInitiative, busy }: Props) {
  const myTurn = mine != null && encounter.activeActorId === mine.id
  const active = actors.find(a => a.id === encounter.activeActorId)
  const needsInitiative = mine != null && mine.initiative == null

  const accent = myTurn ? 'var(--chart-1)' : 'var(--border)'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="worn-border flex flex-wrap items-center gap-3 px-3.5 py-2.5"
      style={{
        background: myTurn
          ? 'color-mix(in oklch, var(--chart-1), transparent 88%)'
          : 'var(--card)',
        border: `1px solid ${accent}`,
        borderLeftWidth: 3,
      }}
    >
      <span aria-hidden className={myTurn ? 'animate-flicker text-[16px] leading-none' : 'text-[16px] leading-none opacity-50'}>
        ⚔
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          {encounter.name} · rodada {encounter.round}
        </span>
        <span
          className="font-heading text-[13px] leading-tight"
          style={{ color: myTurn ? 'var(--chart-1)' : 'var(--foreground)' }}
        >
          {myTurn
            ? 'Sua vez'
            : needsInitiative
              ? 'Role a iniciativa para entrar na ordem'
              : active
                ? `Vez de ${active.name}`
                : 'A ordem ainda não começou'}
        </span>
        {mine?.initiative != null && !myTurn && (
          <span className="font-mono text-[9px] text-[var(--muted-foreground)]">
            sua iniciativa: {mine.initiative}
            {' · '}
            {positionOf(actors, mine)}
          </span>
        )}
      </span>

      {needsInitiative && (
        <Button
          type="button"
          variant="hollow"
          onClick={onRollInitiative}
          disabled={busy}
          className="font-heading bg-primary text-primary-foreground h-10 shrink-0 px-3.5 text-[10px] font-bold tracking-[0.14em] uppercase"
        >
          Rolar iniciativa
        </Button>
      )}
    </motion.div>
  )
}

/** "3º de 5" — onde a pessoa está na fila, dito como se diz na mesa. */
function positionOf(actors: EncounterActor[], mine: EncounterActor): string {
  const order = turnOrder(actors)
  const at = order.findIndex(a => a.id === mine.id)
  return at === -1 ? '' : `${at + 1}º de ${order.length}`
}
