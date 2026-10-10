'use client'

import { useState } from 'react'
import type { SessionEvent } from '@/types/session.types'
import {
  FEED_FILTERS,
  eventAccent,
  eventDetail,
  eventGlyph,
  eventHeadline,
  matchesFilter,
  type FeedFilterId,
} from '@/lib/sessionEvents'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'


interface Props {
  events: SessionEvent[]
  loading: boolean
  /** Publica para a mesa uma rolagem que estava escondida (§6.7). */
  onReveal?: (event: SessionEvent) => void
}

function clockOf(at: number): string {
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * O que está acontecendo na mesa, ao vivo.
 *
 * O escopo original tirou o log de sessão do produto, e é exatamente essa
 * decisão que deixava o modo Mestre inerte: ele não via nada acontecer. O
 * Discord não substitui — tira o Mestre do app no meio da mesa.
 *
 * A ordem é a da mesa: o mais recente no topo, porque é o que está sendo
 * resolvido agora. Críticos, quedas e falhas ganham a borda colorida para
 * saltarem de uma lista que corre depressa.
 */
export function SessionFeed({ events, loading, onReveal }: Props) {
  const [filter, setFilter] = useState<FeedFilterId>('all')

  const shown = events.filter(event => matchesFilter(event, filter))

  // Uma rolagem escondida já revelada tem uma segunda linha apontando para ela;
  // o log é append-only, então revelar é publicar de novo, não editar.
  const revealed = new Set(
    events
      .map(event => (event.payload as { revealOf?: string }).revealOf)
      .filter((id): id is string => Boolean(id)),
  )

  return (
    // Ocupa a altura do bloco em que a mesa o põe e rola por dentro.
    <div className="flex h-full flex-col border border-[var(--border)] bg-[var(--card)]">
      <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-1 border-b border-[var(--border)] py-1.5 pr-2 pl-4">
        <span className="font-heading mr-auto text-[11px] tracking-[0.16em] text-[var(--muted-foreground)] uppercase">
          Diário da mesa
        </span>
        {FEED_FILTERS.map(f => (
          <Button
            key={f.id}
            type="button"
            variant="outline"
            onClick={() => setFilter(f.id)}
            className={cn(
              'h-7 px-2 text-[10px] tracking-[0.08em]',
              filter === f.id
                ? 'border-[var(--primary-text)] bg-[var(--input)] text-[var(--foreground)]'
                : 'bg-transparent text-[var(--muted-foreground)]',
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-y-auto"
        aria-live="polite"
        aria-label="Acontecimentos da sessão"
      >
        {loading ? (
          <p className="font-body px-3 py-6 text-center text-[12px] text-[var(--muted-foreground)] italic">
            Consultando o diário...
          </p>
        ) : shown.length === 0 ? (
          <p className="font-body px-3 py-6 text-center text-[12px] text-[var(--muted-foreground)] italic">
            {events.length === 0
              ? 'Nada aconteceu ainda. Assim que alguém rolar um dado, aparece aqui.'
              : 'Nada deste tipo por enquanto.'}
          </p>
        ) : (
          shown.map(event => {
            const accent = eventAccent(event)
            const detail = eventDetail(event)
            const secret = event.visibility === 'gm_only'

            return (
              <div
                key={event.id}
                className="flex items-start gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-b-0"
                style={{
                  borderLeft: `2px solid ${accent ?? 'transparent'}`,
                  background: secret ? 'color-mix(in oklch, var(--muted), transparent 65%)' : undefined,
                }}
              >
                <span aria-hidden className="shrink-0 text-[12px] leading-[1.4]">
                  {eventGlyph(event)}
                </span>

                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className="font-heading text-[12px] leading-snug"
                    style={{ color: accent ?? 'var(--foreground)' }}
                  >
                    {eventHeadline(event)}
                    {secret && (
                      <span className="font-body ml-1.5 text-[11px] text-[var(--muted-foreground)] italic">
                        · {revealed.has(event.id) ? 'revelado à mesa' : 'só você vê'}
                      </span>
                    )}
                  </span>
                  {detail && (
                    <span className="font-mono text-[11px] text-[var(--muted-foreground)]">
                      {detail}
                    </span>
                  )}
                </span>

                {/* O Mestre rola escondido e decide depois se conta (§6.7). */}
                {onReveal && secret && event.kind === 'roll' && !revealed.has(event.id) && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onReveal(event)}
                    title="Mostrar esta rolagem para a mesa inteira"
                    className="h-7 shrink-0 px-2 text-[10px] tracking-[0.08em]"
                  >
                    Revelar
                  </Button>
                )}

                <span className="font-mono shrink-0 text-[10px] text-[var(--muted-foreground)]">
                  {clockOf(event.at)}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
