'use client'

import { useCallback, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useEncounter } from '@/hooks/useEncounter'
import type { Character } from '@/types/character.types'
import type { EncounterActor } from '@/types/encounter.types'
import { nextTurn, turnOrder } from '@/types/encounter.types'
import type { NPC, NPCRow } from '@/types/npc.types'
import { rowToNPC } from '@/types/npc.types'
import { recordEvent } from '@/lib/sessionEvents'
import { rollDie } from '@/lib/dice'
import { attackBonusFrom, damageFrom } from '@/lib/npcAttack'
import type { GmAction } from './PlayerCard'
import { NpcAttack } from './NpcAttack'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Seat {
  character: Character
  playerName: string | null
}

interface Props {
  sessionId: string
  gmName: string
  gmId: string
  seats: Seat[]
  /** Dano no PC passa pelo mesmo caminho do card: escreve na ficha e conta à mesa. */
  onAct: (character: Character, action: GmAction) => void | Promise<void>
}

const PILL =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.12em] uppercase'

/**
 * O encontro ao vivo — o maior sistema que faltava.
 *
 * Sem grid, como a filosofia do produto pede: o que a mesa precisa é saber de
 * quem é a vez, quanto cada um aguenta ainda, e quando a rodada virou. Os NPCs
 * do bestiário entram aqui como **atores** com HP próprio, então três goblins
 * do mesmo statblock têm três vidas diferentes sem papel nenhum ao lado do
 * teclado.
 *
 * O PC não duplica vida: a linha dele aponta para a ficha e o HP é lido de lá.
 */
