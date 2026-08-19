'use client'

import type { Character } from '@/types/character.types'
import { brightest, minutesLeft } from '@/lib/light'
import { useNow } from '@/hooks/useNow'
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
  const hpBarColor = hpPercent > 50 ? 'var(--chart-2)' : hpPercent > 25 ? 'var(--primary)' : 'var(--destructive)'
  const isDead = character.hpCurrent <= 0

  // The torch column read `torch_end_at`, which nothing has written since light
  // became a per-item thing — every player showed 🌑, always. It now reads the
  // same wall clock the player's own sheet does, so the GM sees the truth with
  // no extra bookkeeping from anyone.
  const now = useNow()
  const light = brightest(character.inventory, now)
  const torchMins = light ? minutesLeft(light, now) : null
  const torchActive = torchMins !== null
  const torchLow = torchMins !== null && torchMins <= 10

  return (
    <Card
      render={<button type="button" onClick={onClick} aria-expanded={expanded} />}
      size="sm"
      className={cn(
        'group/player cursor-pointer gap-2 rounded-[2px_1px_3px_1px] border bg-[var(--card)] px-3.5 py-3',
        'text-left shadow-[0_3px_12px_rgba(0,0,0,0.6)] ring-0 transition-all duration-[450ms] ease-[var(--ease-ritual)]',
        'hover:border-[var(--border)] hover:shadow-[0_5px_18px_rgba(0,0,0,0.7),inset_0_1px_0_var(--border)]',
        isDead
          ? 'border-[var(--destructive)] bg-[var(--card)]'
          : 'border-[var(--border)]',
        expanded &&
          'border-[var(--border)] border-t-2 border-t-[var(--muted-foreground)] shadow-[0_5px_18px_rgba(0,0,0,0.7),inset_0_1px_0_var(--border)]',
      )}
    >
      <CardHeader className="flex-row items-center justify-between px-0">
        <CardTitle className="font-heading text-[13px] leading-tight font-semibold tracking-[0.05em] text-[var(--foreground)]">
          {character.name}
        </CardTitle>
        {isDead && (
          <Badge
            variant="destructive"
            className="font-heading text-[7.5px] tracking-[0.16em] text-[var(--destructive)] uppercase"
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
          <ProgressTrack className="h-[3px] rounded-[1px] bg-[var(--muted)]">
            <ProgressIndicator
              className="transition-[width] duration-[400ms]"
              style={{ background: hpBarColor, boxShadow: `0 0 4px ${hpBarColor}80` }}
            />
          </ProgressTrack>
        </Progress>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] text-[var(--foreground)]">
            PV {character.hpCurrent}/{character.hpMax}
          </span>
          <span className="font-mono text-[9px] text-[var(--muted-foreground)]">CA {character.ac}</span>
          <span className="font-heading text-[8.5px] text-[var(--chart-1)]">✦ {character.luckTokens}</span>
          <span
            className={cn(
              'font-mono text-[9px]',
              torchLow ? 'text-[var(--destructive)]' : torchActive ? 'text-[var(--chart-1)]' : 'text-[var(--muted-foreground)]/40',
            )}
          >
            {torchActive ? (torchLow ? `⚠ ${torchMins}min` : `🕯 ${torchMins}min`) : '🌑'}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
