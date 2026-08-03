'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { SessionPanel } from '@/components/gm/SessionPanel'
import { NPCCard } from '@/components/gm/NPCCard'
import { NPCListItem } from '@/components/gm/NPCListItem'
import { NPCCreatorModal } from '@/components/gm/NPCCreatorModal'
import { RollToasts } from '@/components/sheet/RollToasts'
import { AppShell } from '@/components/layout/AppShell'
import type { NPC } from '@/types/npc.types'
import { rowToNPC, npcToRow } from '@/types/npc.types'
import type { RollResult } from '@/lib/dice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface Props {
  gmName: string
  gmId: string
  session: { id: string; name: string } | null
}

type Tab = 'session' | 'npcs'

export function GMPageClient({ gmName, gmId, session: initialSession }: Props) {
  const [session, setSession] = useState(initialSession)
  const [sessionName, setSessionName] = useState('')
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<Tab>('session')
  const [npcs, setNpcs] = useState<NPC[]>([])
  const [loadingNpcs, setLoadingNpcs] = useState(false)
  const [showCreator, setShowCreator] = useState(false)
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null)
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [gmRolls, setGmRolls] = useState<RollResult[]>([])

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
    const { data } = await supabase
      .from('sessions')
      .insert({ gm_id: gmId, name: sessionName, active: true })
      .select('*')
      .single()
    if (data) {
      setSession(data)
    }
    setCreating(false)
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

  const selectedNpc = npcs.find(n => n.id === selectedNpcId) ?? null

  return (
    <AppShell
      breadcrumbs={[{ label: 'Painel do Mestre' }]}
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
            borderBottom: '1px solid rgba(139,112,48,0.22)',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--parchment-pale)',
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
                color: '#6A5A3A',
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
                color: 'var(--verdigris-light)',
                background: 'rgba(42,80,69,0.15)',
                border: '1px solid rgba(42,80,69,0.35)',
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
          onValueChange={value => setTab(value as 'session' | 'npcs')}
          className="col-span-12 border-b border-[rgba(139,112,48,0.22)]"
        >
          <TabsList variant="line" className="h-auto w-full justify-start gap-0 bg-transparent">
            {([
              { value: 'session', label: 'Sessão' },
              { value: 'npcs', label: 'NPCs & Monstros' },
            ] as const).map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  'tactile font-heading text-muted-foreground min-h-11 flex-none border-b-2 border-transparent',
                  'px-4.5 py-3 text-[11px] tracking-[0.12em] uppercase transition-all duration-[250ms]',
                  'data-active:border-b-[rgba(139,112,48,0.6)] data-active:bg-[rgba(139,112,48,0.12)]',
                  'data-active:text-[var(--parchment-light)]',
                )}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Tab: Session */}
        {tab === 'session' && (
          <div className="col-span-12">
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
                    color: 'var(--bone-white)',
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
                    color: 'var(--bone-muted)',
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
                  className="mb-3.5 h-auto rounded-[1px] border-[rgba(139,112,48,0.28)] bg-[var(--ink-deep)] px-3 py-2.5 text-[13px] text-[var(--parchment-light)] italic shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] transition-[border-color] duration-[var(--duration-base)] ease-[var(--ease-ritual)]"
                />

                <div
                  style={{
                    borderTop: '1px solid rgba(139,112,48,0.15)',
                    marginBottom: 14,
                  }}
                />

                <Button
                  onClick={createSession}
                  disabled={creating || !sessionName.trim()}
                  variant="outline"
                  className={cn(
                    'h-auto rounded-[1px] px-5.5 py-2.5 text-[10px] font-semibold tracking-[0.14em]',
                    'text-[var(--parchment-pale)] transition-all duration-[var(--duration-base)] ease-[var(--ease-ritual)]',
                    creating
                      ? 'border-[rgba(139,112,48,0.22)] bg-[var(--parchment-mid)]'
                      : 'border-[var(--blood-bright)] bg-[var(--blood-mid)] shadow-[0_2px_8px_rgba(0,0,0,0.5)]',
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
                    background: 'rgba(28,21,8,0.6)',
                    border: '1px solid rgba(139,112,48,0.22)',
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
                      background: 'var(--verdigris-light)',
                      boxShadow: '0 0 6px rgba(61,112,96,0.6)',
                      flexShrink: 0,
                    }}
                  />
                  <h2
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--bone-white)',
                      letterSpacing: '0.04em',
                      lineHeight: 1.2,
                    }}
                  >
                    {session.name}
                  </h2>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 7.5,
                      color: '#3A2E18',
                      letterSpacing: '0.1em',
                      marginLeft: 'auto',
                    }}
                  >
                    ID: {session.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                <SessionPanel sessionId={session.id} />
              </div>
            )}
          </div>
        )}

        {/* Tab: NPCs */}
        {tab === 'npcs' && (
          <div className="animate-ink-spread col-span-12">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
                {npcs.length} ficha{npcs.length !== 1 ? 's' : ''} registrada{npcs.length !== 1 ? 's' : ''}
              </span>
              <Button
                onClick={openCreator}
                variant="outline"
                className="tactile glow-hover-blood text-foreground h-11 min-h-11 rounded-[1px] border-[var(--blood-mid)] bg-[rgba(139,21,21,0.25)] px-4.5 text-[10px] tracking-[0.14em] transition-all duration-[250ms]"
              >
                + Nova Ficha
              </Button>
            </div>

            {loadingNpcs ? (
              <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--bone-muted)' }}>
                Consultando os arquivos...
              </p>
            ) : npcs.length === 0 ? (
              <div
                className="worn-border"
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: 'rgba(28,21,8,0.35)',
                  border: '1px dashed rgba(139,112,48,0.3)',
                  borderRadius: 1,
                }}
              >
                <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--bone-muted)' }}>
                  Nenhuma ficha registrada. Crie a primeira com &quot;+ Nova Ficha&quot;.
                </p>
              </div>
            ) : (
              <div className="grid-12" style={{ alignItems: 'start' }}>
                {/* Master list — span 4; full width on small screens */}
                <div className="npc-master-list col-span-4 col-sm-12">
                  {npcs.map(npc => (
                    <NPCListItem
                      key={npc.id}
                      npc={npc}
                      selected={npc.id === selectedNpcId}
                      onSelect={() => setSelectedNpcId(npc.id)}
                    />
                  ))}
                </div>

                {/* Detail pane — span 8; full width on small screens */}
                <div className="npc-detail-pane col-span-8 col-sm-12">
                  {selectedNpc ? (
                    <div style={{ opacity: deletingId === selectedNpc.id ? 0.4 : 1, transition: 'opacity 300ms' }}>
                      <NPCCard
                        npc={selectedNpc}
                        onEdit={() => openEditor(selectedNpc)}
                        onDelete={() => deleteNPC(selectedNpc.id)}
                        onRoll={r => setGmRolls(prev => [r, ...prev].slice(0, 10))}
                      />
                    </div>
                  ) : (
                    <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--bone-muted)', padding: '20px 0' }}>
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
      <RollToasts rolls={gmRolls} />
    </AppShell>
  )
}
