'use client'

import type { NPC } from '@/types/npc.types'

interface Props {
  npc: NPC
  selected: boolean
  onSelect: () => void
}

export function NPCListItem({ npc, selected, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: selected ? 'rgba(139,112,48,0.18)' : 'rgba(42,34,16,0.3)',
        border: '1px solid',
        borderColor: selected ? 'rgba(196,120,42,0.5)' : 'rgba(139,112,48,0.2)',
        borderLeft: `3px solid ${selected ? 'var(--candle-amber)' : 'transparent'}`,
        borderRadius: 1,
        padding: '10px 12px',
        cursor: 'pointer',
        transition: 'all 200ms',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(60,46,18,0.45)'
          e.currentTarget.style.borderColor = 'rgba(139,112,48,0.4)'
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          e.currentTarget.style.background = 'rgba(42,34,16,0.3)'
          e.currentTarget.style.borderColor = 'rgba(139,112,48,0.2)'
        }
      }}
    >
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 14,
        letterSpacing: '0.03em',
        color: selected ? 'var(--parchment-pale)' : 'var(--parchment-light)',
        lineHeight: 1.2,
        marginBottom: 3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {npc.name}
      </div>

      {npc.npcType && (
        <div style={{
          fontFamily: 'var(--font-body)',
          fontStyle: 'italic',
          fontSize: 11,
          color: 'var(--bone-muted)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 5,
        }}>
          {npc.npcType}
        </div>
      )}

      {/* Quick stat chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {npc.level != null && <Chip label="LV" value={npc.level} />}
        {npc.hp != null && <Chip label="HP" value={npc.hp} />}
        {npc.ac != null && <Chip label="CA" value={npc.ac} />}
      </div>
    </button>
  )
}

function Chip({ label, value }: { label: string; value: number }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 9,
      letterSpacing: '0.06em',
      color: 'var(--bone-muted)',
    }}>
      <span style={{ color: 'rgba(139,112,48,0.7)' }}>{label}</span> {value}
    </span>
  )
}
