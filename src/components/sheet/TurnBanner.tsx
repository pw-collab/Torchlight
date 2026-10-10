'use client'

import { motion } from 'framer-motion'
import type { Encounter, EncounterActor } from '@/types/encounter.types'
import {
  combatStatus,
  combatTurn,
  explorationStatus,
  type CombatTurn,
  type TurnLedger,
  type TurnStatus,
} from '@/lib/turns'
import { Button } from '@/components/ui/button'

interface Props {
  /** O combate em andamento; nulo na exploração, que também anda em turnos. */
  encounter: Encounter | null
  actors: EncounterActor[]
  turns: TurnLedger
  /** A chave deste personagem na vez (`pcKey`). */
  myKey: string
  /** A linha dele na trilha, quando há combate e ele está nela. */
  mine: EncounterActor | undefined
  /** Morto, ou caído e estabilizado: sem vez. */
  out: boolean
  /** As jogadas; nulas quando quem olha a ficha não é o dono — aí o banner só informa. */
  actions: { onRollInitiative: () => void; onClaim: () => void; onEnd: () => void } | null
  busy?: boolean
  /** A última jogada que o banco recusou ("Alguém assumiu a vez antes."). */
  notice?: string | null
}

/**
 * A vez, vista da ficha.
 *
 * O jogador precisa de pouco: saber se pode agir agora, um botão para assumir
 * a vez e outro para encerrá-la, e quem está agindo enquanto não é ele — a
 * ordem dentro do grupo se combina na mesa, não aqui. No começo de um combate
 * entra a iniciativa: um d6 pelo grupo inteiro, rolado por quem tocar
 * primeiro.
 */
export function TurnBanner({ encounter, actors, turns, myKey, mine, out, actions, busy, notice }: Props) {
  const turn = encounter ? combatTurn(encounter, actors, turns) : null
  const status: TurnStatus = turn ? combatStatus(turn, mine) : explorationStatus(turns, myKey, out)
  const rolling = turn?.stage === 'initiative'
  const myTurn = status === 'acting'
  const partyToRoll = rolling && encounter?.pcInitiative == null

  const { headline, detail } = describe(encounter, turn, status, turns.actingName, mine)
  const accent = myTurn ? 'var(--chart-1)' : status === 'ready' || partyToRoll ? 'var(--primary)' : 'var(--border)'

  const button = !actions
    ? null
    : partyToRoll
      ? { label: '🎲 Rolar pelo grupo', run: actions.onRollInitiative }
      : myTurn
        ? { label: 'Encerrar a vez', run: actions.onEnd }
        : status === 'ready'
          ? { label: 'Assumir a vez', run: actions.onClaim }
          : null

  const dice = encounter && (encounter.pcInitiative != null || encounter.npcInitiative != null)
    ? `d6 · grupo ${encounter.pcInitiative ?? '—'} × ${encounter.npcInitiative ?? '—'} inimigos`
    : null

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
        {encounter ? '⚔' : '🕯'}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-heading truncate text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          {encounter
            ? `${encounter.name} · ${turn?.stage === 'turns' ? `rodada ${turn.round}` : 'iniciativa'}`
            : 'Exploração'}
        </span>
        <span
          role="status"
          className="font-heading text-[13px] leading-tight"
          style={{ color: myTurn ? 'var(--chart-1)' : 'var(--foreground)' }}
        >
          {headline}
        </span>
        {(notice ?? detail) && (
          <span className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
            {notice ?? detail}
          </span>
        )}
        {dice && <span className="font-mono text-[9px] text-[var(--muted-foreground)]">{dice}</span>}
      </span>

      {button && (
        <Button
          type="button"
          variant="hollow"
          onClick={button.run}
          disabled={busy}
          className="font-heading bg-primary text-primary-foreground h-10 shrink-0 px-3.5 text-[10px] font-bold tracking-[0.14em] uppercase"
        >
          {button.label}
        </Button>
      )}
    </motion.div>
  )
}

/** O que dizer, dito como se diz na mesa. */
function describe(
  encounter: Encounter | null,
  turn: CombatTurn | null,
  status: TurnStatus,
  actingName: string | null,
  mine: EncounterActor | undefined,
): { headline: string; detail: string } {
  if (encounter && turn?.stage === 'initiative') {
    return encounter.pcInitiative == null
      ? { headline: 'Iniciativa: o grupo rola um d6', detail: 'Um d6 só, por todos: qualquer um rola. Empate, o grupo começa.' }
      : { headline: 'Esperando o d6 do Mestre', detail: `O grupo tirou ${encounter.pcInitiative}.` }
  }

  const otherSide = turn?.stage === 'turns' && turn.side === 'npc'
  switch (status) {
    case 'acting':
      return { headline: 'Sua vez', detail: 'Faça sua ação e encerre a vez: só então outro assume.' }
    case 'ready':
      return {
        headline: encounter ? 'Vez do grupo' : 'A vez está livre',
        detail: 'Combinem quem vai: quem assumir age, e os outros esperam.',
      }
    case 'waiting':
      return actingName
        ? { headline: `${actingName} está agindo`, detail: 'Espere encerrar a vez para assumir a sua.' }
        : { headline: otherSide ? 'Vez dos inimigos' : 'Esperando', detail: otherSide ? 'O grupo age depois deles.' : '' }
    case 'done':
      return {
        headline: actingName ? `${actingName} está agindo` : otherSide ? 'Vez dos inimigos' : 'Você já agiu',
        detail: encounter
          ? 'Você já agiu nesta rodada.'
          : 'Você já agiu nesta rodada; ela vira quando o Mestre passar.',
      }
    case 'out':
      return encounter && !mine
        ? { headline: 'Fora da trilha', detail: 'O Mestre põe você no combate.' }
        : { headline: 'Fora de ação', detail: 'Morto ou inconsciente: sem vez até alguém mudar isso.' }
  }
}
