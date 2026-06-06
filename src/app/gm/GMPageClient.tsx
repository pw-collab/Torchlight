'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { sendToDiscord } from '@/lib/discord'
import { SessionPanel } from '@/components/gm/SessionPanel'
import { NPCCard } from '@/components/gm/NPCCard'
import { NPCListItem } from '@/components/gm/NPCListItem'
import { NPCCreatorModal } from '@/components/gm/NPCCreatorModal'
import { RollToasts } from '@/components/sheet/RollToasts'
import { AppShell } from '@/components/layout/AppShell'
import type { NPC } from '@/types/npc.types'
import { rowToNPC, npcToRow } from '@/types/npc.types'
import type { RollResult } from '@/lib/dice'

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
      await sendToDiscord({ type: 'session_start', gm: gmName })
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-heading)',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: '12px 18px',
    cursor: 'pointer',
    background: active ? 'rgba(139,112,48,0.12)' : 'none',
    border: 'none',
    borderBottom: active ? '2px solid rgba(139,112,48,0.6)' : '2px solid transparent',
    color: active ? 'var(--parchment-light)' : 'var(--bone-muted)',
    transition: 'all 250ms',
    minHeight: 44,
    WebkitTapHighlightColor: 'transparent',
  })

  const selectedNpc = npcs.find(n => n.id === selectedNpcId) ?? null

  return (
    <AppShell
      breadcrumbs={[{ label: 'Painel do Mestre' }]}
      playerName={gmName}
      playerRole="MESTRE · CAMPANHA ATIVA"
    >
      <div style={{ padding: '0 24px 32px' }}>

        {/* Page header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '22px 0 18px',
            borderBottom: '1px solid rgba(139,112,48,0.22)',
            marginBottom: 0,
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
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(139,112,48,0.22)', marginBottom: 22 }}>
          <button style={tabStyle(tab === 'session')} onClick={() => setTab('session')}>
            Sessão
          </button>
          <button style={tabStyle(tab === 'npcs')} onClick={() => setTab('npcs')}>
            NPCs &amp; Monstros
          </button>
        </div>

        {/* Tab: Session */}
        {tab === 'session' && (
          <>
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

                <input
                  type="text"
                  value={sessionName}
                  onChange={e => setSessionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createSession()}
                  placeholder="Nome da sessão..."
                  style={{
                    width: '100%',
                    background: 'var(--ink-deep)',
                    border: '1px solid rgba(139,112,48,0.28)',
                    color: 'var(--parchment-light)',
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 13,
                    padding: '9px 12px',
                    outline: 'none',
                    borderRadius: 1,
                    boxSizing: 'border-box',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
                    marginBottom: 14,
                    transition: `border-color var(--duration-base) var(--ease-ritual)`,
                  }}
                />

                <div
                  style={{
                    borderTop: '1px solid rgba(139,112,48,0.15)',
                    marginBottom: 14,
                  }}
                />

                <button
                  onClick={createSession}
                  disabled={creating || !sessionName.trim()}
                  style={{
                    background: creating ? 'var(--parchment-mid)' : 'var(--blood-mid)',
                    border: `1px solid ${creating ? 'rgba(139,112,48,0.22)' : 'var(--blood-bright)'}`,
                    color: 'var(--parchment-pale)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    padding: '9px 22px',
                    cursor: creating || !sessionName.trim() ? 'not-allowed' : 'pointer',
                    borderRadius: 1,
                    opacity: !sessionName.trim() ? 0.45 : 1,
                    boxShadow: creating ? 'none' : '0 2px 8px rgba(0,0,0,0.5)',
                    transition: `all var(--duration-base) var(--ease-ritual)`,
                  }}
                >
                  {creating ? '⧖ Registrando...' : '⚔ Iniciar Sessão'}
                </button>
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
          </>
        )}

        {/* Tab: NPCs */}
        {tab === 'npcs' && (
          <div className="animate-ink-spread" style={{ paddingTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
                {npcs.length} ficha{npcs.length !== 1 ? 's' : ''} registrada{npcs.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={openCreator}
                style={{
                  background: 'rgba(139,21,21,0.25)',
                  border: '1px solid var(--blood-mid)',
                  color: 'var(--bone-white)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 10,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '12px 18px',
                  cursor: 'pointer',
                  transition: 'all 250ms',
                  minHeight: 44,
                  borderRadius: 1,
                }}
              >
                + Nova Ficha
              </button>
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
              <div className="npc-master-detail">
                {/* Master list */}
                <div className="npc-master-list">
                  {npcs.map(npc => (
                    <NPCListItem
                      key={npc.id}
                      npc={npc}
                      selected={npc.id === selectedNpcId}
                      onSelect={() => setSelectedNpcId(npc.id)}
                    />
                  ))}
                </div>

                {/* Detail pane */}
                <div className="npc-detail-pane">
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
