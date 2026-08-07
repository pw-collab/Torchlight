'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Backpack03Icon,
  Book02Icon,
  SparklesIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import { useCharacter } from '@/hooks/useCharacter'
import { useDiceRoll } from '@/hooks/useDiceRoll'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AppShell } from '@/components/layout/AppShell'
import { FloatingVitals } from '@/components/sheet/FloatingVitals'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { TabBar } from '@/components/sheet/TabBar'
import { TabRail } from '@/components/sheet/TabRail'
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

// Labels drive the mobile bottom bar; the icons drive the desktop rail.
const TAB_META: Record<Tab, { label: string; icon: IconSvgElement }> = {
  stats:     { label: 'Atributos',  icon: SparklesIcon },
  inventory: { label: 'Inventário', icon: Backpack03Icon },
  spells:    { label: 'Grimório',   icon: Book02Icon },
  backstory: { label: 'História',   icon: UserIcon },
}
const TAB_KEYS = Object.keys(TAB_META) as Tab[]

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
      <AppShell backHref="/home" playerName={playerName}>
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
      <AppShell backHref="/home" playerName={playerName}>
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

  const tabItems = TAB_KEYS.map(key => ({ key, label: TAB_META[key].label }))
  const railItems = TAB_KEYS.map(key => ({ key, ...TAB_META[key] }))
  const editHref = `/sheet/${characterId}/edit`

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
      editHref={editHref}
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
      backHref="/home"
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
        // Rail, main block and vitals share one 12-column grid: the main block
        // fills the six centre columns, so it lands on the horizontal centre of
        // the screen with the icon tabs against its left edge and the vitals
        // against its right (see .sheet-* in globals.css).
        <div className="sheet-grid">
          <div className="sheet-rail">
            <TabRail tabs={railItems} active={tab} onChange={setTab} />
          </div>

          <div className="sheet-main">
            {/* Character name left, Editar right */}
            <header style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 32, color: 'var(--destructive)', lineHeight: 1.15, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {character.name}
              </h1>
              <Link
                href={editHref}
                style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--destructive)', textDecoration: 'underline', textUnderlineOffset: '2px', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
              >
                Editar
              </Link>
            </header>

            {tabContent}
          </div>

          <aside className="sheet-vitals">
            {vitals}
          </aside>
        </div>
      )}

      {/* Navigation: labelled bottom bar on mobile (dice as its trailing
          button), icon rail + free-floating dice button on desktop. */}
      {isMobile ? (
        <TabBar tabs={tabItems} active={tab} onChange={setTab} trailing={<DiceRoller onRoll={handleRoll} />} />
      ) : (
        <DiceRoller onRoll={handleRoll} floating />
      )}

      <FloatingTorch inventory={character.inventory} onClick={() => setTab('inventory')} />
      <DiceOverlay phase={rollPhase} roll={activeRoll} />
      <RollToasts rolls={rollHistory} />
      <SaveSeal savedAt={savedAt} isMobile={isMobile} />
    </AppShell>
  )
}

function SaveSeal({ savedAt, isMobile }: { savedAt: number; isMobile: boolean }) {
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
        // Mobile sits above the bottom bar; desktop tucks into the bottom-left
        // so it never collides with the floating dice button.
        bottom: isMobile ? 'calc(72px + var(--safe-bottom))' : 24,
        ...(isMobile ? { right: 16 } : { left: 24 }),
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
