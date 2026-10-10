'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { OlympicTorchIcon } from '@hugeicons/core-free-icons'
import type { EncounterActor } from '@/types/encounter.types'
import type { NPC } from '@/types/npc.types'
import type { Seat } from '@/lib/gmActions'
import { getClass } from '@/data/classes/index'
import { dyingRounds, mortalState, roundsLabel } from '@/lib/dying'
import { isFleeing } from '@/lib/encounterSetup'
import { initials } from './Figure'
import { HpBar } from './ui'
import { cn } from '@/lib/utils'

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="gm-stat">
      <b>{value}</b>
      <small>{label}</small>
    </span>
  )
}

/** O retrato e o nome: a linha de cima da placa. */
function Identity({
  portrait, mono, foe, name, sub,
}: {
  portrait: React.ReactNode
  mono?: boolean
  foe?: boolean
  name: string
  sub?: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className={cn('gm-plate__portrait', foe && 'gm-plate__portrait--foe', mono && 'text-[var(--torch)]')}>
        {portrait}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-heading truncate text-[17px] leading-tight text-[var(--foreground)]">{name}</span>
        {sub && <span className="font-body truncate text-[12px] text-[var(--muted-foreground)] italic">{sub}</span>}
      </span>
    </div>
  )
}

/**
 * A placa de quem está em foco, no alto do bloco de ações: o retrato, o
 * nome, a vida e os números que pesam na decisão — os mesmos da coluna de
 * vitais da ficha. Sem ninguém em foco, ela é da mesa.
 */
export function Nameplate({
  pc, foe, sheet, table,
}: {
  pc?: Seat
  foe?: EncounterActor
  /** O statblock de origem do inimigo, quando há. */
  sheet?: NPC
  /** O resumo da mesa, quando ninguém está em foco. */
  table?: { mode: 'combat' | 'exploration'; title: string; detail: string; stats: { label: string; value: string | number }[] }
}) {
  if (pc) {
    const c = pc.character
    const cls = getClass(c.classId)
    const mortal = mortalState(c.conditions)
    const rounds = dyingRounds(c.conditions)
    return (
      <div className="flex flex-col gap-2.5">
        <Identity
          portrait={c.portraitUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={c.portraitUrl} alt="" />
            : initials(c.name)}
          name={c.name}
          sub={[cls ? `${cls.name} ${c.level}` : `Nível ${c.level}`, pc.playerName].filter(Boolean).join(' · ')}
        />
        <HpBar current={c.hpCurrent} max={c.hpMax} />
        {mortal !== 'standing' && (
          <span className={cn('gm-tag self-start', mortal === 'stable' && 'gm-tag--quiet')}>
            {mortal === 'dying' ? `À beira da morte · ${roundsLabel(rounds ?? 0)}` : mortal === 'stable' ? 'Estável' : 'Morto'}
          </span>
        )}
        <span className="gm-stats">
          <Stat label="CA" value={c.ac} />
          <Stat label="Fortuna" value={c.luckTokens} />
          <Stat label="XP" value={c.xp} />
        </span>
      </div>
    )
  }

  if (foe) {
    const hp = foe.hpCurrent ?? 0
    const max = foe.hpMax ?? hp
    return (
      <div className="flex flex-col gap-2.5">
        <Identity
          foe
          portrait={initials(foe.name)}
          name={foe.name}
          sub={[sheet?.npcType || (sheet ? 'Do bestiário' : 'Sem ficha'), sheet?.level != null ? `NV ${sheet.level}` : null].filter(Boolean).join(' · ')}
        />
        <HpBar current={hp} max={max} />
        {(foe.defeated || isFleeing(foe)) && (
          <span className="gm-tag gm-tag--quiet self-start">
            {foe.defeated ? 'Derrotado' : 'Fugindo'}
          </span>
        )}
        <span className="gm-stats">
          <Stat label="CA" value={foe.ac ?? 10} />
          <Stat label="Ataque" value={signed(foe.atkBonus ?? 0)} />
          <Stat label="Dano" value={foe.damageDie ?? '1d6'} />
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Identity
        mono
        portrait={<HugeiconsIcon icon={OlympicTorchIcon} size={26} strokeWidth={1.5} />}
        name={table?.title ?? 'A mesa'}
        sub={table?.detail}
      />
      {table && table.stats.length > 0 && (
        <span className="gm-stats">
          {table.stats.map(stat => <Stat key={stat.label} label={stat.label} value={stat.value} />)}
        </span>
      )}
    </div>
  )
}
