'use client'

import type { Character } from '@/types/character.types'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface Props {
  character: Character
  onClick: () => void
  expanded: boolean
}

export function PlayerCard({ character, onClick, expanded }: Props) {
  const hpPercent = Math.max(0, (character.hpCurrent / character.hpMax) * 100)
  const hpBarColor = hpPercent > 50 ? '#3D7060' : hpPercent > 25 ? '#C4782A' : '#8B1515'
  const isDead = character.hpCurrent <= 0

  const torchActive = character.torchEndAt !== null
  const torchMins = torchActive
    ? Math.max(0, Math.ceil((new Date(character.torchEndAt!).getTime() - Date.now()) / 60000))
    : null
  const torchLow = torchMins !== null && torchMins <= 10

  return (
    <Card
      render={<button type="button" onClick={onClick} aria-expanded={expanded} />}
      size="sm"
      className={cn(
        'group/player cursor-pointer gap-2 rounded-[2px_1px_3px_1px] border bg-[#2E2210] px-3.5 py-3',
        'text-left shadow-[0_3px_12px_rgba(0,0,0,0.6)] ring-0 transition-all duration-[450ms] ease-[var(--ease-ritual)]',
        'hover:border-[rgba(196,169,106,0.5)] hover:shadow-[0_5px_18px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(196,169,106,0.12)]',
        isDead
          ? 'border-[rgba(139,21,21,0.6)] bg-[#2E2210]'
          : 'border-[rgba(139,112,48,0.32)]',
        expanded &&
          'border-[rgba(196,169,106,0.5)] border-t-2 border-t-[#8B7030] shadow-[0_5px_18px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(196,169,106,0.12)]',
      )}
    >
      <CardHeader className="flex-row items-center justify-between px-0">
        <CardTitle className="font-heading text-[13px] leading-tight font-semibold tracking-[0.05em] text-[#D4C9A0]">
          {character.name}
        </CardTitle>
        {isDead && (
          <Badge
            variant="destructive"
            className="font-heading text-[7.5px] tracking-[0.16em] text-[#C42020] uppercase"
          >
            ☠ Caído
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-2 px-0">
        {/* HP bar */}
        <Progress
          value={hpPercent}
          className="gap-0"
          aria-label={`Pontos de vida: ${character.hpCurrent} de ${character.hpMax}`}
        >
          <ProgressTrack className="h-[3px] rounded-[1px] bg-[#130E07]">
            <ProgressIndicator
              className="transition-[width] duration-[400ms]"
              style={{ background: hpBarColor, boxShadow: `0 0 4px ${hpBarColor}80` }}
            />
          </ProgressTrack>
        </Progress>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[#C4A96A]">
            PV {character.hpCurrent}/{character.hpMax}
          </span>
          <span className="font-mono text-[9px] text-[#7A6030]">CA {character.ac}</span>
          <span className="font-heading text-[8.5px] text-[#C9A84C]">✦ {character.luckTokens}</span>
          <span
            className={cn(
              'font-mono text-[9px]',
              torchLow ? 'text-[#C42020]' : torchActive ? 'text-[#C4782A]' : 'text-[#3A2E18]',
            )}
          >
            {torchActive ? (torchLow ? `⚠ ${torchMins}min` : `🕯 ${torchMins}min`) : '🌑'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
