'use client'

import { useCharacter } from '@/hooks/useCharacter'
import { AppShell } from '@/components/layout/AppShell'
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

  if (loading) {
    return (
      <AppShell breadcrumbs={['Ficha do Personagem']} playerName={playerName}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
          }}
        >
          <span
            className="animate-flicker"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--parchment-warm)',
            }}
          >
            ✦ O arquivo está sendo consultado...
          </span>
        </div>
      </AppShell>
    )
  }

  if (!character) {
    return (
      <AppShell breadcrumbs={['Ficha do Personagem']} playerName={playerName}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: 13,
              color: 'var(--blood-bright)',
            }}
          >
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

  async function handleTorchUpdate(torchEndAt: string | null) {
    await updateCharacter({ torch_end_at: torchEndAt } as Partial<CharacterRow>)
  }

  return (
    <AppShell
      breadcrumbs={['Ficha do Personagem']}
      playerName={playerName}
      playerRole={`${cls?.name ?? character.classId} · Nível ${character.level}`}
    >
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px 32px' }}>

        {/* Character header */}
        <div
          style={{
            padding: '22px 0 18px',
            borderBottom: '1px solid rgba(139,112,48,0.22)',
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 24,
                  fontWeight: 700,
                  color: 'var(--parchment-pale)',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                  lineHeight: 1.1,
                }}
              >
                {character.name}
              </h1>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontStyle: 'italic',
                  fontSize: 12,
                  color: '#6A5A3A',
                }}
              >
                {cls?.name ?? character.classId} · {ancestry?.name ?? character.ancestryId} · Nível {character.level}
              </p>
            </div>

            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: '#3A2E18',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                paddingTop: 4,
              }}
            >
              FICHA N&#186; {character.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Main column */}
          <div
            style={{
              flex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minWidth: 0,
            }}
          >
            <StatBlock stats={character.stats} />
            <CombatStats
              hpMax={character.hpMax}
              hpCurrent={character.hpCurrent}
              ac={character.ac}
              onHpChange={handleHpChange}
            />
            <DiceRoller characterName={playerName} />
            <Equipment equipment={character.equipment} />
            <Spells classId={character.classId} equippedSpells={character.spells} />
          </div>

          {/* Side column */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              minWidth: 0,
            }}
          >
            <SlotTracker str={character.stats.str} equipment={character.equipment} />
            <LuckTokens luckTokens={character.luckTokens} onChange={handleLuckChange} />
            <TorchTimer
              torchEndAt={character.torchEndAt}
              playerName={playerName}
              characterId={characterId}
              onUpdate={handleTorchUpdate}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