export function EncounterPanel({ sessionId, gmName, gmId, seats, onAct }: Props) {
  const { encounter, actors, reload } = useEncounter(sessionId)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [picking, setPicking] = useState(false)
  const [bestiary, setBestiary] = useState<NPC[]>([])

  const seatOf = useCallback(
    (actor: EncounterActor) => seats.find(s => s.character.id === actor.refId),
    [seats],
  )

  const log = useCallback(
    (payload: Record<string, unknown>) =>
      void recordEvent({ sessionId, actorName: gmName, kind: 'encounter', payload }),
    [sessionId, gmName],
  )

  // ── Montar ────────────────────────────────────────────────────────────────

  /** Abrir um encontro já senta a mesa nele: é sempre o que o Mestre quer. */
  async function startEncounter() {
    const title = name.trim() || 'Encontro'
    setBusy(true)
    const supabase = createClient()

    const { data } = await supabase
      .from('encounters')
      .insert({ session_id: sessionId, name: title })
      .select('*')
      .single()

    if (data) {
      const encounterId = (data as { id: string }).id
      if (seats.length > 0) {
        await supabase.from('encounter_actors').insert(
          seats.map((seat, index) => ({
            encounter_id: encounterId,
            source: 'pc',
            ref_id: seat.character.id,
            name: seat.character.name,
            sort_key: index,
          })),
        )
      }
      log({ action: 'start', encounterName: title })
      reload()
    }
    setName('')
    setBusy(false)
  }

  async function loadBestiary() {
    const supabase = createClient()
    const { data } = await supabase
      .from('npcs')
      .select('*')
      .eq('gm_id', gmId)
      .order('name', { ascending: true })
    setBestiary(((data ?? []) as NPCRow[]).map(rowToNPC))
  }

  /**
   * O NPC entra com a vida do statblock e a iniciativa já rolada — é assim que
   * a mesa faz quando o monstro aparece. O número fica editável na trilha para
   * o Mestre corrigir ou impor a ordem que quiser.
   */
  async function addNpc(npc: NPC) {
    if (!encounter) return
    setBusy(true)

    const sameName = actors.filter(a => a.name.replace(/ \d+$/, '') === npc.name).length
    const label = sameName > 0 ? `${npc.name} ${sameName + 1}` : npc.name
    const initiative = rollDie('d20', 'Iniciativa', npc.name, npc.stats.dex).total
    const maxSort = actors.reduce((max, a) => Math.max(max, a.sortKey), 0)

    const supabase = createClient()
    await supabase.from('encounter_actors').insert({
      encounter_id: encounter.id,
      source: 'npc',
      ref_id: npc.id,
      name: label,
      hp_current: npc.hp ?? 1,
      hp_max: npc.hp ?? 1,
      ac: npc.ac ?? 10,
      atk_bonus: attackBonusFrom(npc.atkDesc),
      damage_die: damageFrom(npc.atkDesc) ?? damageFrom(npc.weaponDesc),
      initiative,
      sort_key: maxSort + 1,
    })

    reload()
    setBusy(false)
  }

  /** Quem sentou depois de o encontro começar entra por aqui. */
  async function seatPc(seat: Seat) {
    if (!encounter) return
    setBusy(true)
    const maxSort = actors.reduce((max, a) => Math.max(max, a.sortKey), 0)
    const supabase = createClient()
    await supabase.from('encounter_actors').insert({
      encounter_id: encounter.id,
      source: 'pc',
      ref_id: seat.character.id,
      name: seat.character.name,
      sort_key: maxSort + 1,
    })
    reload()
    setBusy(false)
  }

  async function patchActor(actor: EncounterActor, patch: Record<string, unknown>) {
    const supabase = createClient()
    await supabase.from('encounter_actors').update(patch).eq('id', actor.id)
    reload()
  }

  async function removeActor(actor: EncounterActor) {
    const supabase = createClient()
    await supabase.from('encounter_actors').delete().eq('id', actor.id)
    reload()
  }

  // ── A trilha anda ─────────────────────────────────────────────────────────

  async function advance() {
    if (!encounter) return
    const { actorId, wrapped } = nextTurn(actors, encounter.activeActorId)
    if (!actorId) return

    const round = wrapped ? encounter.round + 1 : encounter.round
    const supabase = createClient()
    await supabase
      .from('encounters')
      .update({ active_actor_id: actorId, round })
      .eq('id', encounter.id)

    if (wrapped) log({ action: 'round', round })
    const who = actors.find(a => a.id === actorId)
    log({ action: 'turn', actorName: who?.name, round })
    reload()
  }

  /** Dano num NPC vive na linha dele; num PC vai para a ficha, pelo caminho de sempre. */
  async function damageActor(actor: EncounterActor, amount: number) {
    if (actor.source === 'pc') {
      const seat = seatOf(actor)
      if (seat) await onAct(seat.character, { type: 'hp', delta: -amount })
      return
    }
    const to = Math.max(0, (actor.hpCurrent ?? 0) - amount)
    await patchActor(actor, { hp_current: to, defeated: to <= 0 })
    if (to <= 0) log({ action: 'down', actorName: actor.name })
  }

  async function endEncounter(xpEach: number) {
    if (!encounter) return
    setBusy(true)
    const supabase = createClient()
    await supabase
      .from('encounters')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', encounter.id)

    log({ action: 'end', encounterName: encounter.name })
    for (const seat of seats) {
      if (xpEach > 0) await onAct(seat.character, { type: 'xp', delta: xpEach })
    }
    reload()
    setBusy(false)
  }

  // ── Sem encontro ──────────────────────────────────────────────────────────

  if (!encounter) {
    return (
      <div
        className="flex flex-wrap items-center gap-2 px-3 py-2.5"
        style={{ background: 'var(--card)', border: '1px dashed var(--border)' }}
      >
        <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          Nenhum encontro em andamento
        </span>
        <Input
          value={name}
          onChange={e => setName(e.target.value.slice(0, 40))}
          onKeyDown={e => { if (e.key === 'Enter') void startEncounter() }}
          placeholder="Emboscada na ponte…"
          aria-label="Nome do encontro"
          className="font-body border-border bg-secondary h-8 min-w-[160px] flex-1 text-[12px] italic"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => void startEncounter()}
          disabled={busy}
          className={cn(PILL, 'border-[var(--primary)]')}
        >
          ⚔ Iniciar encontro
        </Button>
      </div>
    )
  }

  // ── Com encontro ──────────────────────────────────────────────────────────

  const order = turnOrder(actors)
  const missingSeats = seats.filter(
    seat => !actors.some(a => a.source === 'pc' && a.refId === seat.character.id),
  )
  const defeatedNpcs = actors.filter(a => a.source === 'npc' && a.defeated).length
  const livingPcs = seats.filter(s => s.character.hpCurrent > 0)

  return (
    <div
      className="flex flex-col gap-2.5 px-3 py-2.5"
      style={{ background: 'var(--card)', border: '1px solid var(--primary)', borderLeftWidth: 3 }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-[12px] leading-none text-[var(--foreground)]">
          ⚔ {encounter.name}
        </span>
        <span className="font-mono text-[8.5px] text-[var(--muted-foreground)]">
          rodada {encounter.round}
        </span>

        <span className="ml-auto flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const next = !picking
              setPicking(next)
              // O bestiário só é lido quando o Mestre pede para ver — abrir a
              // sessão não devia custar uma consulta que talvez não use.
              if (next && bestiary.length === 0) void loadBestiary()
            }}
            disabled={busy}
            className={PILL}
          >
            + NPC
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void advance()}
            disabled={busy || order.length === 0}
            title="Passar a vez para o próximo da trilha"
            className={cn(PILL, 'border-[var(--primary)] disabled:opacity-30')}
          >
            ▸ Próximo
          </Button>
          <EndEncounter
            defeated={defeatedNpcs}
            busy={busy}
            onEnd={xp => void endEncounter(xp)}
          />
        </span>
      </div>

      {missingSeats.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-heading text-[8px] tracking-[0.14em] text-[var(--muted-foreground)] uppercase">
            Fora da trilha
          </span>
          {missingSeats.map(seat => (
            <Button
              key={seat.character.id}
              type="button"
              variant="outline"
              onClick={() => void seatPc(seat)}
              disabled={busy}
              className="font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase"
            >
              + {seat.character.name}
            </Button>
          ))}
        </div>
      )}

      {picking && (
        <div className="flex flex-wrap gap-1 border-t border-[var(--border)] pt-2">
          {bestiary.length === 0 ? (
            <span className="font-body text-[11px] text-[var(--muted-foreground)] italic">
              Nenhuma ficha no bestiário ainda.
            </span>
          ) : (
            bestiary.map(npc => (
              <Button
                key={npc.id}
                type="button"
                variant="outline"
                onClick={() => void addNpc(npc)}
                disabled={busy}
                title={`PV ${npc.hp ?? '?'} · CA ${npc.ac ?? '?'}`}
                className="font-heading h-7 min-h-7 rounded-[1px] px-2 text-[8px] tracking-[0.1em] uppercase"
              >
                {npc.name}
              </Button>
            ))
          )}
        </div>
      )}

      <div className="flex flex-col">
        {order.length === 0 && (
          <span className="font-body py-2 text-[11px] text-[var(--muted-foreground)] italic">
            Ninguém na trilha ainda.
          </span>
        )}
        {order.map(actor => (
          <ActorRow
            key={actor.id}
            actor={actor}
            seat={seatOf(actor)}
            active={actor.id === encounter.activeActorId}
            targets={livingPcs.map(s => s.character)}
            busy={busy}
            onDamage={amount => void damageActor(actor, amount)}
            onInitiative={value => void patchActor(actor, { initiative: value })}
            onRemove={() => void removeActor(actor)}
            onAttackResolved={payload => log({ ...payload, action: 'attack', actorName: actor.name })}
            onApplyToTarget={(character, amount) => void onAct(character, { type: 'hp', delta: -amount })}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Uma linha da trilha ──────────────────────────────────────────────────────

function ActorRow({
  actor, seat, active, targets, busy,
  onDamage, onInitiative, onRemove, onAttackResolved, onApplyToTarget,
}: {
  actor: EncounterActor
  seat?: Seat
  active: boolean
  targets: Character[]
  busy?: boolean
  onDamage: (amount: number) => void
  onInitiative: (value: number) => void
  onRemove: () => void
  onAttackResolved: (payload: Record<string, unknown>) => void
  onApplyToTarget: (character: Character, amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  // A iniciativa é digitada, não clicada: escrever a cada tecla mandaria "1" ao
  // banco antes de "17", e o Realtime devolveria o 1 por cima do que a pessoa
  // ainda está digitando. O campo é local até sair dele.
  const [draft, setDraft] = useState<string | null>(null)

  // O PC lê vida e CA da ficha; o NPC carrega as suas na própria linha.
  const hpCurrent = actor.source === 'pc' ? seat?.character.hpCurrent ?? 0 : actor.hpCurrent ?? 0
  const hpMax = actor.source === 'pc' ? seat?.character.hpMax ?? 0 : actor.hpMax ?? 0
  const ac = actor.source === 'pc' ? seat?.character.ac ?? 10 : actor.ac ?? 10
  const down = actor.source === 'pc' ? hpCurrent <= 0 : actor.defeated

  const parsed = Math.abs(parseInt(amount, 10))
  const value = Number.isFinite(parsed) && parsed > 0 ? parsed : 0

  function apply() {
    if (value === 0) return
    onDamage(value)
    setAmount('')
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 border-b border-[var(--border)] py-1.5 last:border-b-0',
        down && 'opacity-45',
      )}
      style={active ? { background: 'color-mix(in oklch, var(--primary), transparent 90%)' } : undefined}
    >
      <span aria-hidden className="w-3 shrink-0 text-[11px] leading-none text-[var(--primary)]">
        {active ? '▸' : ''}
      </span>

      <Input
        type="text"
        inputMode="numeric"
        value={draft ?? (actor.initiative == null ? '' : String(actor.initiative))}
        onChange={e => setDraft(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
        onBlur={() => {
          if (draft === null) return
          const next = parseInt(draft, 10)
          if (Number.isFinite(next) && next !== actor.initiative) onInitiative(next)
          setDraft(null)
        }}
        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
        placeholder="—"
        aria-label={`Iniciativa de ${actor.name}`}
        title={actor.initiative == null ? 'Ainda não rolou' : 'Iniciativa'}
        className="font-mono border-border bg-secondary h-7 w-9 shrink-0 px-0 text-center text-[11px]"
      />

      <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
        <span
          className={cn(
            'font-heading truncate text-[11px]',
            actor.source === 'pc' ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]',
          )}
        >
          {actor.name}
        </span>
        {down && (
          <span className="font-heading shrink-0 text-[7.5px] tracking-[0.14em] text-[var(--destructive)] uppercase">
            ☠
          </span>
        )}
      </span>

      <span className="font-mono shrink-0 text-[9px] text-[var(--muted-foreground)]">
        PV {hpCurrent}/{hpMax} · CA {ac}
      </span>

      <Input
        type="text"
        inputMode="numeric"
        value={amount}
        onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
        onKeyDown={e => { if (e.key === 'Enter') apply() }}
        placeholder="0"
        aria-label={`Dano em ${actor.name}`}
        className="font-mono border-border bg-secondary h-7 w-10 shrink-0 px-1 text-center text-[11px]"
      />
      <Button
        type="button"
        variant="outline"
        onClick={apply}
        disabled={busy || value === 0}
        title={`Aplicar ${value || ''} de dano em ${actor.name}`}
        className="font-heading h-7 min-h-7 shrink-0 rounded-[1px] border-[var(--destructive)] px-2 text-[8px] tracking-[0.1em] text-[var(--destructive)] uppercase disabled:opacity-30"
      >
        ↓
      </Button>

      {actor.source === 'npc' && !down && (
        <NpcAttack
          attacker={actor.name}
          bonus={actor.atkBonus ?? 0}
          damage={actor.damageDie ?? '1d6'}
          targets={targets}
          onResolved={onAttackResolved}
          onApply={onApplyToTarget}
        />
      )}

      {actor.source === 'npc' && (
        <Button
          type="button"
          variant="ghost"
          onClick={onRemove}
          aria-label={`Tirar ${actor.name} da trilha`}
          className="h-7 min-h-7 shrink-0 px-1 text-[10px] text-[var(--muted-foreground)]"
        >
          ✕
        </Button>
      )}
    </div>
  )
}

// ─── Encerrar ─────────────────────────────────────────────────────────────────

function EndEncounter({
  defeated, busy, onEnd,
}: {
  defeated: number
  busy?: boolean
  onEnd: (xpEach: number) => void
}) {
  const [open, setOpen] = useState(false)
  // Uma sugestão, não uma regra: o app não sabe o que a mesa acha que aquele
  // combate valeu, então propõe o que houve e deixa o Mestre corrigir.
  const [xp, setXp] = useState('1')

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={busy}
        className={cn(PILL, 'border-[var(--destructive)] text-[var(--destructive)]')}
      >
        Encerrar
      </Button>
    )
  }

  const parsed = parseInt(xp, 10)
  const value = Number.isFinite(parsed) ? Math.max(0, parsed) : 0

  return (
    <span className="flex items-center gap-1.5">
      <span className="font-body text-[10px] text-[var(--muted-foreground)] italic">
        {defeated > 0 ? `${defeated} caíram · XP a cada um` : 'XP a cada um'}
      </span>
      <Input
        type="text"
        inputMode="numeric"
        value={xp}
        onChange={e => setXp(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
        aria-label="XP para cada personagem"
        className="font-mono border-border bg-secondary h-8 w-10 shrink-0 px-1 text-center text-[12px]"
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => { onEnd(value); setOpen(false) }}
        disabled={busy}
        className={cn(PILL, 'border-[var(--destructive)] text-[var(--destructive)]')}
      >
        Confirmar
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen(false)}
        aria-label="Cancelar"
        className="h-8 min-h-8 px-1 text-[10px] text-[var(--muted-foreground)]"
      >
        ✕
      </Button>
    </span>
  )
}
