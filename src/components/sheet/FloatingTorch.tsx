'use client'

import type { InventoryItem } from '@/types/inventory.types'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  inventory: InventoryItem[]
  onClick?: () => void
}

const KIND_LABEL: Record<string, string> = {
  torch: 'Tocha',
  candle: 'Vela',
  lantern: 'Lampião',
}

/**
 * Floating flame indicator pinned over the whole page while an equipped
 * light source is burning. Shows the remaining minutes and a burn-down bar;
 * clicking it jumps to the inventory tab where the light can be managed.
 */
export function FloatingTorch({ inventory, onClick }: Props) {
  const isMobile = useIsMobile()

  const lit = inventory.filter(
    i => i.equipped && i.isLight && i.isLit && (i.lightMinutesLeft ?? 0) > 0
  )
  if (lit.length === 0) return null

  // With multiple sources burning, the longest-lasting one defines the party's light
  const source = lit.reduce((a, b) =>
    (b.lightMinutesLeft ?? 0) > (a.lightMinutesLeft ?? 0) ? b : a
  )
  const mins = source.lightMinutesLeft ?? 0
  const max = source.lightMaxMinutes ?? 60
  const fraction = Math.min(1, mins / max)
  const isLow = mins <= 10

  const accent = isLow ? 'var(--destructive)' : 'var(--chart-1)'
  const haloColor = isLow ? 'var(--destructive)' : 'var(--primary)'

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(
        'animate-drop-in fixed z-90 flex h-auto items-center gap-2.5 rounded-sm bg-[var(--card)] px-3 py-2',
        // Desktop: the top-right corner is the only strip the sheet layout
        // leaves free — the header sits left, the vitals column starts below.
        isMobile ? 'top-[58px] left-2.5' : 'top-6 right-6',
        isLow ? 'border-[var(--destructive)]' : 'border-[var(--primary)]',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
      style={{ boxShadow: `0 4px 16px rgba(0,0,0,0.6), 0 0 14px ${haloColor}` }}
      title={`${KIND_LABEL[source.lightKind ?? 'torch']} acesa — ${mins} min restantes`}
      aria-label={`Fonte de luz acesa: ${source.name}, ${mins} minutos restantes`}
    >
      {/* Flame with breathing halo */}
      <span style={{ position: 'relative', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span
          aria-hidden
          className="animate-torch-halo"
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${haloColor} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
        <span className="animate-flame" style={{ fontSize: 18, lineHeight: 1, filter: isLow ? 'hue-rotate(-18deg) saturate(1.3)' : 'none' }}>
          🔥
        </span>
      </span>

      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, minWidth: 64 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 7.5,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: isLow ? 'var(--destructive)' : 'var(--muted-foreground)',
          whiteSpace: 'nowrap',
        }}>
          {isLow ? '⚠ Quase apagando' : KIND_LABEL[source.lightKind ?? 'torch'] + ' acesa'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1,
          color: accent,
        }}>
          {mins}min
        </span>
        {/* Burn-down bar */}
        <span aria-hidden style={{ width: '100%', height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden', display: 'block' }}>
          <span style={{
            display: 'block',
            height: '100%',
            width: `${fraction * 100}%`,
            background: accent,
            boxShadow: `0 0 4px ${haloColor}`,
            transition: 'width 1s linear',
          }} />
        </span>
      </span>
    </Button>
  )
}
