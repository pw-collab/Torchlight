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
  /**
   * O botão da vez dentro do banner. O dock do desktop tem um botão fixo para
   * isso (TurnButton) e desliga este; o celular segue com ele aqui.
   */
  withButton?: boolean
}

type TurnInputs = Pick<Props, 'encounter' | 'actors' | 'turns' | 'myKey' | 'mine' | 'out'>

/** Onde a vez está para esta ficha: o combate (ou a exploração) visto daqui. */
function turnState({ encounter, actors, turns, myKey, mine, out }: TurnInputs) {
  const turn = encounter ? combatTurn(encounter, actors, turns) : null
  const status: TurnStatus = turn ? combatStatus(turn, mine) : explorationStatus(turns, myKey, out)
  const rolling = turn?.stage === 'initiative'
  return {
    turn,
    status,
    myTurn: status === 'acting',
    partyToRoll: rolling && encounter?.pcInitiative == null,
  }
}

/** A jogada que cabe agora, se alguma: rolar a iniciativa, assumir ou encerrar a vez. */
function turnMove(
  { status, myTurn, partyToRoll }: ReturnType<typeof turnState>,
  actions: Props['actions'],
): { kind: 'initiative' | 'claim' | 'end'; run: () => void } | null {
  if (!actions) return null
  if (partyToRoll) return { kind: 'initiative', run: actions.onRollInitiative }
  if (myTurn) return { kind: 'end', run: actions.onEnd }
  if (status === 'ready') return { kind: 'claim', run: actions.onClaim }
  return null
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
export function TurnBanner({ encounter, actors, turns, myKey, mine, out, actions, busy, notice, withButton = true }: Props) {
  const state = turnState({ encounter, actors, turns, myKey, mine, out })
  const { turn, status, myTurn, partyToRoll } = state

  const { headline, detail } = describe(encounter, turn, status, turns.actingName, mine)
  const accent = myTurn ? 'var(--chart-1)' : status === 'ready' || partyToRoll ? 'var(--primary)' : 'var(--border)'

  const move = withButton ? turnMove(state, actions) : null
  const button = move && {
    label: move.kind === 'initiative' ? '🎲 Rolar pelo grupo' : move.kind === 'end' ? 'Encerrar a vez' : 'Assumir a vez',
    run: move.run,
  }

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
        <span className="font-mono font-semibold truncate text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          {encounter
            ? `${encounter.name} · ${turn?.stage === 'turns' ? `rodada ${turn.round}` : 'iniciativa'}`
            : 'Exploração'}
        </span>
        <span
          role="status"
          className="font-mono font-semibold text-[13px] leading-tight"
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
          className="font-mono bg-primary text-primary-foreground h-10 shrink-0 px-3.5 text-[10px] font-bold tracking-[0.14em] uppercase"
        >
          {button.label}
        </Button>
      )}
    </motion.div>
  )
}

const MOVE_LABEL = { initiative: 'Rolar iniciativa', claim: 'Iniciar turno', end: 'Encerrar turno' } as const

/**
 * O botão da vez no dock do desktop (o "Turno" do Figma, no ciano): rolar a
 * iniciativa do grupo antes de haver ordem, depois iniciar e encerrar o turno.
 * Fica sempre no lugar; quando não há jogada (fora da mesa, vez de outro, já
 * agiu) aparece desligado em "Iniciar turno", e o porquê vem no title.
 */
export function TurnButton({ inTable, actions, busy, ...inputs }: TurnInputs & {
  /** Fora de uma mesa não há vez a assumir. */
  inTable: boolean
  actions: Props['actions']
  busy?: boolean
}) {
  const state = turnState(inputs)
  const move = inTable ? turnMove(state, actions) : null
  const why = !inTable
    ? 'Entre numa mesa para usar a vez'
    : !actions
      ? 'Só o dono da ficha joga a vez'
      : describe(inputs.encounter, state.turn, state.status, inputs.turns.actingName, inputs.mine).headline

  return (
    <Button
      type="button"
      variant="spirit"
      onClick={move?.run}
      disabled={!move || busy}
      title={move ? MOVE_LABEL[move.kind] : why}
      className="type-button h-full min-h-0 w-full min-w-0 px-2 text-[14px]"
    >
      {MOVE_LABEL[move?.kind ?? 'claim']}
    </Button>
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
