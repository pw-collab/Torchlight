'use client'

import { useCharacter } from '@/hooks/useCharacter'
import { StatBlock } from '@/components/sheet/StatBlock'
import { CombatStats } from '@/components/sheet/CombatStats'
import { SlotTracker } from '@/components/sheet/SlotTracker'
import { LuckTokens } from '@/components/sheet/LuckTokens'
import { TorchTimer } from '@/components/sheet/TorchTimer'
import { DiceRoller } from '@/components/sheet/DiceRoller'
import { Equipment } from '@/components/sheet/Equipment'
import { Spells } from '@/components/sheet/Spells'
import { sendToDiscord } from '@/lib/discord'
import type { CharacterRow } from '@/types/character.types'
import { getClass } from '@/data/classes/index'
import { getAncestry } from '@/data/ancestries/index'

interface Props {
  characterId: string
  playerName: string
}

export function CharacterSheetClient({ characterId, playerName }: Props) {
  const { character, loading, updateCharacter } = useCharacter(characterId)

  if (loading) return <div className="flex min-h-screen items-center justify-center text-amber-400">Loading...</div>
  if (!character) return <div className="flex min-h-screen items-center justify-center text-red-400">Character not found.</div>

  const cls = getClass(character.classId)
  const ancestry = getAncestry(character.ancestryId)

  async function handleHpChange(newHp: number) {
    const delta = newHp - character!.hpCurrent
    await updateCharacter({ hp_current: newHp } as Partial<CharacterRow>)
    await sendToDiscord({ type: 'hp_change', player: playerName, from: character!.hpCurrent, to: newHp, delta })
    if (newHp <= 0) {
      await sendToDiscord({ type: 'player_down', player: playerName })
    }
  }

  async function handleLuckChange(newValue: number) {
    const prev = character!.luckTokens
    await updateCharacter({ luck_tokens: newValue } as Partial<CharacterRow>)
    if (newValue < prev) {
      await sendToDiscord({ type: 'luck_used', player: playerName, remaining: newValue })
    }
  }

  async function handleTorchUpdate(torchEndAt: string | null) {
    await updateCharacter({ torch_end_at: torchEndAt } as Partial<CharacterRow>)
  }

  return (
    <main className="mx-auto max-w-2xl p-4 space-y-4">
      <header className="rounded border border-amber-800 bg-zinc-800 p-4">
        <h1 className="text-2xl font-bold text-amber-400">{character.name}</h1>
        <p className="text-sm text-zinc-400">{cls?.name ?? character.classId} · {ancestry?.name ?? character.ancestryId} · Level {character.level}</p>
      </header>
      <StatBlock stats={character.stats} />
      <CombatStats
        hpMax={character.hpMax}
        hpCurrent={character.hpCurrent}
        ac={character.ac}
        onHpChange={handleHpChange}
      />
      <SlotTracker str={character.stats.str} equipment={character.equipment} />
      <LuckTokens luckTokens={character.luckTokens} onChange={handleLuckChange} />
      <TorchTimer
        torchEndAt={character.torchEndAt}
        playerName={playerName}
        characterId={characterId}
        onUpdate={handleTorchUpdate}
      />
      <DiceRoller characterName={playerName} />
      <Equipment equipment={character.equipment} />
      <Spells classId={character.classId} equippedSpells={character.spells} />
    </main>
  )
}
