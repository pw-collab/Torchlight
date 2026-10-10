'use client'

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
    <span className="dd-stat">
      <b>{value}</b>
      <small>{label}</small>
    </span>
  )
}

/**
 * A placa de quem está em foco, à esquerda do painel de baixo: o retrato, o
 * nome, a vida em sangue e os números que pesam na decisão — como a ficha do
 * herói selecionado num RPG de turno. Sem ninguém em foco, ela é da mesa.
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
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="dd-plate__portrait">
            {c.portraitUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={c.portraitUrl} alt="" />
              : <span className="dd-fig__mono" style={{ fontSize: 30 }}>{initials(c.name)}</span>}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="dd-plate__name truncate">{c.name}</span>
            <span className="dd-plate__sub truncate">
              {[cls ? `${cls.name} ${c.level}` : `Nível ${c.level}`, pc.playerName].filter(Boolean).join(' · ')}
            </span>
          </span>
        </div>
        <span className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between">
            <span className="font-heading text-[9px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">Vida</span>
            <span className="font-heading text-[14px] font-bold">{c.hpCurrent} / {c.hpMax}</span>
          </span>
          <HpBar current={c.hpCurrent} max={c.hpMax} />
        </span>
        {mortal !== 'standing' && (
          <span className={cn('dd-tag self-start text-[9px]', mortal === 'stable' && 'dd-tag--heal')}>
            {mortal === 'dying' ? `☠ À beira da morte · ${roundsLabel(rounds ?? 0)}` : mortal === 'stable' ? '✚ Estável' : '☠ Morto'}
          </span>
        )}
        <span className="dd-stats">
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
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="dd-plate__portrait dd-plate__portrait--foe">
            <span className="dd-fig__mono" style={{ fontSize: 30, color: 'oklch(0.72 0.09 30)' }}>{initials(foe.name)}</span>
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="dd-plate__name truncate" style={{ color: 'oklch(0.85 0.07 35)' }}>{foe.name}</span>
            <span className="dd-plate__sub truncate">
              {[sheet?.npcType || (sheet ? 'Do bestiário' : 'Sem ficha'), sheet?.level != null ? `NV ${sheet.level}` : null].filter(Boolean).join(' · ')}
            </span>
          </span>
        </div>
        <span className="flex flex-col gap-1">
          <span className="flex items-baseline justify-between">
            <span className="font-heading text-[9px] font-bold tracking-[0.16em] text-[var(--muted-foreground)] uppercase">Vida</span>
            <span className="font-heading text-[14px] font-bold">{hp} / {max}</span>
          </span>
          <HpBar current={hp} max={max} />
        </span>
        {(foe.defeated || isFleeing(foe)) && (
          <span className={cn('dd-tag self-start text-[9px]', !foe.defeated && 'dd-tag--gold')}>
            {foe.defeated ? '☠ Derrotado' : '🏳 Fugindo'}
          </span>
        )}
        <span className="dd-stats">
          <Stat label="CA" value={foe.ac ?? 10} />
          <Stat label="Ataque" value={signed(foe.atkBonus ?? 0)} />
          <Stat label="Dano" value={foe.damageDie ?? '1d6'} />
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="dd-plate__portrait">
          <span aria-hidden className="text-[30px]" style={{ filter: 'drop-shadow(0 0 8px var(--dd-ember))' }}>🕯</span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="dd-plate__name">{table?.title ?? 'A mesa'}</span>
          <span className="dd-plate__sub">{table?.detail}</span>
        </span>
      </div>
      {table && table.stats.length > 0 && (
        <span className="dd-stats">
          {table.stats.map(stat => <Stat key={stat.label} label={stat.label} value={stat.value} />)}
        </span>
      )}
      <p className="dd-plate__sub m-0 text-[12px]">
        Clique numa figura do palco para comandá-la.
      </p>
    </div>
  )
}
