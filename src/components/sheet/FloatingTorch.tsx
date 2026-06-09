'use client'

import type { InventoryItem } from '@/types/inventory.types'
import { useIsMobile } from '@/hooks/useIsMobile'

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

  const accent = isLow ? 'var(--blood-bright)' : 'var(--candle-amber)'
  const haloColor = isLow ? 'rgba(196,32,32,0.35)' : 'rgba(224,160,64,0.35)'

  return (
    <button
      onClick={onClick}
      className="animate-drop-in"
      title={`${KIND_LABEL[source.lightKind ?? 'torch']} acesa — ${mins} min restantes`}
      aria-label={`Fonte de luz acesa: ${source.name}, ${mins} minutos restantes`}
      style={{
        position: 'fixed',
        top: isMobile ? 58 : 70,
        left: isMobile ? 10 : 'auto',
        right: isMobile ? 'auto' : 24,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: isLow
          ? 'linear-gradient(148deg, rgba(139,21,21,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210'
          : 'linear-gradient(148deg, rgba(106,58,10,.25) 0%, rgba(14,10,3,.97) 100%), #2E2210',
        border: `1px solid ${isLow ? 'rgba(196,32,32,0.45)' : 'rgba(196,120,42,0.4)'}`,
        borderRadius: 2,
        boxShadow: `0 4px 16px rgba(0,0,0,0.6), 0 0 14px ${haloColor}`,
        padding: '8px 12px',
        cursor: onClick ? 'pointer' : 'default',
        WebkitTapHighlightColor: 'transparent',
      }}
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
          color: isLow ? 'var(--blood-bright)' : 'var(--bone-muted)',
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
        <span aria-hidden style={{ width: '100%', height: 2, background: 'rgba(139,112,48,0.2)', borderRadius: 1, overflow: 'hidden', display: 'block' }}>
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
    </button>
  )
}
