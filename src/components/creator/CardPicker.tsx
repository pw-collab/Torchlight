'use client'

import { useState, type ReactNode } from 'react'
import { GlyphCard } from '@/components/shared/GlyphCard'
import { Button } from '@/components/ui/button'
import { textGlyph } from '@/lib/utils'

export interface CardOption {
  id: string
  title: string
  /** Small uppercase label under the face divider. */
  caption: string
  /** Symbol drawn in the arch window. */
  glyph: string
  /** Face preview — what is read before the card is opened. */
  description: string
}

interface Props {
  options: CardOption[]
  /** The chosen card. Nothing is chosen while this is empty. */
  selectedId: string
  onSelect: (id: string) => void
  /** The full entry, rendered inside the card's popover. */
  renderDetail: (option: CardOption) => ReactNode
  /** Verb on the popover's action, e.g. "Escolher esta classe". */
  actionLabel: string
  /** How the action reads once this card is the chosen one. */
  chosenLabel: string
  /** Shown in place of the deck when there is nothing to choose from. */
  emptyHint?: string
}

/** Chosen cards carry the verdigris accent; the rest stay in bone. */
const CHOSEN_ACCENT = 'var(--chart-2)'
const IDLE_ACCENT = 'var(--muted-foreground)'

/**
 * A deck of sheet cards used as a picker.
 *
 * Same face and popover as the talents and spells on the sheet: the card shows
 * the name and a preview, opening onto the full entry, and the action that
 * commits the choice sits in the popover's footer.
 */
export function CardPicker({
  options, selectedId, onSelect, renderDetail, actionLabel, chosenLabel, emptyHint,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  if (options.length === 0) {
    return emptyHint ? (
      <p className="text-muted-foreground rounded-sm border border-dashed border-[var(--border)] px-4 py-5 text-center text-[11px] italic">
        {emptyHint}
      </p>
    ) : null
  }

  return (
    <div className="grid-6-cards">
      {options.map(option => {
        const chosen = option.id === selectedId
        const accent = chosen ? CHOSEN_ACCENT : IDLE_ACCENT

        return (
          <GlyphCard
            key={option.id}
            glyph={textGlyph(option.glyph)}
            title={option.title}
            caption={option.caption}
            accent={accent}
            description={option.description}
            dividerGlyph={chosen ? '✦' : '⨝'}
            status={chosen ? { text: '✓', color: accent } : null}
            open={openId === option.id}
            onOpenChange={open => setOpenId(open ? option.id : null)}
            popoverHeight={460}
            footer={
              <Button
                variant={chosen ? 'hollow' : 'secondary'}
                onClick={() => { onSelect(option.id); setOpenId(null) }}
                className="tactile flex-1"
                style={chosen ? { borderColor: accent, color: accent } : undefined}
              >
                {chosen ? `✓ ${chosenLabel}` : `✦ ${actionLabel}`}
              </Button>
            }
          >
            {renderDetail(option)}
          </GlyphCard>
        )
      })}
    </div>
  )
}

/** Labelled block inside a card's popover — "Talento", "Traços", "Magia"… */
export function DetailBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3 flex flex-col gap-1 last:mb-0">
      <span className="font-heading text-[8px] tracking-[0.18em] text-[var(--candle-amber)] uppercase">
        {label}
      </span>
      <div className="font-sans text-[13px] leading-relaxed text-[var(--foreground)]">
        {children}
      </div>
    </div>
  )
}
