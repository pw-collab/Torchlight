'use client'

import { useEffect, useRef } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FavouriteIcon,
  SparklesIcon,
  SquareLock01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import type { LevelRewardKind, LevelState } from '@/lib/progression'
import { cn } from '@/lib/utils'

interface Props {
  track: LevelState[]
  /** Level whose card is open in the body. */
  selected: number
  /** Hit die sides of the character's class — printed on the HP boxes. */
  hitDie: number
  /** 0–1 fill of the current level's box, driven by XP. */
  currentProgress: number
  onSelect: (level: number) => void
}

const STATUS_LABEL: Record<LevelState['status'], string> = {
  sealed: 'OK',
  open: 'ABR',
  locked: 'BLQ',
}

/**
 * The battlepass strip: one box per level, 1 → 20, pinned to the bottom of the
 * Progresso tab. Boxes carry their own state (sealed / open / locked), the box
 * the character is standing on is the one that fills with XP, and the selected
 * box pops upward because its card is what the body is showing.
 *
 * Plain buttons rather than the Tabs primitive — these switch a view inside the
 * page, they do not label panels.
 */
export function LevelTrack({ track, selected, hitDie, currentProgress, onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const boxRefs = useRef<Record<number, HTMLButtonElement | null>>({})

  // Keep the open card's box in view — including on first paint, where the
  // character's level can sit well past the right edge of the strip.
  useEffect(() => {
    const scroller = scrollerRef.current
    const box = boxRefs.current[selected]
    if (!scroller || !box) return
    const target = box.offsetLeft - scroller.clientWidth / 2 + box.offsetWidth / 2
    scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [selected])

  function nudge(direction: -1 | 1) {
    const scroller = scrollerRef.current
    if (!scroller) return
    scroller.scrollBy({ left: direction * Math.max(240, scroller.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="flex w-full items-stretch gap-1">
      <TrackArrow direction={-1} onClick={() => nudge(-1)} />

      <div
        ref={scrollerRef}
        className="relative flex-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex min-w-full items-end justify-start gap-1.5 px-1 pt-4 pb-1">
          {track.map(state => (
            <LevelBox
              key={state.level}
              ref={el => { boxRefs.current[state.level] = el }}
              state={state}
              hitDie={hitDie}
              isSelected={state.level === selected}
              fill={fillFor(state, currentProgress)}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>

      <TrackArrow direction={1} onClick={() => nudge(1)} />
    </div>
  )
}

/**
 * How full the rule under a box reads: a finished level is solid, the level the
 * character stands on tracks XP, and a half-rolled level (odd levels carry two
 * rewards) shows how much of it has landed.
 */
function fillFor(state: LevelState, currentProgress: number): number {
  if (state.status === 'sealed') return 1
  const partial = state.rewards.length > 0 ? state.done.length / state.rewards.length : 0
  if (state.isCurrent) return Math.max(partial, currentProgress)
  return partial
}

function TrackArrow({ direction, onClick }: { direction: -1 | 1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === -1 ? 'Níveis anteriores' : 'Próximos níveis'}
      className={cn(
        'tactile hidden shrink-0 cursor-pointer items-center justify-center self-center px-1 sm:flex',
        'text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]',
        'focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
      )}
    >
      <HugeiconsIcon icon={direction === -1 ? ArrowLeft01Icon : ArrowRight01Icon} size={20} strokeWidth={2} />
    </button>
  )
}

interface BoxProps {
  ref: (el: HTMLButtonElement | null) => void
  state: LevelState
  hitDie: number
  isSelected: boolean
  /** 0–1 fill of the rule under the box. */
  fill: number
  onSelect: (level: number) => void
}

function LevelBox({ ref, state, hitDie, isSelected, fill, onSelect }: BoxProps) {
  const { level, rewards, done, status, isCurrent, entry } = state
  const locked = status === 'locked'
  const sealed = status === 'sealed'

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(level)}
      aria-label={`Nível ${level}`}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'tactile group flex shrink-0 cursor-pointer flex-col gap-1 outline-none',
        'focus-visible:ring-ring/50 focus-visible:ring-[3px]',
      )}
    >
      {/* Tick label above the box, as on a printed scale */}
      <span
        className={cn(
          'font-mono self-end pr-0.5 text-[7px] tracking-[0.1em]',
          isCurrent ? 'text-[var(--destructive)]' : 'text-[var(--muted-foreground)]',
        )}
      >
        {`// ${level}`}
      </span>

      <span
        className={cn(
          'flex overflow-hidden border transition-[height,width,background-color,border-color] duration-300 ease-[var(--ease-ritual)]',
          isSelected ? 'h-[94px] w-[124px] sm:h-[106px] sm:w-[142px]' : 'h-[78px] w-[104px] sm:h-[88px] sm:w-[116px]',
          locked && 'bg-secondary/60 border-[var(--border)]',
          !locked && !isCurrent && 'bg-secondary border-[var(--border)]',
          isCurrent && 'bg-destructive border-[var(--muted-foreground)]',
          isSelected && !isCurrent && 'border-[var(--muted-foreground)]',
        )}
      >
        {/* Face — level numeral and what the level grants */}
        <span className="flex min-w-0 flex-1 flex-col justify-between p-1.5 sm:p-2">
          <span className="flex flex-col items-start">
            <span className="flex items-baseline gap-1">
              <span
                className={cn(
                  'font-heading leading-none font-black',
                  isSelected ? 'text-[30px] sm:text-[36px]' : 'text-[24px] sm:text-[28px]',
                  isCurrent
                    ? 'text-background'
                    : locked
                      ? 'text-[var(--muted-foreground)]'
                      : 'text-[var(--foreground)]',
                )}
              >
                {level}
              </span>
              <span
                className={cn(
                  'font-mono text-[7px] tracking-[0.1em]',
                  isCurrent ? 'text-background/70' : 'text-[var(--muted-foreground)]',
                )}
              >
                / NVL
              </span>
            </span>
            <span
              className={cn(
                'mt-0.5 h-px w-6',
                isCurrent ? 'bg-background/60' : locked ? 'bg-transparent' : 'bg-[var(--muted-foreground)]/50',
              )}
            />
          </span>

          {/* One chip per reward — odd levels carry both the die and the talent */}
          <span className="flex flex-wrap items-center gap-[3px]">
            {rewards.map(kind => (
              <RewardChip
                key={kind}
                kind={kind}
                hitDie={hitDie}
                resolvedLabel={
                  done.includes(kind)
                    ? kind === 'hp'
                      ? `+${entry?.hpGain ?? 0}`
                      : '✓'
                    : undefined
                }
                tone={isCurrent ? 'inverted' : locked ? 'muted' : 'normal'}
              />
            ))}
          </span>
        </span>

        {/* Status gutter — glyph over vertical label, as on the reference strip */}
        <span
          className={cn(
            'flex w-[16px] shrink-0 flex-col items-center justify-between border-l py-1.5 sm:w-[18px]',
            isCurrent ? 'border-background/25' : 'border-[var(--border)]',
            sealed && !isCurrent && 'bg-[var(--chart-2)]/20',
          )}
        >
          {sealed ? (
            <HugeiconsIcon
              icon={Tick02Icon}
              size={11}
              strokeWidth={2.4}
              className={isCurrent ? 'text-background' : 'text-[var(--chart-1)]'}
            />
          ) : locked ? (
            <HugeiconsIcon icon={SquareLock01Icon} size={11} strokeWidth={2} className="text-[var(--muted-foreground)]" />
          ) : (
            <span
              className={cn(
                'mt-[3px] block size-[5px] rounded-full',
                isCurrent ? 'bg-background animate-flicker' : 'bg-[var(--muted-foreground)]',
              )}
            />
          )}

          <span
            className={cn(
              'font-mono text-[6.5px] tracking-[0.08em] [writing-mode:vertical-rl] rotate-180',
              isCurrent ? 'text-background/80' : 'text-[var(--muted-foreground)]',
            )}
          >
            {isCurrent && !sealed ? 'EM CURSO' : STATUS_LABEL[status]}
          </span>
        </span>
      </span>

      {/* Fill rule under the box: solid once sealed, XP-driven on the current level */}
      <span className="block h-[3px] w-full bg-[var(--border)]">
        <span
          className={cn(
            'block h-full transition-[width] duration-500 ease-[var(--ease-ritual)]',
            sealed ? 'bg-[var(--chart-1)]' : 'bg-[var(--primary)]',
          )}
          style={{ width: `${Math.round(Math.min(1, Math.max(0, fill)) * 100)}%` }}
        />
      </span>
    </button>
  )
}

function RewardChip({
  kind,
  hitDie,
  resolvedLabel,
  tone,
}: {
  kind: LevelRewardKind
  hitDie: number
  resolvedLabel?: string
  tone: 'normal' | 'inverted' | 'muted'
}) {
  const label = resolvedLabel ?? (kind === 'hp' ? `d${hitDie}` : '2d6')
  return (
    <span
      className={cn(
        'font-mono inline-flex max-w-full items-center gap-[3px] border px-[3px] py-[1px] text-[7px] tracking-[0.04em]',
        tone === 'inverted' && 'border-background/40 bg-background/15 text-background',
        tone === 'normal' && 'border-[var(--border)] bg-[var(--background)]/40 text-[var(--muted-foreground)]',
        tone === 'muted' && 'border-[var(--border)] text-[var(--muted-foreground)]',
      )}
    >
      <HugeiconsIcon icon={kind === 'hp' ? FavouriteIcon : SparklesIcon} size={8} strokeWidth={2} />
      <span className="truncate">{label}</span>
    </span>
  )
}
