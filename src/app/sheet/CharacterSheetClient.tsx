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
import { useNow } from '@/hooks/useNow'
import { useDiceRoll } from '@/hooks/useDiceRoll'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AppShell } from '@/components/layout/AppShell'
import { FloatingVitals } from '@/components/sheet/FloatingVitals'
import { FortuneTile } from '@/components/sheet/FortuneBar'
import { TorchStatus } from '@/components/sheet/TorchStatus'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { TabBar } from '@/components/sheet/TabBar'
import { TabRail } from '@/components/sheet/TabRail'
import { DiceOverlay } from '@/components/sheet/DiceOverlay'
import { RollToasts } from '@/components/sheet/RollToasts'
import { InventoryView, TreasureVault } from '@/components/sheet/InventoryView'
import { FloatingTorch } from '@/components/sheet/FloatingTorch'
import { TalentsPanel } from '@/components/sheet/TalentsPanel'
import { ClassPanel } from '@/components/sheet/ClassPanel'
import { Spells } from '@/components/sheet/Spells'
import { BackstoryView } from '@/components/sheet/BackstoryView'
import { sendToDiscord } from '@/lib/discord'
import { minutesLeft, snuffBurnedOut } from '@/lib/light'
import type { RollResult } from '@/lib/dice'
import type { CharacterRow } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'
import { getArchetype } from '@/data/archetypes/index'

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
  const {
    phase: rollPhase,
    roll: activeRoll,
    mode: rollMode,
    throwRoll,
    startRoll,
    settle: settleRoll,
    fallBackToTimed,
  } = useDiceRoll({ onSettled: onRollSettled })

  const handleRoll = useCallback((result: RollResult) => {
    startRoll(result)
    sendToDiscord({ type: 'roll', ...result })
  }, [startRoll])

  /**
   * Light burns on the wall clock now (see `lib/light`): the minutes on screen
   * are derived from when the source was lit, so nothing has to be running for
   * time to pass — the old 60s interval rewrote the whole equipment JSONB every
   * minute and stopped the moment the tab did.
   *
   * The one write left is settling the record when a source reaches zero, which
   * also announces the dark. It's guarded by id because the tick that notices
   * the burn-out can fire again before the write comes back.
   */
  const updateRef = useRef(updateCharacter)
  useEffect(() => { updateRef.current = updateCharacter }, [updateCharacter])

  const now = useNow()
  const inventory = character?.inventory
  const announcedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!inventory) return

    // A source that is burning again has news to give when it next runs out.
    for (const item of inventory) {
      if (minutesLeft(item, now) > 0) announcedRef.current.delete(item.id)
    }

    const fresh = inventory.filter(
      i => i.isLight && i.isLit && minutesLeft(i, now) <= 0 && !announcedRef.current.has(i.id),
    )
    if (fresh.length === 0) return
    for (const item of fresh) announcedRef.current.add(item.id)

    const settled = snuffBurnedOut(inventory, now)
    if (settled) updateRef.current({ equipment: settled as any } as Partial<CharacterRow>)
    sendToDiscord({ type: 'torch_out' })
  }, [inventory, now])

  if (loading) {
    return (
      <AppShell backHref="/home" playerName={playerName}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span className="animate-flicker" style={{ fontFamily: 'var(--font-body)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
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
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 14, color: 'var(--destructive)' }}>
            Personagem não encontrado no arquivo.
          </p>
        </div>
      </AppShell>
    )
  }

  const cls = getClass(character.classId)
  const ancestry = getAncestry(character.ancestryId)
  const archetype = character.archetypeId ? getArchetype(character.archetypeId) : undefined

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

  // Every tab hands the page the same shape: the block that fills the content
  // column's first row and, where the tab has one, the block that fills the
  // second. The page owns placement — tab components only render blocks.
  const tabBlocks: Record<Tab, { primary: React.ReactNode; secondary?: React.ReactNode }> = {
    stats: {
      primary: cls && (
        <ClassPanel
          classData={cls}
          ancestry={ancestry}
          archetype={archetype}
          languages={character.languages}
          stats={character.stats}
          techniqueStates={character.techniqueStates}
          onStateChange={handleTechniqueStatesChange}
          onRoll={handleRoll}
        />
      ),
      secondary: (
        <TalentsPanel talents={character.talents} onUpdate={handleTalentsUpdate} onRoll={handleRoll} />
      ),
    },
    inventory: {
      primary: (
        <InventoryView
          inventory={character.inventory}
          str={character.stats.str}
          dex={character.stats.dex}
          onUpdate={handleInventoryUpdate}
          onAcChange={handleAcChange}
          onMeleeRangedUpdate={handleMeleeRangedUpdate}
          onRoll={handleRoll}
          meleeBonus={character.meleeBonus}
          rangedBonus={character.rangedBonus}
        />
      ),
      secondary: (
        <TreasureVault
          gold={character.gold}
          silver={character.silver}
          copper={character.copper}
          onUpdate={handleCurrencyUpdate}
        />
      ),
    },
    // The grimoire and the backstory are each a single block, so they take
    // both content rows rather than leaving the second one hollow.
    spells: {
      primary: (
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
      ),
    },
    backstory: {
      primary: <BackstoryView character={character} onUpdate={updateCharacter} />,
    },
  }

  const { primary, secondary } = tabBlocks[tab]

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
          gap: 16,
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 16,
          paddingBottom: 'calc(76px + var(--safe-bottom))',
        }}>
          {vitals}
          {primary}
          {secondary}
        </div>
      ) : (
        // The whole sheet sits on one twelve-column grid, laid out as the
        // design's auto-layout: on row 1 the heading (columns 4-9) with
        // fortuna and the light status beside it (10 and 11); the nav rail
        // holding column 3 down rows 2-3; the tab's content filling columns
        // 4-9 of those same rows; the vitals in columns 10-11 of row 2
        // (see .sheet-* in globals.css).
        <div className="sheet-grid">
          <header className="sheet-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 48, color: 'var(--primary-foreground)', lineHeight: 1.15, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {character.name}
            </h1>
            <Link
              href={editHref}
              style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--card-foreground)', textDecoration: 'underline', textUnderlineOffset: '2px', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.7' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Editar
            </Link>
          </header>

          <div className="sheet-fortune">
            <FortuneTile luckTokens={character.luckTokens} onLuckChange={handleLuckChange} />
          </div>

          <div className="sheet-torch">
            <TorchStatus inventory={character.inventory} onClick={() => setTab('inventory')} />
          </div>

          <div className="sheet-rail">
            <TabRail tabs={railItems} active={tab} onChange={setTab} />
          </div>

          <div className={secondary ? 'sheet-primary' : 'sheet-primary sheet-primary--full'}>
            {primary}
          </div>
          {secondary && <div className="sheet-secondary">{secondary}</div>}

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

      {/* Phones have no column to reserve for the light, so they keep the
          floating badge; the desktop grid carries TorchStatus instead. */}
      {isMobile && <FloatingTorch inventory={character.inventory} onClick={() => setTab('inventory')} />}
      <DiceOverlay
        phase={rollPhase}
        roll={activeRoll}
        mode={rollMode}
        throwRoll={throwRoll}
        onSettled={settleRoll}
        onUnavailable={fallBackToTimed}
      />
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
        color: 'var(--card-foreground)',
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
