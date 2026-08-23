'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { NPC, NPCRow } from '@/types/npc.types'
import { rowToNPC } from '@/types/npc.types'
import type { Scene, SceneRow } from '@/types/scene.types'
import { rowToScene, sceneOrder } from '@/types/scene.types'
import type { TableSession } from '@/types/session.types'
import { useEncounter } from '@/hooks/useEncounter'
import { npcActorFields, uniqueActorName } from '@/lib/encounterSetup'
import { recordEvent } from '@/lib/sessionEvents'
import { rollDie } from '@/lib/dice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Props {
  gmId: string
  gmName: string
  /** A mesa de hoje, quando há uma — sem ela a cena se prepara, mas não começa. */
  session: TableSession | null
  /** A cena começou: quem está de fora leva o Mestre até a trilha. */
  onStarted?: () => void
}

/** Um lugar na mesa, reduzido ao que o encontro precisa saber. */
interface Seat {
  id: string
  name: string
}

interface MemberRow {
  character_id: string
  characters: { id: string; name: string } | null
}

const CHIP =
  'font-heading h-8 min-h-8 rounded-[1px] px-2.5 text-[8.5px] tracking-[0.1em] uppercase'

/** Uma mesa vazia é sempre o mesmo array — ver `SessionPanel`. */
const NO_SEATS: Seat[] = []

const BLANK: Scene = {
  id: '', gmId: '', title: '', gmNote: '', npcIds: [],
  playedAt: null, sortKey: 0, createdAt: '',
}

/**
 * A aba de preparo (§6.11).
 *
 * O Mestre escreve a cena na véspera — o que acontece, quem está lá — e no dia
 * a inicia com um toque: o encontro nasce com o nome da cena, a mesa inteira
 * sentada e os NPCs vinculados já na trilha, com iniciativa rolada.
 *
 * A nota é dele e continua dele: nada do que está escrito aqui vai para o log.
 * O que a mesa vê é o encontro começando.
 */
