import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  ChessPawnIcon,
  FencingMaskIcon,
  MagicWand01Icon,
  MaskTheater01Icon,
  Mortarboard02Icon,
} from '@hugeicons/core-free-icons'

/**
 * Where a card came from. A card face carries two different facts — what the
 * card *is* (passive, activation, a choice…) and where it *came from* — and
 * they used to share the one label under the masthead rule. The label keeps
 * the type; the origin moved up into the masthead symbol, so each fact has a
 * place of its own.
 */
export type CardOrigin = 'ancestry' | 'class' | 'archetype' | 'spell' | 'general'

const ORIGIN_ICON: Record<CardOrigin, IconSvgElement> = {
  ancestry:  FencingMaskIcon,
  class:     ChessPawnIcon,
  archetype: MaskTheater01Icon,
  spell:     MagicWand01Icon,
  general:   Mortarboard02Icon,
}

/** How each origin reads in prose — pickers, form fields, hints. */
export const ORIGIN_LABEL: Record<CardOrigin, string> = {
  ancestry:  'Ancestralidade',
  class:     'Classe',
  archetype: 'Arquétipo',
  spell:     'Magia',
  general:   'Geral',
}

/** The 32px symbol every card carries in its masthead. */
export function CardIcon({ icon }: { icon: IconSvgElement }) {
  return <HugeiconsIcon icon={icon} size={32} strokeWidth={1.5} />
}

/**
 * The masthead symbol for a card's origin. Anything without an origin of its
 * own — or with one this set does not cover — falls back to the general mark.
 */
export function OriginIcon({ origin }: { origin?: CardOrigin }) {
  return <CardIcon icon={ORIGIN_ICON[origin!] ?? ORIGIN_ICON.general} />
}
