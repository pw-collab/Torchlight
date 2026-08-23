'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SessionPanel } from '@/components/gm/SessionPanel'
import { NPCCard } from '@/components/gm/NPCCard'
import { NPCListItem } from '@/components/gm/NPCListItem'
import { NPCCreatorModal } from '@/components/gm/NPCCreatorModal'
import { BestiaryToolbar } from '@/components/gm/BestiaryToolbar'
import { BestiaryImportModal } from '@/components/gm/BestiaryImportModal'
import { NpcTagEditor } from '@/components/gm/NpcTagEditor'
import { ScenesPanel } from '@/components/gm/ScenesPanel'
import { SessionRecap } from '@/components/gm/SessionRecap'
import { allTags, duplicateOf, filterBestiary } from '@/lib/bestiary'
import { RollToasts } from '@/components/sheet/RollToasts'
import { AppShell } from '@/components/layout/AppShell'
import type { NPC, NPCRow } from '@/types/npc.types'
import { rowToNPC, npcToRow } from '@/types/npc.types'
import { rowToEvent, rowToSession } from '@/types/session.types'
import type { SessionEvent, SessionEventRow, SessionRow, TableSession } from '@/types/session.types'
import { recordEvent, rollPayload } from '@/lib/sessionEvents'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import type { RollResult } from '@/lib/dice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Props {
  gmName: string
  gmId: string
  session: SessionRow | null
}

type Tab = 'session' | 'npcs' | 'scenes'

