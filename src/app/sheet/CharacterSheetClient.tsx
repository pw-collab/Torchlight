'use client'

import { useState, useCallback } from 'react'
import { useCharacter } from '@/hooks/useCharacter'
import { AppShell } from '@/components/layout/AppShell'
import { StatBlock } from '@/components/sheet/StatBlock'
import { CombatStats } from '@/components/sheet/CombatStats'
import { CombatBonuses } from '@/components/sheet/CombatBonuses'
import { XPBar } from '@/components/sheet/XPBar'
import { SlotTracker } from '@/components/sheet/SlotTracker'
import { LuckTokens } from '@/components/sheet/LuckTokens'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { DiceOverlay } from '@/components/sheet/DiceOverlay'
import { RollToasts } from '@/components/sheet/RollToasts'
import { InventoryView } from '@/components/sheet/InventoryView'
import { TalentsPanel } from '@/components/sheet/TalentsPanel'
import { Spells } from '@/components/sheet/Spells'
import { CharacterEditModal } from '@/components/sheet/CharacterEditModal'
import { sendToDiscord } from '@/lib/discord'
import type { RollResult } from '@/lib/dice'
import type { CharacterRow } from '@/types/character.types'
import type { InventoryItem } from '@/types/inventory.types'
import type { Talent } from '@/types/talent.types'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'

type Tab = 'stats' | 'inventory' | 'spells'

const TAB_LABELS: Record<Tab, string> = {
  stats: '✦ Atributos',
  inventory: '⚗ Inventário',
  spells: '☽ Magias',
}

interface Props {
  characterId: string
  playerName: string
}

export function CharacterSheetClient({ characterId, playerName }: Props) {
  const { character, loading, updateCharacter } = useCharacter(characterId)
  const [tab, setTab] = useState<Tab>('stats')
  const [rollHistory, setRollHistory] = useState<RollResult[]>([])
  const [isRolling, setIsRolling] = useState(false)
  const [lastResult, setLastResult] = useState<RollResult | null>(null)
  const [showEdit, setShowEdit] = useState(false)

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

  if (loading) {
    return (
      <AppShell breadcrumbs={['Ficha do Personagem']} playerName={playerName}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <span className="animate-flicker" style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-warm)' }}>
            ✦ O arquivo está sendo consultado...
          </span>
        </div>
      </AppShell>
    )
  }

  if (!character) {
    return (
      <AppShell breadcrumbs={['Ficha do Personagem']} playerName={playerName}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--blood-bright)' }}>
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

  async function handleCurrencyUpdate(patch: { gold?: number; silver?: number; copper?: number }) {
    await updateCharacter(patch as Partial<CharacterRow>)
  }

  async function handleCombatBonusUpdate(patch: { meleeBonus?: number; rangedBonus?: number; spellcastingBonus?: number }) {
    const dbPatch: Partial<CharacterRow> = {}
    if (patch.meleeBonus !== undefined) (dbPatch as any).melee_bonus = patch.meleeBonus
    if (patch.rangedBonus !== undefined) (dbPatch as any).ranged_bonus = patch.rangedBonus
    if (patch.spellcastingBonus !== undefined) (dbPatch as any).spellcasting_bonus = patch.spellcastingBonus
    await updateCharacter(dbPatch)
  }

  async function handleAcChange(ac: number) {
    await updateCharacter({ ac } as Partial<CharacterRow>)
  }

  async function handleXpUpdate(xp: number) {
    await updateCharacter({ xp } as Partial<CharacterRow>)
  }

  async function handleCharacterEdit(patch: Partial<CharacterRow>) {
    await updateCharacter(patch)
    setShowEdit(false)
  }

  return (
    <AppShell
      breadcrumbs={['Ficha do Personagem']}
      playerName={playerName}
      playerRole={`${cls?.name ?? character.classId} · Nível ${character.level}`}
    >
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '0 24px 32px' }}>

        {/* Character header */}
        <div style={{ padding: '22px 0 18px', borderBottom: '1px solid rgba(139,112,48,0.22)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, fontWeight: 700, color: 'var(--parchment-pale)', letterSpacing: '0.05em', marginBottom: 4, lineHeight: 1.1 }}>
                  {character.name}
                </h1>
                <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: '#6A5A3A' }}>
                  {cls?.name ?? character.classId} · {ancestry?.name ?? character.ancestryId} · Nível {character.level}
                </p>
              </div>
              <button
                onClick={() => setShowEdit(true)}
                title="Editar personagem"
                style={{
                  background: 'rgba(42,34,16,0.4)',
                  border: '1px solid rgba(139,112,48,0.28)',
                  color: 'var(--bone-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 10,
                  cursor: 'pointer',
                  borderRadius: 1,
                  padding: '4px 8px',
                  lineHeight: 1,
                  transition: 'all 250ms',
                  marginTop: 2,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--parchment-light)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,112,48,0.5)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--bone-muted)'
                  ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,112,48,0.28)'
                }}
              >
                ✏
              </button>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#3A2E18', letterSpacing: '0.08em', whiteSpace: 'nowrap', paddingTop: 4 }}>
              FICHA N&#186; {character.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* XP bar */}
        <div style={{ marginBottom: 14 }}>
          <XPBar level={character.level} xp={character.xp} onUpdate={handleXpUpdate} />
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
          {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'rgba(139,112,48,0.15)' : 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? 'var(--gold-oxidized)' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: 9,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: tab === t ? 'var(--parchment-light)' : 'var(--bone-muted)',
                padding: '8px 16px 6px',
                transition: 'all 300ms',
                marginBottom: -1,
              }}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Tab: Stats */}
        {tab === 'stats' && (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <StatBlock stats={character.stats} onRoll={handleRoll} />
              <CombatStats
                hpMax={character.hpMax}
                hpCurrent={character.hpCurrent}
                ac={character.ac}
                onHpChange={handleHpChange}
              />
              <CombatBonuses
                meleeBonus={character.meleeBonus}
                rangedBonus={character.rangedBonus}
                spellcastingBonus={character.spellcastingBonus}
                onUpdate={handleCombatBonusUpdate}
              />
              <DiceRoller characterName={playerName} onRoll={handleRoll} />
              <TalentsPanel talents={character.talents} onUpdate={handleTalentsUpdate} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <SlotTracker str={character.stats.str} equipment={character.inventory.map(i => ({ itemId: i.id, slots: i.slots }))} />
              <LuckTokens luckTokens={character.luckTokens} onChange={handleLuckChange} />
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
            onRoll={handleRoll}
            meleeBonus={character.meleeBonus}
            rangedBonus={character.rangedBonus}
            playerName={playerName}
          />
        )}

        {/* Tab: Spells */}
        {tab === 'spells' && (
          <Spells classId={character.classId} equippedSpells={character.spells} />
        )}
      </div>

      {showEdit && (
        <CharacterEditModal
          character={character}
          onSave={handleCharacterEdit}
          onClose={() => setShowEdit(false)}
        />
      )}
      <DiceOverlay isRolling={isRolling} lastResult={lastResult} />
      <RollToasts rolls={rollHistory} />
    </AppShell>
  )
}
