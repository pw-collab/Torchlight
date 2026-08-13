'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RosterCharacter } from './roster.types'

/** Edit/delete: the design's 44px square, square corners, dark plate. */
const ACTION_CLASS =
  'tactile size-11 min-h-11 min-w-11 rounded-[1px] border border-[var(--border)] bg-[var(--card)] text-[13px] leading-none text-[var(--muted-foreground)] normal-case'

interface Props {
  char: RosterCharacter
  /**
   * Viewer may open — and equally edit or delete — this character: their own,
   * or any of them as GM. Mirrors what the RLS policies allow, so the card
   * never offers an action the database will refuse.
   */
  canAccess: boolean
  onEdit: () => void
  onDelete: () => void
  index?: number
}

export function RosterCard({ char, canAccess, onEdit, onDelete, index = 0 }: Props) {
  return (
    <article
      className={cn(
        'roster-card card-lift stagger-item flex flex-col items-start bg-[var(--card)]',
        // The viewer's own characters carry the campaign's red rule and a lit
        // edge; everyone else's sit back behind a dimmed border.
        char.isOwn
          ? 'border-2 border-[var(--destructive)] shadow-[0_0_18px_color-mix(in_oklch,var(--destructive),transparent_78%)]'
          : 'border-2 border-[color-mix(in_oklch,var(--muted-foreground),transparent_80%)]',
      )}
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      {/* Portrait fills the card; the scrim drops the lower third to near-black
          so the name and concept stay readable over any artwork. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {char.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage host is not in next.config's remotePatterns
          <img src={char.portraitUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="size-full bg-[repeating-linear-gradient(135deg,var(--border)_0px,var(--border)_1px,transparent_1px,transparent_8px)]" />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_62.5%,rgba(0,0,0,0.8)_86.54%)]" />
      </div>

      <div className="relative flex min-h-px w-full flex-1 flex-col items-start gap-3 px-[18px] py-5">
        {/* Owner strip — grows to fill, which pushes the block below it down to
            the foot of the card the way the design has it. */}
        <div className="flex min-h-px w-full flex-1 items-start gap-6">
          <div className="flex min-w-px flex-1 flex-col items-start">
            <span
              className={cn(
                'rounded-[1px] border px-1.5 py-0.5 text-[7px] leading-[10.5px] tracking-[0.7px] uppercase',
                char.isOwn
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-secondary text-secondary-foreground',
              )}
            >
              {char.isOwn ? '● você' : (char.ownerName ?? 'Jogador')}
            </span>
          </div>

          {canAccess && (
            <div className="roster-card__actions flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                title="Editar ficha"
                aria-label={`Editar ficha de ${char.name}`}
                onClick={onEdit}
                className={cn(ACTION_CLASS, 'hover:text-[var(--foreground)]')}
              >
                ✏
              </Button>
              <Button
                type="button"
                variant="outline"
                title="Excluir ficha"
                aria-label={`Excluir ficha de ${char.name}`}
                onClick={onDelete}
                className={cn(ACTION_CLASS, 'text-[var(--destructive)] hover:border-[var(--destructive)]')}
              >
                ✕
              </Button>
            </div>
          )}
        </div>

        <h2 className="font-heading w-full pt-3 text-[24px] leading-[21.6px] font-bold tracking-[0.72px] break-words text-[var(--foreground)]">
          {char.name}
        </h2>

        <p className="roster-card__concept w-full text-[12px] leading-[18px] break-words text-[var(--muted-foreground)] italic">
          {char.concept ?? 'Sem conceito registrado.'}
        </p>

        {canAccess ? (
          <Button
            nativeButton={false}
            render={<Link href={`/sheet/${char.id}`} />}
            className="font-heading h-11 min-h-11 w-full rounded-[1px] border-primary bg-primary text-primary-foreground hover:bg-primary/80 border px-4 text-[16px] tracking-normal normal-case transition-colors"
          >
            Acessar
          </Button>
        ) : (
          /* Keeps every card's name and concept on the same baseline as the
             ones that do carry a button. */
          <div aria-hidden className="h-11 min-h-11 w-full shrink-0" />
        )}
      </div>
    </article>
  )
}