export function GMPageClient({ gmName, gmId, session: initialSession }: Props) {
  // A página carrega a linha crua; daqui para baixo a mesa circula já mapeada,
  // porque o relógio da masmorra é lido dela.
  const [session, setSession] = useState<TableSession | null>(
    initialSession ? rowToSession(initialSession) : null,
  )
  const [sessionName, setSessionName] = useState('')
  const [creating, setCreating] = useState(false)
  const [ending, setEnding] = useState(false)
  const [copied, setCopied] = useState(false)
  const [tab, setTab] = useState<Tab>('session')
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [loadingNpcs, setLoadingNpcs] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null)
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [gmRolls, setGmRolls] = useState<RollResult[]>([])
  /** O recap da mesa que acabou de ser encerrada (§5.11). */
  const [recap, setRecap] = useState<{ id: string; name: string; events: SessionEvent[] } | null>(null)

  // ── Bestiário (§6.10) ─────────────────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (tab === 'npcs') fetchNpcs()
  }, [tab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchNpcs() {
    setLoadingNpcs(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('npcs')
      .select('*')
      .eq('gm_id', gmId)
      .order('created_at', { ascending: false })
    if (data) {
      const mapped = data.map(rowToNPC)
      setNpcs(mapped)
      // Auto-select the first NPC if none selected (or selection no longer exists)
      setSelectedNpcId(prev =>
        prev && mapped.some(n => n.id === prev) ? prev : (mapped[0]?.id ?? null)
      )
    }
    setLoadingNpcs(false)
  }

  async function createSession() {
    if (!sessionName.trim()) return
    setCreating(true)
    const supabase = createClient()
    // O código vem do banco (DEFAULT), e um gatilho arquiva a sessão anterior:
    // duas ativas deixavam a antiga órfã, ainda aceitando entradas.
    const { data } = await supabase
      .from('sessions')
      .insert({ gm_id: gmId, name: sessionName, active: true })
      .select('*')
      .single()
    if (data) {
      const row = rowToSession(data as SessionRow)
      setSession(row)
      void recordEvent({
        sessionId: row.id,
        actorName: gmName,
        kind: 'session',
        payload: { action: 'start', sessionName: row.name },
      })
    }
    setCreating(false)
  }

  /**
   * Encerrar arquiva a mesa: o código para de valer, quem estava nela deixa de
   * ver a sessão na ficha, e o log fica de pé como registro do que aconteceu.
   */
  async function endSession() {
    if (!session) return
    const ok = window.confirm(`Encerrar "${session.name}"? O código deixa de valer para a mesa.`)
    if (!ok) return

    setEnding(true)
    const supabase = createClient()
    // O evento vai antes: depois de encerrada, a mesa já não deve receber nada.
    await recordEvent({
      sessionId: session.id,
      actorName: gmName,
      kind: 'session',
      payload: { action: 'end', sessionName: session.name },
    })
    await supabase
      .from('sessions')
      .update({ active: false, ended_at: new Date().toISOString() })
      .eq('id', session.id)

    // O log é lido aqui porque o painel da sessão sai da tela junto com ela, e
    // com ele o feed de onde o recap sai (§5.11). A leitura é uma só, no fim.
    const { data: rows } = await supabase
      .from('session_events')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })
    setRecap({
      id: session.id,
      name: session.name,
      events: ((rows ?? []) as SessionEventRow[]).map(rowToEvent),
    })

    setSession(null)
    setSessionName('')
    setEnding(false)
  }

  /**
   * A rolagem do Mestre fazia um toast local e morria ali (§6.7). Agora ela vai
   * para o log como `gm_only` — só ele vê — e o feed oferece revelá-la à mesa
   * quando ele decidir contar. Fora de sessão continua sendo só o toast.
   */
  function handleGmRoll(result: RollResult) {
    setGmRolls(prev => [result, ...prev].slice(0, 10))
    if (!session) return
    void recordEvent({
      sessionId: session.id,
      actorName: gmName,
      kind: 'roll',
      payload: rollPayload(result),
      visibility: 'gm_only',
    })
  }

  async function copyCode() {
    if (!session) return
    try {
      await navigator.clipboard.writeText(session.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Sem permissão de área de transferência o código continua na tela.
    }
  }

  async function handleSaveNpc(npc: Omit<NPC, 'id' | 'createdAt'>) {
    if (editingNpc) {
      await updateNPC(editingNpc.id, npc)
    } else {
      await saveNPC(npc)
    }
  }

  async function saveNPC(npc: Omit<NPC, 'id' | 'createdAt'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('npcs')
      .insert(npcToRow(npc))
      .select('*')
      .single()
    if (error) throw error
    if (data) {
      const created = rowToNPC(data)
      setNpcs(prev => [created, ...prev])
      setSelectedNpcId(created.id)
    }
  }

  async function updateNPC(id: string, npc: Omit<NPC, 'id' | 'createdAt'>) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('npcs')
      .update(npcToRow(npc))
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    if (data) {
      const updated = rowToNPC(data)
      setNpcs(prev => prev.map(n => (n.id === id ? updated : n)))
      setSelectedNpcId(id)
    }
  }

  async function deleteNPC(id: string) {
    const ok = window.confirm('Excluir esta ficha de NPC? Esta ação não pode ser desfeita.')
    if (!ok) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('npcs').delete().eq('id', id)
    setNpcs(prev => {
      const remaining = prev.filter(n => n.id !== id)
      setSelectedNpcId(cur => (cur === id ? (remaining[0]?.id ?? null) : cur))
      return remaining
    })
    setDeletingId(null)
  }

  /** A estrela é do dia: marcar não abre a ficha nem mexe no statblock. */
  async function toggleFavorite(npc: NPC) {
    const next = !npc.favorite
    setNpcs(prev => prev.map(n => (n.id === npc.id ? { ...n, favorite: next } : n)))
    const supabase = createClient()
    await supabase.from('npcs').update({ favorite: next }).eq('id', npc.id)
  }

  async function setTags(npc: NPC, next: string[]) {
    setNpcs(prev => prev.map(n => (n.id === npc.id ? { ...n, tags: next } : n)))
    const supabase = createClient()
    await supabase.from('npcs').update({ tags: next }).eq('id', npc.id)
  }

  /** Uma variante do mesmo monstro, para os três goblins não serem redigitados. */
  async function duplicateNPC(npc: NPC) {
    await saveNPC(duplicateOf(npc))
  }

  /** Dez fichas de uma vez, do documento onde o bestiário já estava escrito. */
  async function importNPCs(parsed: Partial<NPC>[]) {
    const supabase = createClient()
    const rows = parsed.map(p => npcToRow({
      gmId,
      name: p.name ?? 'Sem nome',
      npcType: p.npcType ?? '',
      flavorText: p.flavorText ?? '',
      motives: p.motives ?? '',
      difficulty: p.difficulty,
      hp: p.hp,
      ac: p.ac,
      atkDesc: p.atkDesc ?? '',
      weaponDesc: p.weaponDesc ?? '',
      level: p.level,
      movement: p.movement ?? '',
      alignment: p.alignment ?? '',
      stats: p.stats ?? { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
      experience: p.experience ?? '',
      features: p.features ?? [],
      tags: [],
      favorite: false,
    }))

    const { data } = await supabase.from('npcs').insert(rows).select('*')
    if (data) setNpcs(prev => [...(data as NPCRow[]).map(rowToNPC), ...prev])
  }

  function openCreator() {
    setEditingNpc(null)
    setShowCreator(true)
  }

  function openEditor(npc: NPC) {
    setEditingNpc(npc)
    setShowCreator(true)
  }

  function closeCreator() {
    setShowCreator(false)
    setEditingNpc(null)
  }

  const shownNpcs = filterBestiary(npcs, { query, tags: activeTags, onlyFavorites })
  const tags = allTags(npcs)
  const selectedNpc = npcs.find(n => n.id === selectedNpcId) ?? null

  return (
    <AppShell
      backHref="/home"
      playerName={gmName}
      playerRole="MESTRE · CAMPANHA ATIVA"
    >
      <div className="grid-12 grid-12-page" style={{ paddingTop: 0, marginTop: 0 }}>

        {/* Page header */}
        <div
          className="col-span-12"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '24px 0 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--foreground)',
                letterSpacing: '0.05em',
                marginBottom: 4,
                lineHeight: 1.1,
              }}
            >
              Painel do Mestre
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--muted-foreground)',
              }}
            >
              Visão geral dos aventureiros e do estado da campanha
            </p>
          </div>

          {session && (
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 7.5,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--chart-2)',
                background: 'var(--chart-2)',
                border: '1px solid var(--chart-2)',
                padding: '4px 12px',
                borderRadius: 1,
                alignSelf: 'flex-start',
                marginTop: 4,
              }}
            >
              ✦ Sessão Ativa
            </span>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={tab}
          onValueChange={value => setTab(value as Tab)}
          className="col-span-12 border-b border-[var(--border)]"
        >
          <TabsList variant="line" className="h-auto w-full justify-start gap-0 bg-transparent">
            {([
              { value: 'session', label: 'Sessão' },
              { value: 'scenes', label: 'Preparo' },
              { value: 'npcs', label: 'NPCs & Monstros' },
            ] as const).map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  'tactile font-heading text-muted-foreground min-h-11 flex-none border-b-2 border-transparent',
                  'px-4.5 py-3 text-[11px] tracking-[0.12em] uppercase transition-all duration-[250ms]',
                  'data-active:border-b-[var(--primary)] data-active:bg-[var(--input)]',
                  'data-active:text-[var(--foreground)]',
                )}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Tab: Session */}
        {tab === 'session' && (
          <div className="col-span-12 flex flex-col gap-4">
            {/* O recap fica de pé depois de a mesa se despedir: é o que o
                Mestre lê para abrir a próxima sessão (§5.11). */}
            {recap && (
              <SessionRecap
                sessionId={recap.id}
                sessionName={recap.name}
                events={recap.events}
                onClose={() => setRecap(null)}
              />
            )}
            {!session ? (
              <div
                className="worn-border card-surface animate-mist-rise"
                style={{ padding: '24px 28px', maxWidth: 480 }}
              >
                <h2
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    letterSpacing: '0.05em',
                    marginBottom: 6,
                  }}
                >
                  Iniciar Nova Sessão
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 12,
                    color: 'var(--muted-foreground)',
                    marginBottom: 18,
                    lineHeight: 1.65,
                  }}
                >
                  Registrai o título desta sessão nos anais do arquivo antes de invocar os aventureiros.
                </p>

                <Input
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createSession()}
                  placeholder="Nome da sessão..."
                  aria-label="Nome da sessão"
                  className="mb-3.5 h-auto rounded-[1px] border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-[13px] text-[var(--foreground)] italic shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-[border-color] duration-[var(--duration-base)] ease-[var(--ease-ritual)]"
                />

                <div
                  style={{
                    borderTop: '1px solid var(--border)',
                    marginBottom: 14,
                  }}
                />

                <Button
                  onClick={createSession}
                  disabled={creating || !sessionName.trim()}
                  variant="outline"
                  className={cn(
                    'h-auto rounded-[1px] px-5.5 py-2.5 text-[10px] font-semibold tracking-[0.14em]',
                    'text-[var(--foreground)] transition-all duration-[var(--duration-base)] ease-[var(--ease-ritual)]',
                    creating
                      ? 'border-[var(--border)] bg-[var(--card)]'
                      : 'border-[var(--destructive)] bg-[var(--primary)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
                  )}
                >
                  {creating ? <><Spinner /> Registrando…</> : '⚔ Iniciar Sessão'}
                </Button>
              </div>
            ) : (
              <div className="animate-ink-spread">
                <div
                  className="worn-border"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    padding: '12px 18px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--chart-2)',
                      boxShadow: '0 0 6px var(--chart-2)',
                      flexShrink: 0,
                    }}
                  />
                  <h2
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--foreground)',
                      letterSpacing: '0.04em',
                      lineHeight: 1.2,
                    }}
                  >
                    {session.name}
                  </h2>

                  {/* O código é a porta da mesa: é ele que o Mestre lê em voz
                      alta, e cada jogador digita na própria ficha. */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyCode}
                    title="Copiar o código da sessão"
                    className="font-mono ml-auto h-9 min-h-9 shrink-0 gap-2 rounded-[1px] border-[var(--primary)] px-3"
                  >
                    <span className="font-heading text-[7.5px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
                      {copied ? 'Copiado' : 'Código'}
                    </span>
                    <span className="text-[15px] tracking-[0.3em] text-[var(--foreground)]">
                      {session.code}
                    </span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={endSession}
                    disabled={ending}
                    className="font-heading h-9 min-h-9 shrink-0 rounded-[1px] border-[var(--destructive)] px-3 text-[8.5px] tracking-[0.14em] text-[var(--destructive)] uppercase"
                  >
                    {ending ? 'Encerrando…' : 'Encerrar'}
                  </Button>
                </div>

                <SessionPanel
                  session={session}
                  gmName={gmName}
                  gmId={gmId}
                  onSessionChange={setSession}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab: Preparo (§6.11) */}
        {tab === 'scenes' && (
          <div className="animate-ink-spread col-span-12">
            <ScenesPanel
              gmId={gmId}
              gmName={gmName}
              session={session}
              onStarted={() => setTab('session')}
            />
          </div>
        )}

        {/* Tab: NPCs */}
        {tab === 'npcs' && (
          <div className="animate-ink-spread col-span-12">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                {npcs.length} ficha{npcs.length !== 1 ? 's' : ''} registrada{npcs.length !== 1 ? 's' : ''}
              </span>
              <Button
                onClick={openCreator}
                variant="outline"
                className="tactile glow-hover-blood text-foreground h-11 min-h-11 rounded-[1px] border-[var(--primary)] bg-[var(--destructive)]/25 px-4.5 text-[10px] tracking-[0.14em] transition-all duration-[250ms]"
              >
                + Nova Ficha
              </Button>
            </div>

            {npcs.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <BestiaryToolbar
                  query={query}
                  onQuery={setQuery}
                  tags={tags}
                  activeTags={activeTags}
                  onToggleTag={tag =>
                    setActiveTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]))
                  }
                  onlyFavorites={onlyFavorites}
                  onToggleFavorites={() => setOnlyFavorites(v => !v)}
                  onImport={() => setImporting(true)}
                  shown={shownNpcs.length}
                  total={npcs.length}
                />
              </div>
            )}

            {loadingNpcs ? (
              <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted-foreground)' }}>
                Consultando os arquivos...
              </p>
            ) : npcs.length === 0 ? (
              <div
                className="worn-border"
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'var(--card)',
                  border: '1px dashed var(--border)',
                  borderRadius: 1,
                }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted-foreground)' }}>
                  Nenhuma ficha registrada. Crie a primeira com &quot;+ Nova Ficha&quot;.
                </p>
              </div>
            ) : (
              <div className="grid-12" style={{ alignItems: 'start' }}>
                {/* Master list — span 4; full width on small screens */}
                <div className="npc-master-list col-span-4 col-sm-12">
                  {shownNpcs.length === 0 ? (
                    <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted-foreground)', padding: '12px 2px' }}>
                      Nada com esse filtro.
                    </p>
                  ) : (
                    shownNpcs.map(npc => (
                      <NPCListItem
                        key={npc.id}
                        npc={npc}
                        selected={npc.id === selectedNpcId}
                        onSelect={() => setSelectedNpcId(npc.id)}
                        onToggleFavorite={() => void toggleFavorite(npc)}
                      />
                    ))
                  )}
                </div>

                {/* Detail pane — span 8; full width on small screens */}
                <div className="npc-detail-pane col-span-8 col-sm-12">
                  {selectedNpc ? (
                    <div style={{ opacity: deletingId === selectedNpc.id ? 0.4 : 1, transition: 'opacity 300ms' }}>
                      <NpcTagEditor
                        tags={selectedNpc.tags}
                        suggestions={tags}
                        onChange={next => void setTags(selectedNpc, next)}
                      />
                      <NPCCard
                        npc={selectedNpc}
                        onEdit={() => openEditor(selectedNpc)}
                        onDelete={() => deleteNPC(selectedNpc.id)}
                        onDuplicate={() => void duplicateNPC(selectedNpc)}
                        onRoll={handleGmRoll}
                      />
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted-foreground)', padding: '20px 0' }}>
                      Selecione uma ficha à esquerda para visualizá-la.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreator && (
        <NPCCreatorModal
          gmId={gmId}
          editNpc={editingNpc}
          onSave={handleSaveNpc}
          onClose={closeCreator}
        />
      )}
      {/* O Mestre também rola — e o que ele rola nasce escondido. */}
      {importing && (
        <BestiaryImportModal onImport={importNPCs} onClose={() => setImporting(false)} />
      )}
      <DiceRoller onRoll={handleGmRoll} floating />
      <RollToasts rolls={gmRolls} />
    </AppShell>
  )
}
