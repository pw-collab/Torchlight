'use client'

import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MagicWand01Icon } from '@hugeicons/core-free-icons'
import type { Spell } from '@/data/spells/index'
import { tierNumeral } from '@/data/spells/index'
import type { RollResult } from '@/lib/dice'
import { DETAIL_BODY } from '@/components/shared/GlyphCard'
import { RollableText } from '@/components/shared/RollableText'

/** The wand in a spell card's type tag, sized like the technique deck's kind symbol. */
export function SpellTagIcon() {
  return <HugeiconsIcon icon={MagicWand01Icon} size={18} strokeWidth={1.5} />
}

/** A spell card's type tag: its school, then its circle. */
export function spellCaption(spell: Spell | undefined): string {
  if (!spell) return 'Magia'
  return `${spell.school || spell.type} ${tierNumeral(spell.tier)}`
}

/** The foot of a spell card's face: range and duration, read at a glance. */
export function spellFootnote(spell: Spell | undefined): string | undefined {
  if (!spell) return undefined
  return [spell.range, spell.duration].filter(Boolean).join(' · ') || undefined
}

/**
 * The far side of a spell card: range, duration and casting time on one ruled
 * line, then the full text, at the size the face reads. Shared by the sheet's
 * grimoire and the creator's spell picker so the two never drift apart.
 */
export function SpellDetail({ spell, onRoll, notice, footnote }: {
  spell: Spell
  /** Makes the dice in the text rollable. */
  onRoll?: (r: RollResult) => void
  /** A line above everything else — "Falhou", for a spell lost until rest. */
  notice?: ReactNode
  /** A line under the text — the lists that teach the spell, in the creator. */
  footnote?: ReactNode
}) {
  const meta = [
    { label: 'Alcance', value: spell.range },
    { label: 'Duração', value: spell.duration },
    { label: 'Conjuração', value: spell.castingTime },
  ].filter((m): m is { label: string; value: string } => Boolean(m.value))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notice}
      {meta.length > 0 && (
        <dl style={{ display: 'flex', flexWrap: 'wrap', columnGap: 12, rowGap: 4, margin: 0, paddingBottom: 8, borderBottom: '1px dashed currentColor' }}>
          {meta.map(({ label, value }) => (
            <div key={label} style={{ minWidth: 0 }}>
              <dt style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: '12px', opacity: 0.8 }}>
                {label}
              </dt>
              <dd style={{ margin: 0, fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: '16px' }}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {spell.description && (
        <p style={{ ...DETAIL_BODY, whiteSpace: 'pre-line' }}>
          <RollableText text={spell.description} label={spell.name} onRoll={onRoll} />
        </p>
      )}
      {footnote}
    </div>
  )
}
