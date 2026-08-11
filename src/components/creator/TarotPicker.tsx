'use client'

import type { ReactNode } from 'react'
import { TarotCard, roman } from '@/components/shared/TarotCard'
import { cn } from '@/lib/utils'

export interface TarotOption {
  id: string
  /** Name on the card face and in the detail header. */
  title: string
  /** Small uppercase caption under the face divider. */
  subtitle: string
  /** Symbol drawn in the hex window. */
  glyph: ReactNode
  /** Marks an option as taken/unavailable — greys the card out. */
  dimmed?: boolean
}

interface Props {
  options: TarotOption[]
  /** The chosen card. Nothing is chosen while this is empty. */
  selectedId: string
  onSelect: (id: string) => void
  /** Full detail for the chosen card, rendered in the panel below the deck. */
  renderDetail: (option: TarotOption) => ReactNode
  /** Line shown in place of the panel while nothing is chosen. */
  emptyHint?: string
  className?: string
}

/**
 * A deck of tarot cards with a single detail panel beneath it.
 *
 * Every choice in creation that has a catalog behind it — class, archetype,
 * ancestry — is picked this way: the cards carry the names, and the one place
 * below them carries the full text for whichever card is face-up.
 */
export function TarotPicker({
  options, selectedId, onSelect, renderDetail, emptyHint, className,
}: Props) {
  const selected = options.find(o => o.id === selectedId)

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="tarot-grid">
        {options.map((option, i) => (
          <TarotCard
            key={option.id}
            numeral={roman(i + 1)}
            glyph={option.glyph}
            title={option.title}
            subtitle={option.subtitle}
            accent="var(--candle-amber)"
            accentSoft="var(--border)"
            dimmed={option.dimmed}
            expanded={selectedId === option.id}
            onToggle={() => onSelect(option.id)}
          />
        ))}
      </div>

      {selected ? (
        <DetailPanel
          numeral={roman(options.findIndex(o => o.id === selected.id) + 1)}
          option={selected}
        >
          {renderDetail(selected)}
        </DetailPanel>
      ) : (
        emptyHint && (
          <p className="text-muted-foreground rounded-sm border border-dashed border-[var(--border)] px-4 py-5 text-center text-[11px] italic">
            {emptyHint}
          </p>
        )
      )}
    </div>
  )
}

function DetailPanel({
  option, numeral, children,
}: {
  option: TarotOption
  numeral: string
  children: ReactNode
}) {
  return (
    <section
      aria-live="polite"
      className="animate-ink-spread overflow-hidden rounded-sm border border-[var(--destructive)] bg-[linear-gradient(168deg,var(--card)_0%,var(--background)_100%)]"
    >
      <header className="bg-destructive flex items-center gap-2.5 border-b border-[var(--destructive)] px-3.5 py-2.5">
        <span className="shrink-0 text-[18px] leading-none">{option.glyph}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading truncate text-[15px] leading-tight tracking-[0.05em] text-[var(--bone-white)]">
            {option.title}
          </h3>
          <p className="font-mono mt-0.5 truncate text-[7px] tracking-[0.2em] text-[var(--bone-white)]/75 uppercase">
            {numeral} · {option.subtitle}
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-3.5 px-4 py-4">{children}</div>
    </section>
  )
}

/** Labelled block inside a detail panel — "Item", "Vantagem", "Traços"… */
export function DetailBlock({
  label, children, className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="font-heading text-[7.5px] tracking-[0.2em] text-[var(--candle-amber)] uppercase">
        {label}
      </span>
      <div className="text-[12px] leading-relaxed text-[var(--parchment-light)]">{children}</div>
    </div>
  )
}
