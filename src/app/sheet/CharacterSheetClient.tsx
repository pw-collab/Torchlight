'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCharacter } from '@/hooks/useCharacter'
import { useDiceRoll } from '@/hooks/useDiceRoll'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AppShell } from '@/components/layout/AppShell'
import { FloatingVitals } from '@/components/sheet/FloatingVitals'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { TabBar } from '@/components/sheet/TabBar'
import { DiceOverlay } from '@/components/sheet/DiceOverlay'
import { RollToasts } from '@/components/sheet/RollToasts'
import { InventoryView } from '@/components/sheet/InventoryView'
import { FloatingTorch } from '@/components/sheet/FloatingTorch'
import { TalentsPanel } from '@/components/sheet/TalentsPanel'
import { ClassPanel } from '@/components/sheet/ClassPanel'
import { Spells } from '@/components/sheet/Spells'
import { BackstoryView } from '@/components/sheet/BackstoryView'
import { sendToDiscord } from '@/lib/discord'
import type { RollResult } from '@/lib/dice'
import type { CharacterRow } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'

type Tab = 'stats' | 'inventory' | 'spells' | 'backstory'

const TAB_LABELS: Record<Tab, string> = {
  stats: 'Atributos',
  inventory: 'Inventário',
  spells: 'Grimório',
  backstory: 'História',
}

interface Props {
  characterId: string
  playerName: string
}

