'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useCharacter } from '@/hooks/useCharacter'
import { useIsMobile } from '@/hooks/useIsMobile'
import { AppShell } from '@/components/layout/AppShell'
import { StatBlock } from '@/components/sheet/StatBlock'
import { XPBar } from '@/components/sheet/XPBar'
import { SlotTracker } from '@/components/sheet/SlotTracker'
import { FloatingVitals } from '@/components/sheet/FloatingVitals'
import { DiceRoller } from '@/components/sheet/DiceRoller'
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
import { AvatarUpload } from '@/components/sheet/AvatarUpload'

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

  // Light-source burn-down: lives here (not in InventoryView) so lit torches
  // keep counting down regardless of which tab is open.
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
        if (mins <= 0) {
          burnedOut = true
          return { ...item, isLit: false, lightMinutesLeft: 0 }
        }
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

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Meus arquivos', href: '/home' },
        { label: character.name },
      ]}
      playerName={playerName}
      playerRole={`${cls?.name ?? character.classId} · Nível ${character.level}`}
    >
      <div style={{ maxWidth: 740, margin: '0 auto', padding: isMobile ? '0 12px 80px' : '0 24px 80px' }}>

        {/* Character header */}
        <div style={{ padding: isMobile ? '12px 0 14px' : '14px 0 18px', borderBottom: '1px solid rgba(196,32,32,0.18)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
            {/* Avatar frame */}
            <AvatarUpload
              characterId={characterId}
              portraitUrl={character.portraitUrl}
              size={isMobile ? 72 : 96}
              onUpload={url => updateCharacter({ portrait_url: url } as Partial<CharacterRow>)}
            />

            {/* Name + meta — three stable rows: name/edit, subtitle/seal, XP */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: isMobile ? 22 : 30,
                  fontWeight: 400,
                  color: 'var(--parchment-pale)',
                  letterSpacing: '0.05em',
                  lineHeight: 1.1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  minWidth: 0,
                  margin: 0,
                }}>
                  {character.name}
                </h1>
                <Link
                  href={`/sheet/${characterId}/edit`}
                  title="Editar personagem"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(196,32,32,0.08)',
                    border: '1px solid rgba(196,32,32,0.28)',
                    color: 'rgba(200,184,136,0.7)',
                    fontFamily: 'var(--font-body)',
                    fontSize: isMobile ? 13 : 12,
                    borderRadius: 1,
                    padding: isMobile ? '10px 14px' : '4px 10px',
                    textDecoration: 'none',
                    transition: 'all 250ms',
                    minHeight: isMobile ? 44 : 0,
                    flexShrink: 0,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--bone-white)'
                    e.currentTarget.style.borderColor = 'rgba(196,32,32,0.5)'
                    e.currentTarget.style.background = 'rgba(196,32,32,0.15)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'rgba(200,184,136,0.7)'
                    e.currentTarget.style.borderColor = 'rgba(196,32,32,0.28)'
                    e.currentTarget.style.background = 'rgba(196,32,32,0.08)'
                  }}
                >
                  ✎ Editar
                </Link>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--bone-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {cls?.name ?? character.classId} · {ancestry?.name ?? character.ancestryId} · Nível {character.level}
                </p>
                {!isMobile && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(196,32,32,0.38)', letterSpacing: '0.08em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    FICHA N&#186; {character.id.slice(0, 8).toUpperCase()}
                  </span>
                )}
              </div>
              <XPBar level={character.level} xp={character.xp} onUpdate={handleXpUpdate} />
            </div>
          </div>
        </div>

        {/* Attribute row */}
        <div style={{ marginBottom: 14 }}>
          <StatBlock stats={character.stats} onRoll={handleRoll} />
        </div>

        {/* Tab navigation */}
        <div style={{ position: 'relative', display: 'flex', gap: 2, marginBottom: 0, borderBottom: '1px solid rgba(196,32,32,0.20)' }}>
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="tactile"
              style={{
                background: tab === t
                  ? 'linear-gradient(180deg, var(--blood-mid) 0%, #6B0F0F 100%)'
                  : 'none',
                border: 'none',
                borderBottom: '2px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: isMobile ? 11 : 16,
                letterSpacing: isMobile ? '0.06em' : '0.18em',
                textTransform: 'uppercase',
                color: tab === t ? 'var(--bone-white)' : 'rgba(200,184,136,0.55)',
                textShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                padding: isMobile ? '10px 8px' : '8px 18px 6px',
                transition: 'color 300ms, background 300ms',
                marginBottom: -1,
                width: '100%',
                minHeight: 44,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
          {/* Sliding active-tab indicator */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              bottom: -1,
              height: 2,
              width: `${100 / Object.keys(TAB_LABELS).length}%`,
              left: `${(Object.keys(TAB_LABELS) as Tab[]).indexOf(tab) * (100 / Object.keys(TAB_LABELS).length)}%`,
              background: 'var(--blood-bright)',
              boxShadow: '0 0 6px rgba(196,32,32,0.55)',
              transition: 'left 320ms var(--ease-ritual)',
            }}
          />
        </div>

        {/* Tab content border */}
        <div style={{ border: '1px solid rgba(196,32,32,0.18)', borderTop: 'none', marginBottom: 40 }}>

        {/* Tab: Stats */}
        {tab === 'stats' && (
          <div className="sheet-columns">
            {/* Left column: Talentos + Classe */}
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

            {/* Right column: Carga (CA/PV/Fortuna live in the floating vitals card) */}
            <div className="sheet-col-side">
              {/* SlotTracker assumes a panel above it; restore its top border */}
              <div style={{ borderTop: '1px solid rgba(139,112,48,0.33)' }}>
                <SlotTracker str={character.stats.str} equipment={character.inventory.map(i => ({ slots: i.slots }))} />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Inventory */}
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

        {/* Tab: Spells */}
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

        {/* Tab: Backstory */}
        {tab === 'backstory' && (
          <BackstoryView
            character={character}
            onUpdate={updateCharacter}
          />
        )}

        </div>{/* end tab content border */}
      </div>

      <FloatingVitals
        ac={character.ac}
        hpMax={character.hpMax}
        hpCurrent={character.hpCurrent}
        luckTokens={character.luckTokens}
        onHpChange={handleHpChange}
        onLuckChange={handleLuckChange}
      />
      <FloatingTorch inventory={character.inventory} onClick={() => setTab('inventory')} />
      <DiceRoller onRoll={handleRoll} />
      <DiceOverlay isRolling={isRolling} lastResult={lastResult} />
      <RollToasts rolls={rollHistory} />
      <SaveSeal savedAt={savedAt} />
    </AppShell>
  )
}

// Wax-seal flourish confirming an auto-save patch landed.
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
        left: 16,
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
