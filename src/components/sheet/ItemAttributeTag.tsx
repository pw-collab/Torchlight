import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import { KnightShieldIcon } from '@hugeicons/core-free-icons'
import { cn } from '@/lib/utils'

/**
 * One figure on an item's read-only popup (Figma 353:1970, "ItemAttributesTag").
 * A tinted chip: a 14px icon, the figure in the title face, and — for the ones
 * that have a unit — the unit in a smaller, quieter size beside it.
 *
 *   cost      5 sp      the coin
 *   light     60 min    the hourglass, in ember
 *   damage    1d6       the broken heart, in red
 *   distance  C         the arrows, in the muted tone
 *   armor     12        not in the Figma: the shield the pack already uses,
 *                       drawn in the same pattern so armour has a place to go
 */
export type ItemAttributeKind = 'cost' | 'light' | 'damage' | 'distance' | 'armor'

/** The icons the Figma draws as alpha masks, so one file takes any colour. */
function MaskIcon({ src, size, className }: { src: string; size: number; className: string }) {
  return (
    <span
      aria-hidden
      className={cn('block shrink-0', className)}
      style={{
        width: size,
        height: size,
        maskImage: `url(${src})`,
        maskSize: `${size}px ${size}px`,
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
      }}
    />
  )
}

function AttributeIcon({ kind }: { kind: ItemAttributeKind }) {
  switch (kind) {
    case 'cost':
      return <Image src="/items/custo.svg" alt="" width={14} height={14} className="shrink-0" />
    case 'light':
      return <MaskIcon src="/items/tempo-de-luz.png" size={14} className="bg-ember" />
    case 'damage':
      // The Figma centres a 13px mask in the 14px slot.
      return (
        <span aria-hidden className="flex size-[14px] shrink-0 items-center justify-center">
          <MaskIcon src="/items/dano.png" size={13} className="bg-[#ff444c]" />
        </span>
      )
    case 'distance':
      return (
        <span aria-hidden className="flex size-[14px] shrink-0 items-center justify-center">
          <MaskIcon src="/items/alcance.png" size={13} className="bg-muted-foreground" />
        </span>
      )
    case 'armor':
      return (
        <HugeiconsIcon
          icon={KnightShieldIcon}
          size={14}
          strokeWidth={1.5}
          className="text-muted-foreground shrink-0"
          style={{ width: 14, height: 14 }}
        />
      )
  }
}

/** Unit size in the Figma: 14px beside a cost, 12px beside minutes of light. */
const UNIT_SIZE: Partial<Record<ItemAttributeKind, string>> = {
  cost: 'text-[14px]',
  light: 'text-[12px]',
}

export function ItemAttributeTag({ kind, label, value, unit }: {
  kind: ItemAttributeKind
  /** What the figure is, for a screen reader: "Dano", "Custo". */
  label: string
  value: string
  unit?: string
}) {
  return (
    <div className="bg-input flex min-w-0 items-center justify-center gap-1 p-1">
      <AttributeIcon kind={kind} />
      <span className="font-heading flex items-center justify-center leading-[normal] font-normal whitespace-nowrap not-italic">
        <span className="sr-only">{label}: </span>
        <span className="text-foreground text-[16px]">{value}</span>
        {unit && <span className={cn('text-muted-foreground', UNIT_SIZE[kind] ?? 'text-[14px]')}>{unit}</span>}
      </span>
    </div>
  )
}
