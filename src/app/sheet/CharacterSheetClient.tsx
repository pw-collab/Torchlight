'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useCharacter } from '@/hooks/useCharacter'
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
  const [isRolling, setIsRolling] = useState(false)
  const [lastResult, setLastResult] = useState<RollResult | null>(null)
  const isMobile = useIsMobile()

  const handleRoll = useCallback((result: RollResult) => {
    setIsRolling(true)
    setLastResult(result)
    setTimeout(() => {
      setRollHistory(prev => [result, ...prev].slice(0, 20))
      setIsRolling(false)
    }, 600)
    sendToDiscord({
      type: 'roll',
      player: playerName,
      die: result.die,
      result: result.result,
      modifier: result.modifier ?? 0,
      total: result.total,
    })
  }, [playerName])

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
    const delta = newHp - character!.hpCurrent
    await updateCharacter({ hp_current: newHp } as Partial<CharacterRow>)
    await sendToDiscord({ type: 'hp_change', player: playerName, from: character!.hpCurrent, to: newHp, delta })
    if (newHp <= 0) await sendToDiscord({ type: 'player_down', player: playerName })
  }

  async function handleLuckChange(newValue: number) {
    const prev = character!.luckTokens
    await updateCharacter({ luck_tokens: newValue } as Partial<CharacterRow>)
    if (newValue < prev) await sendToDiscord({ type: 'luck_used', player: playerName, remaining: newValue })
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

  const tabItems = (Object.keys(TAB_LABELS) as Tab[]).map(key => ({ key, label: TAB_LABELS[key] }))

  // Desktop tabs are passed as navSlot to AppShell; mobile tabs render as fixed bottom bar
  const navSlot = !isMobile ? (
    <TabBar tabs={tabItems} active={tab} onChange={setTab} />
  ) : undefined

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Meus arquivos', href: '/home' },
        { label: character.name },
      ]}
      playerName={playerName}
      playerRole={`${cls?.name ?? character.classId} · Nível ${character.level}`}
      navSlot={navSlot}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMobile ? 'stretch' : 'center',
        paddingLeft: isMobile ? 12 : 316,
        paddingRight: isMobile ? 12 : 316,
        paddingTop: isMobile ? 12 : 80,
        paddingBottom: isMobile ? 'calc(76px + var(--safe-bottom))' : 80,
      }}>

        {/* FloatingVitals: fixed left sidebar on desktop, inline on mobile */}
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
          onAvatarUpload={url => updateCharacter({ portrait_url: url } as Partial<CharacterRow>)}
          editHref={`/sheet/${characterId}/edit`}
          stats={character.stats}
          onRoll={handleRoll}
        />

        {/* Tab content — page-centered column, panels carry their own gold borders */}
        <div style={{ width: '100%', maxWidth: isMobile ? undefined : 692, marginBottom: 40 }}>

          {tab === 'stats' && (
            <div className="sheet-columns">
              <div className="sheet-col-main" style={{ display: 'flex', flexDirection: 'column' }}>
                <TalentsPanel talents={character.talents} onUpdate={handleTalentsUpdate} onRoll={handleRoll} />
                {cls && (
                  <ClassPanel
                    classData={cls}
                    stats={character.stats}
                    techniqueStates={character.techniqueStates}
                    onStateChange={handleTechniqueStatesChange}
                    onRoll={handleRoll}
                  />
                )}
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

        </div>
      </div>

      {/* Mobile tab bar */}
      {isMobile && (
        <TabBar tabs={tabItems} active={tab} onChange={setTab} />
      )}

      <FloatingTorch inventory={character.inventory} onClick={() => setTab('inventory')} />
      <DiceRoller onRoll={handleRoll} />
      <DiceOverlay isRolling={isRolling} lastResult={lastResult} />
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
        background: 'rgba(28,20,8,0.92)',
        border: '1px solid rgba(196,120,42,0.4)',
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