export function CharacterSheetClient({ characterId, playerName }: Props) {
  const { character, loading, updateCharacter, savedAt } = useCharacter(characterId)
  const [tab, setTab] = useState<Tab>('stats')
  const [rollHistory, setRollHistory] = useState<RollResult[]>([])
  const isMobile = useIsMobile()

  // Roll lifecycle: useDiceRoll drives the phase timeline (anticipation →
  // tumble → impact); history/toasts land exactly on the impact frame.
  const onRollSettled = useCallback((result: RollResult) => {
    setRollHistory(prev => [result, ...prev].slice(0, 20))
  }, [])
  const { phase: rollPhase, roll: activeRoll, startRoll } = useDiceRoll({ onSettled: onRollSettled })

  const handleRoll = useCallback((result: RollResult) => {
    startRoll(result)
    sendToDiscord({ type: 'roll', player: playerName, ...result })
  }, [playerName, startRoll])

  // Light-source burn-down
  const inventoryRef = useRef<InventoryItem[]>([])
  const updateRef = useRef(updateCharacter)
  const playerRef = useRef(playerName)
  useEffect(() => { inventoryRef.current = character?.inventory ?? [] }, [character?.inventory])
  useEffect(() => { updateRef.current = updateCharacter }, [updateCharacter])
  useEffect(() => { playerRef.current = playerName }, [playerName])

  useEffect(() => {
    const id = setInterval(() => {
      const inv = inventoryRef.current
      if (!inv.some(i => i.equipped && i.isLight && i.isLit && (i.lightMinutesLeft ?? 0) > 0)) return
      let burnedOut = false
      const updated = inv.map(item => {
        if (!item.equipped || !item.isLight || !item.isLit) return item
        const mins = (item.lightMinutesLeft ?? 0) - 1
        if (mins <= 0) { burnedOut = true; return { ...item, isLit: false, lightMinutesLeft: 0 } }
        return { ...item, lightMinutesLeft: mins }
      })
      updateRef.current({ equipment: updated as any } as Partial<CharacterRow>)
      if (burnedOut) sendToDiscord({ type: 'torch_out', player: playerRef.current })
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  if (loading) {
    return (
      <AppShell breadcrumbs={[{ label: 'Meus arquivos', href: '/home' }, { label: 'Ficha' }]} playerName={playerName}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span className="animate-flicker" style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-warm)' }}>
            ✦ O arquivo está sendo consultado...
          </span>
        </div>
      </AppShell>
    )
  }

  if (!character) {
    return (
      <AppShell breadcrumbs={[{ label: 'Meus arquivos', href: '/home' }, { label: 'Ficha' }]} playerName={playerName}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--blood-bright)' }}>
            Personagem não encontrado no arquivo.
          </p>
        </div>
      </AppShell>
    )
  }

  const cls = getClass(character.classId)
  const ancestry = getAncestry(character.ancestryId)

  async function handleHpChange(newHp: number) {
    await updateCharacter({ hp_current: newHp } as Partial<CharacterRow>)
  }

  async function handleLuckChange(newValue: number) {
    await updateCharacter({ luck_tokens: newValue } as Partial<CharacterRow>)
  }

  async function handleInventoryUpdate(inventory: InventoryItem[]) {
    await updateCharacter({ equipment: inventory as any } as Partial<CharacterRow>)
  }

  async function handleTalentsUpdate(talents: Talent[]) {
    await updateCharacter({ talents: talents as any } as Partial<CharacterRow>)
  }

  async function handleTechniqueStatesChange(states: import('@/types/technique.types').TechniqueState[]) {
    await updateCharacter({ technique_states: states as any } as Partial<CharacterRow>)
  }

  async function handleCurrencyUpdate(patch: { gold?: number; silver?: number; copper?: number }) {
    await updateCharacter(patch as Partial<CharacterRow>)
  }

  async function handleMeleeRangedUpdate(patch: { meleeBonus?: number; rangedBonus?: number }) {
    const dbPatch: Partial<CharacterRow> = {}
    if (patch.meleeBonus !== undefined) (dbPatch as any).melee_bonus = patch.meleeBonus
    if (patch.rangedBonus !== undefined) (dbPatch as any).ranged_bonus = patch.rangedBonus
    await updateCharacter(dbPatch)
  }

  async function handleSpellsChange(spells: string[]) {
    await updateCharacter({ spells } as Partial<CharacterRow>)
  }

  async function handleSpellcastingUpdate(patch: { spellcastingBonus?: number; castingAttr?: string }) {
    const dbPatch: Partial<CharacterRow> = {}
    if (patch.spellcastingBonus !== undefined) (dbPatch as any).spellcasting_bonus = patch.spellcastingBonus
    if (patch.castingAttr !== undefined) (dbPatch as any).casting_attr = patch.castingAttr
    await updateCharacter(dbPatch)
  }

  async function handleAcChange(ac: number) {
    await updateCharacter({ ac } as Partial<CharacterRow>)
  }

  async function handleXpUpdate(xp: number) {
    await updateCharacter({ xp } as Partial<CharacterRow>)
  }

  // Throws so AvatarUpload keeps the error visible instead of showing a
  // portrait that was never written to the row.
  async function handleAvatarUpload(url: string) {
    const saved = await updateCharacter({ portrait_url: url } as Partial<CharacterRow>)
    if (!saved) throw new Error('character row update failed')
  }

  const tabItems = (Object.keys(TAB_LABELS) as Tab[]).map(key => ({ key, label: TAB_LABELS[key] }))

  const vitals = (
    <FloatingVitals
      ac={character.ac}
      hpMax={character.hpMax}
      hpCurrent={character.hpCurrent}
      luckTokens={character.luckTokens}
      onHpChange={handleHpChange}
      onLuckChange={handleLuckChange}
      characterId={characterId}
      portraitUrl={character.portraitUrl}
      characterName={character.name}
      level={character.level}
      xp={character.xp}
      onXpUpdate={handleXpUpdate}
      className={cls?.name ?? character.classId}
      ancestryName={ancestry?.name ?? character.ancestryId}
      onAvatarUpload={handleAvatarUpload}
      editHref={`/sheet/${characterId}/edit`}
      stats={character.stats}
      onRoll={handleRoll}
    />
  )

  const tabContent = (
    <>
      {tab === 'stats' && (
        <div className="grid-12">
          {cls && (
            <div className="col-span-12">
              <ClassPanel
                classData={cls}
                stats={character.stats}
                techniqueStates={character.techniqueStates}
                onStateChange={handleTechniqueStatesChange}
                onRoll={handleRoll}
              />
            </div>
          )}
          <div className="col-span-12">
            <TalentsPanel talents={character.talents} onUpdate={handleTalentsUpdate} onRoll={handleRoll} />
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <InventoryView
          inventory={character.inventory}
          str={character.stats.str}
          dex={character.stats.dex}
          gold={character.gold}
          silver={character.silver}
          copper={character.copper}
          onUpdate={handleInventoryUpdate}
          onAcChange={handleAcChange}
          onCurrencyUpdate={handleCurrencyUpdate}
          onMeleeRangedUpdate={handleMeleeRangedUpdate}
          onRoll={handleRoll}
          meleeBonus={character.meleeBonus}
          rangedBonus={character.rangedBonus}
          playerName={playerName}
        />
      )}

      {tab === 'spells' && (
        <Spells
          classId={character.classId}
          equippedSpells={character.spells}
          spellcastingBonus={character.spellcastingBonus}
          castingAttr={character.castingAttr}
          stats={character.stats}
          onRoll={handleRoll}
          onUpdate={handleSpellcastingUpdate}
          onSpellsChange={handleSpellsChange}
        />
      )}

      {tab === 'backstory' && (
        <BackstoryView character={character} onUpdate={updateCharacter} />
      )}
    </>
  )

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Meus arquivos', href: '/home' },
        { label: character.name },
      ]}
      playerName={playerName}
      playerRole={`${cls?.name ?? character.classId} · Nível ${character.level}`}
    >
      {isMobile ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 12,
          paddingBottom: 'calc(76px + var(--safe-bottom))',
        }}>
          {vitals}
          <div style={{ width: '100%', marginBottom: 40 }}>{tabContent}</div>
        </div>
      ) : (
        // Sidebar + content live on the SAME 12-column grid, so the sidebar is
        // genuinely anchored to the content's left edge (not a viewport-relative
        // guess) and the pair centers together as one unit on wide screens.
        <div className="grid-12" style={{
          alignItems: 'start',
          maxWidth: 1200,
          margin: '0 auto',
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 84,
          paddingBottom: 'calc(90px + var(--safe-bottom))',
        }}>
          <div className="sheet-sidebar">
            {vitals}
          </div>

          {/* Content fills the remaining 9 columns beside the sidebar */}
          <div className="sheet-content" style={{ marginBottom: 42 }}>
            {tabContent}
          </div>
        </div>
      )}

      {/* Bottom navigation bar — tabs + dice FAB as the last button (desktop & mobile) */}
      <TabBar tabs={tabItems} active={tab} onChange={setTab} trailing={<DiceRoller onRoll={handleRoll} />} />

      <FloatingTorch inventory={character.inventory} onClick={() => setTab('inventory')} />
      <DiceOverlay phase={rollPhase} roll={activeRoll} />
      <RollToasts rolls={rollHistory} />
      <SaveSeal savedAt={savedAt} />
    </AppShell>
  )
}

function SaveSeal({ savedAt }: { savedAt: number }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!savedAt) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 1800)
    return () => clearTimeout(t)
  }, [savedAt])

  if (!visible) return null
  return (
    <div
      key={savedAt}
      className="animate-seal"
      style={{
        position: 'fixed',
        bottom: 'calc(72px + var(--safe-bottom))',
        right: 16,
        zIndex: 120,
        fontFamily: 'var(--font-heading)',
        fontSize: 10,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--candle-glow)',
        background: 'var(--card)',
        border: '1px solid var(--primary)',
        borderRadius: 2,
        padding: '6px 12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
      }}
    >
      ✦ Selado
    </div>
  )
}