export function ScenesPanel({ gmId, gmName, session, onStarted }: Props) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [bestiary, setBestiary] = useState<NPC[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Scene>(BLANK)
  const [busy, setBusy] = useState(false)
  const [started, setStarted] = useState<string | null>(null)
  // O elenco vem daqui e não do painel de sessão: a aba de preparo é lida
  // sozinha, e uma cena iniciada tem de sentar quem está na mesa agora. O par
  // com a mesa evita sentar o elenco da sessão anterior enquanto recarrega.
  const [roster, setRoster] = useState<{ sessionId: string | null; seats: Seat[] }>({
    sessionId: null,
    seats: NO_SEATS,
  })
  const seats = roster.sessionId === (session?.id ?? null) ? roster.seats : NO_SEATS

  const ready = draft.title.trim().length > 0

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    void (async () => {
      const [{ data: sceneRows }, { data: npcRows }] = await Promise.all([
        supabase.from('scenes').select('*').eq('gm_id', gmId),
        supabase.from('npcs').select('*').eq('gm_id', gmId).order('name', { ascending: true }),
      ])
      if (cancelled) return
      setScenes(sceneOrder(((sceneRows ?? []) as SceneRow[]).map(rowToScene)))
      setBestiary(((npcRows ?? []) as NPCRow[]).map(rowToNPC))
      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [gmId])

  const sessionId = session?.id ?? null
  const { encounter, reload: reloadEncounter } = useEncounter(sessionId)

  useEffect(() => {
    // Sem mesa não há elenco a buscar, e nem o que limpar: `seats` acima já
    // devolve a lista vazia quando a mesa não bate com a carregada.
    if (!sessionId) return

    let cancelled = false
    const supabase = createClient()
    supabase
      .from('session_members')
      .select('character_id, characters(id, name)')
      .eq('session_id', sessionId)
      .order('joined_at', { ascending: true })
      .then(({ data }) => {
        if (cancelled) return
        const rows = (data ?? []) as unknown as MemberRow[]
        setRoster({
          sessionId,
          seats: rows
            .filter(row => row.characters)
            .map(row => ({ id: row.character_id, name: row.characters!.name })),
        })
      })

    return () => { cancelled = true }
  }, [sessionId])

  function replace(scene: Scene) {
    setScenes(prev =>
      sceneOrder(prev.some(s => s.id === scene.id)
        ? prev.map(s => (s.id === scene.id ? scene : s))
        : [...prev, scene]),
    )
  }

  async function save() {
    if (!ready) return
    setBusy(true)
    const supabase = createClient()
    const fields = {
      title: draft.title.trim(),
      gm_note: draft.gmNote,
      npc_ids: draft.npcIds,
    }

    const query = draft.id
      ? supabase.from('scenes').update(fields).eq('id', draft.id)
      // O `sort_key` novo vai para o fim do roteiro: a cena escrita agora é a
      // próxima a preparar, não a próxima a jogar.
      : supabase.from('scenes').insert({
          gm_id: gmId,
          ...fields,
          sort_key: scenes.reduce((max, s) => Math.max(max, s.sortKey), 0) + 1,
        })

    const { data } = await query.select().single()
    if (data) {
      const saved = rowToScene(data as SceneRow)
      replace(saved)
      setDraft(saved)
    }
    setBusy(false)
  }

  async function remove(scene: Scene) {
    const ok = window.confirm(`Apagar a cena "${scene.title}"?`)
    if (!ok) return
    const supabase = createClient()
    await supabase.from('scenes').delete().eq('id', scene.id)
    setScenes(prev => prev.filter(s => s.id !== scene.id))
    if (draft.id === scene.id) setDraft(BLANK)
  }

  /** Jogada ou não: o Mestre desmarca e reusa a cena numa mesa futura. */
  async function togglePlayed(scene: Scene) {
    const supabase = createClient()
    const { data } = await supabase
      .from('scenes')
      .update({ played_at: scene.playedAt ? null : new Date().toISOString() })
      .eq('id', scene.id)
      .select()
      .single()
    if (data) replace(rowToScene(data as SceneRow))
  }

  /**
   * O gesto que ligava a preparação ao jogo.
   *
   * Um encontro com o nome da cena, a mesa inteira sentada e cada NPC vinculado
   * já na trilha com iniciativa rolada. É exatamente o que o Mestre faria à
   * mão no painel de encontros — a cena só o poupa de fazê-lo com a mesa
   * esperando.
   */
  async function startScene(scene: Scene) {
    if (!session) return

    // Dois encontros ativos na mesma mesa deixariam o primeiro invisível: a
    // trilha carrega sempre o mais recente. Encerrar o anterior é o que o
    // Mestre faria à mão antes de abrir o próximo.
    if (encounter) {
      const ok = window.confirm(
        `"${encounter.name}" ainda está em andamento. Iniciar "${scene.title}" encerra o anterior.`,
      )
      if (!ok) return
    }

    setBusy(true)
    const supabase = createClient()

    if (encounter) {
      await supabase
        .from('encounters')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', encounter.id)
      void recordEvent({
        sessionId: session.id,
        actorName: gmName,
        kind: 'encounter',
        payload: { action: 'end', encounterName: encounter.name },
      })
    }

    const { data } = await supabase
      .from('encounters')
      .insert({ session_id: session.id, name: scene.title })
      .select('*')
      .single()

    if (!data) {
      setBusy(false)
      return
    }

    const encounterId = (data as { id: string }).id
    const rows: Record<string, unknown>[] = seats.map((seat, index) => ({
      encounter_id: encounterId,
      source: 'pc',
      ref_id: seat.id,
      name: seat.name,
      sort_key: index,
    }))

    // Os nomes já usados incluem os personagens: dois "Corvo" na mesma trilha
    // seriam ambíguos venha o segundo do bestiário ou da mesa.
    const taken = seats.map(seat => seat.name)
    scene.npcIds.forEach((npcId, index) => {
      const npc = bestiary.find(n => n.id === npcId)
      // Um NPC apagado do bestiário depois de vinculado simplesmente não entra;
      // a cena continua começando, que é o que a mesa está esperando.
      if (!npc) return
      const label = uniqueActorName(npc.name, taken)
      taken.push(label)
      rows.push({
        encounter_id: encounterId,
        source: 'npc',
        ref_id: npc.id,
        name: label,
        ...npcActorFields(npc),
        initiative: rollDie('d20', 'Iniciativa', npc.name, npc.stats.dex).total,
        sort_key: seats.length + index,
      })
    })

    if (rows.length > 0) await supabase.from('encounter_actors').insert(rows)

    void recordEvent({
      sessionId: session.id,
      actorName: gmName,
      kind: 'encounter',
      payload: { action: 'start', encounterName: scene.title },
    })

    const { data: marked } = await supabase
      .from('scenes')
      .update({ played_at: new Date().toISOString() })
      .eq('id', scene.id)
      .select()
      .single()
    if (marked) replace(rowToScene(marked as SceneRow))

    setStarted(scene.id)
    setBusy(false)
    reloadEncounter()
    onStarted?.()
  }

  function toggleNpc(npcId: string) {
    setDraft(d => ({
      ...d,
      npcIds: d.npcIds.includes(npcId)
        ? d.npcIds.filter(id => id !== npcId)
        : [...d.npcIds, npcId],
    }))
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* O roteiro */}
      <div className="flex flex-col gap-2 lg:w-[320px] lg:shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-heading text-[9px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
            {loading
              ? 'Abrindo o caderno…'
              : scenes.length === 0
                ? 'Nenhuma cena preparada'
                : `${scenes.length} cena${scenes.length === 1 ? '' : 's'}`}
          </span>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDraft(BLANK)}
            className={cn(CHIP, 'border-[var(--border)]')}
          >
            + Nova cena
          </Button>
        </div>

        {!loading && scenes.length === 0 && (
          <p className="font-body text-[11px] leading-snug text-[var(--muted-foreground)] italic">
            A preparação de uma sessão costuma morar num caderno à parte. Escreva
            a cena ao lado, vincule os monstros que estão nela, e no dia ela começa
            com um toque.
          </p>
        )}

        {scenes.map(scene => {
          const linked = scene.npcIds.filter(id => bestiary.some(n => n.id === id)).length
          return (
            <div
              key={scene.id}
              className={cn(
                'flex flex-col gap-1.5 px-3 py-2.5',
                draft.id === scene.id
                  ? 'border border-[var(--primary)] bg-[var(--input)]'
                  : 'border border-[var(--border)] bg-[var(--card)]',
                scene.playedAt && 'opacity-60',
              )}
            >
              <button
                type="button"
                onClick={() => setDraft(scene)}
                className="flex cursor-pointer items-baseline justify-between gap-2 text-left"
              >
                <span className="font-heading truncate text-[11px] tracking-[0.06em] text-[var(--foreground)]">
                  {scene.playedAt && <span aria-hidden className="opacity-70">✓ </span>}
                  {scene.title}
                </span>
                <span className="font-body shrink-0 text-[10px] text-[var(--muted-foreground)] italic">
                  {linked > 0 ? `${linked} ficha${linked === 1 ? '' : 's'}` : '—'}
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void startScene(scene)}
                  disabled={busy || !session}
                  title={
                    session
                      ? 'Abre um encontro com este nome, a mesa sentada e os NPCs na trilha'
                      : 'Abra uma sessão para levar a cena à mesa'
                  }
                  className={cn(CHIP, 'flex-1 border-[var(--primary)] disabled:opacity-30')}
                >
                  {started === scene.id ? '▶ Na mesa' : '▶ Iniciar cena'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void togglePlayed(scene)}
                  title={scene.playedAt ? 'Devolver ao roteiro' : 'Marcar como jogada'}
                  className={cn(CHIP, 'shrink-0 text-[var(--muted-foreground)]')}
                >
                  {scene.playedAt ? '↩' : '✓'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void remove(scene)}
                  aria-label={`Apagar ${scene.title}`}
                  className={cn(CHIP, 'shrink-0 text-[var(--destructive)]')}
                >
                  ✕
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* O preparo */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Input
          type="text"
          value={draft.title}
          onChange={e => setDraft(d => ({ ...d, title: e.target.value.slice(0, 80) }))}
          placeholder="A emboscada na ponte"
          aria-label="Título da cena"
          className="font-heading border-border bg-secondary h-9 text-[12px] tracking-[0.06em]"
        />
        <Textarea
          value={draft.gmNote}
          onChange={e => setDraft(d => ({ ...d, gmNote: e.target.value }))}
          placeholder={'O que acontece, o que a mesa vê primeiro, o que os bandidos querem.\n\nSó você lê isto.'}
          aria-label="Nota do Mestre"
          className="font-body border-border bg-secondary min-h-[180px] text-[12px] leading-relaxed"
        />

        <span className="font-heading text-[8px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          Quem está na cena
        </span>
        {bestiary.length === 0 ? (
          <p className="font-body text-[11px] text-[var(--muted-foreground)] italic">
            O bestiário está vazio — crie fichas na aba ao lado para vinculá-las aqui.
          </p>
        ) : (
          <div className="flex max-h-[220px] flex-wrap items-start gap-1 overflow-y-auto">
            {bestiary.map(npc => (
              <Button
                key={npc.id}
                type="button"
                variant="outline"
                onClick={() => toggleNpc(npc.id)}
                className={cn(
                  CHIP,
                  draft.npcIds.includes(npc.id)
                    ? 'border-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                    : 'border-[var(--border)] bg-transparent text-[var(--muted-foreground)]',
                )}
              >
                {npc.name}
              </Button>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          onClick={() => void save()}
          disabled={busy || !ready}
          className={cn(CHIP, 'border-[var(--border)] disabled:opacity-30')}
        >
          {busy ? 'Guardando…' : draft.id ? 'Salvar cena' : 'Guardar cena'}
        </Button>
      </div>
    </div>
  )
}
