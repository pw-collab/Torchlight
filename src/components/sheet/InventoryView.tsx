'use client'

import { useState } from 'react'
import type { InventoryItem, EquipSlot, ItemType } from '@/types/inventory.types'
import type { RollResult } from '@/lib/dice'
import type { Item as CatalogItem } from '@/data/inventory/index'
import { WEAPONS, ARMORS, GEAR } from '@/data/inventory/index'
import { rollDie, rollFormula, modifier } from '@/lib/dice'
import { sendToDiscord } from '@/lib/discord'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { SectionHeading, SectionSubheading } from '@/components/shared/SectionHeading'
import { buttonStyle } from '@/components/shared/buttonStyles'
import type { ButtonVariant } from '@/components/shared/buttonStyles'
import { NumInput } from '@/components/sheet/NumInput'
import { BookViewerModal } from '@/components/sheet/BookViewerModal'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_LABELS: Record<EquipSlot, string> = {
  mainHand: 'Mão',
  offHand: 'Mão',
  armor: 'Armadura',
}

const SLOT_ALLOWED: Record<EquipSlot, ItemType[]> = {
  mainHand: ['weapon', 'shield', 'gear'],
  offHand: ['weapon', 'shield', 'gear'],
  armor: ['armor'],
}

const ITEM_ICON: Record<string, string> = {
  weapon: '⚔',
  armor: '🛡',
  shield: '🛡',
  gear: '⚗',
  treasure: '✦',
  document: '📖',
}

const LIGHT_ICON: Record<string, string> = {
  torch: '🕯',
  candle: '🕯',
  lantern: '🏮',
}

/** SVG icon per item type — falls back to the emoji glyph above until the file exists in /public. */
const ITEM_ICON_SRC: Partial<Record<ItemType, string>> = {
  weapon: '/weapons.svg',
  armor: '/weapons.svg',
  shield: '/weapons.svg',
  gear: '/gear.svg',
  document: '/book.svg',
}
const LIGHT_ICON_SRC = '/light.svg'

// ─── Catalog helpers ──────────────────────────────────────────────────────────

function catalogToInventoryItem(cat: CatalogItem): InventoryItem {
  const n = cat.name.toLowerCase()
  const isLantern = n.includes('lamp')
  const isCandle  = n.includes('vela')
  const isLight   = cat.isTorch || isLantern
  return {
    id: cat.id + '-' + Math.random().toString(36).substring(2, 6),
    name: cat.name,
    description: cat.description,
    slots: cat.weight,
    quantity: 1,
    type: cat.type as ItemType,
    cost: cat.cost,
    ...(cat.weaponType && { weaponKind: cat.weaponType as 'melee' | 'ranged' }),
    ...(cat.damageDie && cat.damageDie !== '-' && { damageDie: cat.damageDie }),
    ...(cat.acBonus  && { acBonus: cat.acBonus }),
    ...(cat.range    && { range: cat.range }),
    ...(isLight && {
      isLight: true,
      lightKind:        isLantern ? 'lantern' : isCandle ? 'candle' : 'torch',
      lightMaxMinutes:  isLantern ? 120       : isCandle ? 30       : 60,
      lightMinutesLeft: isLantern ? 120       : isCandle ? 30       : 60,
    }),
  }
}

// ─── AC Calculation ───────────────────────────────────────────────────────────

function calculateAC(inv: InventoryItem[], dex: number): number {
  const dexMod = Math.floor((dex - 10) / 2)
  const armor  = inv.find(i => i.equipped && i.slot === 'armor'   && i.type === 'armor')
  const shield = inv.find(i => i.equipped && i.slot === 'offHand' && i.type === 'shield')

  let ac = 10 + dexMod
  if (armor?.acBonus) {
    const appliesDex = armor.acBonus < 14
    ac = armor.acBonus + (appliesDex ? dexMod : 0)
  }
  if (shield?.acBonus) ac += shield.acBonus
  return ac
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 7,
      letterSpacing: '0.14em',
      textTransform: 'uppercase' as const,
      color: 'var(--bone-muted)',
      marginBottom: 3,
    }}>
      {children}
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--ink-deep)',
    border: '1px solid rgba(139,112,48,0.28)',
    color: 'var(--parchment-light)',
    fontFamily: 'var(--font-body)',
    fontSize: 11,
    padding: '5px 7px',
    outline: 'none',
    borderRadius: 1,
    boxSizing: 'border-box',
  }
}

type BtnVariant = 'blood' | 'mist' | 'amber' | 'dark' | 'danger' | 'green'

/** Legacy variant names mapped onto the design-system button (Figma 64-849). */
const BTN_VARIANT_MAP: Record<BtnVariant, ButtonVariant> = {
  blood:  'red',
  amber:  'red',
  green:  'red',
  mist:   'dark',
  dark:   'dark',
  danger: 'hollow',
}

function quickBtnStyle(variant: BtnVariant): React.CSSProperties {
  return buttonStyle(BTN_VARIANT_MAP[variant])
}

function isLightSource(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('tocha') || n.includes('torch') || n.includes('lampião') || n.includes('lantern') || n.includes('vela') || n.includes('candle')
}

/** Compact contextual action pill — used for Atk/Dmg/Aparar/Acender inside the tight equip-slot cards. */
function combatPillStyle(tone: 'blood' | 'mist' | 'amber' | 'dark'): React.CSSProperties {
  const map: Record<typeof tone, [string, string]> = {
    blood: ['rgba(139,21,21,0.35)', '#8b1515'],
    mist:  ['rgba(42,26,58,0.35)', 'rgba(107,78,138,0.5)'],
    amber: ['rgba(106,58,10,0.35)', '#6B3A0A'],
    dark:  ['rgba(24,20,12,0.6)', 'rgba(200,184,144,0.25)'],
  }
  const [bg, border] = map[tone]
  return {
    background: bg,
    border: `1px solid ${border}`,
    color: '#f0e8d0',
    fontFamily: 'var(--font-heading)',
    fontSize: 8,
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    padding: '5px 11px',
    borderRadius: 1,
    cursor: 'pointer',
    alignSelf: 'stretch',
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Type-icon image with a graceful fallback to the emoji glyph if the SVG asset is missing/404s. */
function TypeIcon({ src, fallback, size = 44, style }: { src: string; fallback: string; size?: number; style?: React.CSSProperties }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return <span aria-hidden style={{ fontSize: size * 0.5, lineHeight: 1, ...style }}>{fallback}</span>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- small local icon set, no next/image optimization needed
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', ...style }}
      onError={() => setBroken(true)}
    />
  )
}

/** Resolves the correct icon (SVG, with emoji fallback) for an inventory item's type/light state. */
function renderTypeIcon(item: InventoryItem, size = 44) {
  if (item.isLight) {
    const fallback = item.isLit ? '🔥' : LIGHT_ICON[item.lightKind ?? 'torch']
    const lightStyle: React.CSSProperties = item.isLit
      ? { filter: 'drop-shadow(0 0 6px rgba(224,160,64,0.65)) saturate(1.3)' }
      : { opacity: 0.5, filter: 'saturate(0.4)' }
    return <TypeIcon src={LIGHT_ICON_SRC} fallback={fallback} size={size} style={lightStyle} />
  }
  const src = ITEM_ICON_SRC[item.type]
  const fallback = ITEM_ICON[item.type] ?? '⚗'
  if (!src) return <span aria-hidden style={{ fontSize: size * 0.5, lineHeight: 1 }}>{fallback}</span>
  return <TypeIcon src={src} fallback={fallback} size={size} />
}

function TreasureVault({ gold, silver, copper, onUpdate }: {
  gold: number
  silver: number
  copper: number
  onUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
}) {
  const coins = [
    { key: 'gold'   as const, label: 'PO', color: 'var(--gold-bright)',  value: gold },
    { key: 'silver' as const, label: 'PP', color: 'var(--bone-white)',   value: silver },
    { key: 'copper' as const, label: 'PC', color: 'var(--candle-amber)', value: copper },
  ]

  return (
    <div className="worn-border" style={{ padding: 42 }}>
      <SectionSubheading style={{ marginBottom: 10 }}>Tesouro</SectionSubheading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {coins.map(({ key, label, color, value }) => (
          <div
            key={key}
            className="worn-border"
            style={{ background: 'rgba(42,34,16,0.4)', border: '1px solid rgba(139,112,48,0.22)', padding: '8px 10px', textAlign: 'center' }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 4 }}>
              {label}
            </div>
            <NumInput
              value={value}
              min={0}
              onCommit={n => onUpdate({ [key]: n })}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: 22,
                fontWeight: 700,
                color,
                cursor: 'text',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)', marginTop: 6 }}>
        100 moedas = 1 slot de carga.
      </div>
    </div>
  )
}

type CatalogTab = 'weapons' | 'armors' | 'gear'
const CATALOG_TABS: Record<CatalogTab, { label: string; items: CatalogItem[] }> = {
  weapons: { label: 'Armas',        items: WEAPONS },
  armors:  { label: 'Armaduras',    items: ARMORS  },
  gear:    { label: 'Equipamentos', items: GEAR    },
}

function CatalogPickerModal({ onAdd, onClose }: {
  onAdd: (item: InventoryItem) => void
  onClose: () => void
}) {
  const [tab, setTab]     = useState<CatalogTab>('weapons')
  const [query, setQuery] = useState('')

  const allForTab  = CATALOG_TABS[tab].items
  const q          = query.toLowerCase().trim()
  const filtered   = q ? allForTab.filter(i => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) : allForTab

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="worn-border animate-ink-spread"
        style={{
          background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210',
          border: '1px solid rgba(139,112,48,0.42)',
          borderTop: '2px solid #7A6030',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          padding: '18px 20px',
          minWidth: 340,
          maxWidth: 460,
          width: '90vw',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '78vh',
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <OrnateTitle color="var(--parchment-light)" fontSize={10}>Adicionar do Catálogo</OrnateTitle>
        </div>

        <input
          autoFocus
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'rgba(14,10,3,0.8)',
            border: '1px solid rgba(139,112,48,0.35)',
            color: 'var(--parchment-light)',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            padding: '6px 9px',
            outline: 'none',
            borderRadius: 2,
            marginBottom: 10,
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid rgba(139,112,48,0.2)', marginBottom: 0 }}>
          {(Object.keys(CATALOG_TABS) as CatalogTab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? 'rgba(139,112,48,0.15)' : 'none',
                border: 'none',
                borderBottom: `2px solid ${tab === t ? 'var(--gold-oxidized)' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: 8,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: tab === t ? 'var(--parchment-light)' : 'var(--bone-muted)',
                padding: '6px 10px 4px',
                marginBottom: -1,
                transition: 'all 250ms',
              }}
            >
              {CATALOG_TABS[t].label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingTop: 4 }}>
          {filtered.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)', padding: '8px 4px' }}>
              Nenhum item encontrado.
            </p>
          )}
          {filtered.map(cat => (
            <button
              key={cat.id}
              onClick={() => { onAdd(catalogToInventoryItem(cat)); onClose() }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid rgba(139,112,48,0.1)',
                padding: '8px 4px',
                cursor: 'pointer',
                transition: 'background 180ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,112,48,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--parchment-light)', flex: 1 }}>
                  {ITEM_ICON[cat.type] ?? '⚗'} {cat.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--gold-bright)', flexShrink: 0 }}>
                  {cat.cost}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)', marginTop: 1 }}>
                {cat.weight} slot{cat.weight !== 1 ? 's' : ''}
                {cat.damageDie && cat.damageDie !== '-' ? ` · ${cat.damageDie}` : ''}
                {cat.acBonus ? ` · CA ${cat.acBonus}` : ''}
                {cat.range ? ` · ${cat.range}` : ''}
                {cat.description && cat.description !== '-' ? ` — ${cat.description}` : ''}
              </div>
            </button>
          ))}
        </div>

        <button onClick={onClose} style={{ ...quickBtnStyle('dark'), width: '100%', marginTop: 10, padding: '7px 0' }}>
          Fechar
        </button>
      </div>
    </div>
  )
}

const TYPE_LABEL: Record<ItemType, string> = {
  weapon: 'Arma', armor: 'Armadura', shield: 'Escudo',
  gear: 'Equipamento', treasure: 'Tesouro', document: 'Documento',
}

const TYPE_ACCENT: Record<ItemType, { color: string; soft: string }> = {
  weapon:   { color: 'var(--blood-bright)',    soft: 'rgba(139,21,21,0.38)' },
  armor:    { color: 'var(--verdigris-light)', soft: 'rgba(61,112,96,0.4)' },
  shield:   { color: 'var(--verdigris-light)', soft: 'rgba(61,112,96,0.4)' },
  gear:     { color: 'var(--bone-muted)',      soft: 'rgba(139,112,48,0.35)' },
  treasure: { color: 'var(--gold-bright)',     soft: 'rgba(201,168,76,0.35)' },
  document: { color: 'rgba(155,120,190,0.9)',  soft: 'rgba(107,78,138,0.38)' },
}

const GRID_TILE = 80

/** Occupied grid cell ("Default" state, Figma 91-1044) — icon + item name, gold border. */
function ItemIconSlot({ item, selected, onSelect }: {
  item: InventoryItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      title={item.name}
      style={{
        width: GRID_TILE,
        height: GRID_TILE,
        boxSizing: 'border-box',
        margin: '-1px 0 0 -1px',
        background: '#18140c',
        border: `1px solid ${selected ? '#ff444c' : '#c8b890'}`,
        padding: 6,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 3,
        cursor: 'pointer',
        position: 'relative',
        zIndex: selected ? 2 : 1,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {item.equipped && (
        <span aria-hidden style={{
          position: 'absolute', top: 4, left: 4,
          width: 5, height: 5, borderRadius: '50%',
          background: '#4fa98c',
        }} />
      )}
      {item.quantity > 1 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          fontFamily: 'var(--font-numeral)', fontSize: 11,
          color: '#c8b890', lineHeight: 1,
        }}>
          ×{item.quantity}
        </span>
      )}
      <div style={{ flex: '1 0 0', minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {renderTypeIcon(item, 44)}
      </div>
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 8,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        color: '#8a7a5a',
        textAlign: 'center',
        lineHeight: 1.2,
        width: '100%',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {item.name}
      </span>
    </button>
  )
}

/** Free grid cell ("Available" state) — click to add an item from the catalog. */
function GridAvailableTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Adicionar item"
      className="tactile"
      style={{
        width: GRID_TILE,
        height: GRID_TILE,
        boxSizing: 'border-box',
        margin: '-1px 0 0 -1px',
        background: '#18140c',
        border: '1px solid rgba(255,68,76,0.25)',
        padding: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        position: 'relative',
        zIndex: 1,
        transition: 'border-color 200ms, background 200ms',
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,68,76,0.55)'; e.currentTarget.style.background = 'rgba(255,68,76,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,68,76,0.25)'; e.currentTarget.style.background = '#18140c' }}
    >
      <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 32, lineHeight: 1, color: 'rgba(255,68,76,0.25)' }}>+</span>
    </button>
  )
}

/** Non-interactive filler cell ("Empty" state) — diagonal hatch pattern padding the grid to a full row. */
function GridEmptyTile() {
  return (
    <div
      aria-hidden
      style={{
        width: GRID_TILE,
        height: GRID_TILE,
        boxSizing: 'border-box',
        margin: '-1px 0 0 -1px',
        border: '1px dashed rgba(200,184,144,0.25)',
        background: 'repeating-linear-gradient(45deg, rgba(200,184,144,0.10) 0px, rgba(200,184,144,0.10) 1px, transparent 1px, transparent 7px), #18140c',
        position: 'relative',
        zIndex: 0,
      }}
    />
  )
}

/** Placeholder pane shown when no item is selected — keeps the 2-column layout stable. */
function ItemDetailSkeleton() {
  const line = (w: string, h = 8): React.CSSProperties => ({
    width: w,
    height: h,
    background: 'rgba(200,184,144,0.08)',
    borderRadius: 2,
  })
  return (
    <div aria-hidden style={{
      width: '100%',
      boxSizing: 'border-box',
      background: 'rgba(8,6,4,0.5)',
      border: '1px dashed rgba(200,184,144,0.18)',
      padding: '13px 15px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={line('70%', 12)} />
      <div style={line('40%', 7)} />
      <div style={{ height: 1, background: 'rgba(200,184,144,0.1)' }} />
      <div style={line('100%')} />
      <div style={line('85%')} />
      <div style={line('92%')} />
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'rgba(200,184,144,0.35)', textAlign: 'center', margin: '10px 0 4px' }}>
        Selecione um item para ver os detalhes
      </p>
    </div>
  )
}

function ItemDetailPane({ item, onClose, onEdit, onRemove, onEquipToggle, onConsume, onOpen, onRollAttack, onRollDamage, onRollParry }: {
  item: InventoryItem
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
  onEquipToggle?: () => void
  onConsume?: () => void
  onOpen?: () => void
  onRollAttack?: () => void
  onRollDamage?: () => void
  onRollParry?: () => void
}) {
  const accent = TYPE_ACCENT[item.type] ?? TYPE_ACCENT.gear

  return (
    <div className="animate-ink-spread" style={{
      width: '100%',
      boxSizing: 'border-box',
      background: 'rgba(8,6,4,0.95)',
      border: '1px solid rgba(196,32,32,0.25)',
      borderTop: '2px solid var(--blood-bright)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            color: 'var(--parchment-light)',
            lineHeight: 1.2,
            letterSpacing: '0.02em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.name}
          </div>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 7,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: accent.color,
            marginTop: 3,
          }}>
            {TYPE_LABEL[item.type] ?? item.type}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--bone-muted)', fontSize: 11, padding: 2, lineHeight: 1, flexShrink: 0 }}
        >
          ✕
        </button>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)', lineHeight: 1.7 }}>
        {[
          `${item.slots} slot${item.slots !== 1 ? 's' : ''}`,
          item.quantity > 1 ? `×${item.quantity}` : null,
          item.damageDie || null,
          item.acBonus ? `CA ${item.acBonus}` : null,
          item.isLight && item.lightMinutesLeft != null ? `${item.lightMinutesLeft}min` : null,
          item.cost || null,
        ].filter(Boolean).join(' · ')}
      </div>

      {(item.equipped || item.isLit) && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.equipped && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--verdigris-light)', background: 'rgba(42,80,69,0.2)', border: '1px solid rgba(42,80,69,0.35)', padding: '1px 5px' }}>
              Equipado
            </span>
          )}
          {item.isLit && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--candle-amber)', background: 'rgba(196,120,42,0.12)', border: '1px solid rgba(196,120,42,0.3)', padding: '1px 5px' }}>
              Acesa
            </span>
          )}
        </div>
      )}

      {item.description && item.description !== '-' && (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--bone-muted)', lineHeight: 1.55, margin: 0 }}>
          {item.description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
        {onRollAttack && <button onClick={onRollAttack} style={{ ...quickBtnStyle('blood'), textAlign: 'center' }}>⚔ Atacar</button>}
        {onRollDamage && <button onClick={onRollDamage} style={{ ...quickBtnStyle('mist'), textAlign: 'center' }}>Dano</button>}
        {onRollParry && <button onClick={onRollParry} style={{ ...quickBtnStyle('mist'), textAlign: 'center' }}>Aparar</button>}
        {onOpen && <button onClick={onOpen} style={{ ...quickBtnStyle('dark'), textAlign: 'center' }}>📖 Ler</button>}
        {onConsume && <button onClick={onConsume} style={{ ...quickBtnStyle('green'), textAlign: 'center' }}>Consumir</button>}
        {onEquipToggle && (
          <button onClick={onEquipToggle} style={{ ...quickBtnStyle(item.equipped ? 'amber' : 'dark'), textAlign: 'center' }}>
            {item.equipped ? 'Desequipar' : 'Equipar'}
          </button>
        )}
        <button onClick={onEdit} style={{ ...quickBtnStyle('dark'), textAlign: 'center' }}>✎ Editar</button>
        <button onClick={onRemove} style={{ ...quickBtnStyle('danger'), textAlign: 'center' }}>✕ Remover</button>
      </div>
    </div>
  )
}

function ItemFormFields({ form, onChange }: {
  form: Partial<InventoryItem>
  onChange: (f: Partial<InventoryItem>) => void
}) {
  const set = (patch: Partial<InventoryItem>) => onChange({ ...form, ...patch })
  const inp = inputStyle()

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
        <div>
          <FieldLabel>Nome</FieldLabel>
          <input type="text" value={form.name ?? ''} onChange={e => set({ name: e.target.value })} placeholder="ex.: Espada Curta" style={inp} />
        </div>
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <select value={form.type ?? 'gear'} onChange={e => set({ type: e.target.value as ItemType })} style={inp}>
            <option value="gear">Equipamento</option>
            <option value="weapon">Arma</option>
            <option value="armor">Armadura</option>
            <option value="shield">Escudo</option>
            <option value="treasure">Tesouro</option>
            <option value="document">Documento</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <FieldLabel>Slots</FieldLabel>
            <input type="number" value={form.slots ?? 1} min={0} onChange={e => set({ slots: parseInt(e.target.value) || 0 })} style={inp} />
          </div>
          <div>
            <FieldLabel>Qtd</FieldLabel>
            <input type="number" value={form.quantity ?? 1} min={1} onChange={e => set({ quantity: parseInt(e.target.value) || 1 })} style={inp} />
          </div>
        </div>
      </div>

      {form.type === 'weapon' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <FieldLabel>Tipo de Arma</FieldLabel>
            <select value={form.weaponKind ?? 'melee'} onChange={e => set({ weaponKind: e.target.value as any })} style={inp}>
              <option value="melee">Corpo-a-Corpo</option>
              <option value="ranged">À Distância</option>
            </select>
          </div>
          <div>
            <FieldLabel>Bônus Ataque</FieldLabel>
            <input type="number" value={form.attackBonus ?? 0} onChange={e => set({ attackBonus: parseInt(e.target.value) || 0 })} style={inp} />
          </div>
          <div>
            <FieldLabel>Dano</FieldLabel>
            <input type="text" value={form.damageDie ?? ''} placeholder="ex.: 1d8" onChange={e => set({ damageDie: e.target.value })} style={inp} />
          </div>
        </div>
      )}

      {(form.type === 'armor' || form.type === 'shield') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <div>
            <FieldLabel>{form.type === 'shield' ? 'Bônus CA (+)' : 'CA Base'}</FieldLabel>
            <input type="number" value={form.acBonus ?? 0} onChange={e => set({ acBonus: parseInt(e.target.value) || 0 })} style={inp} />
          </div>
          <div>
            <FieldLabel>Descrição</FieldLabel>
            <input type="text" value={form.description ?? ''} placeholder="Propriedades..." onChange={e => set({ description: e.target.value })} style={inp} />
          </div>
        </div>
      )}

      {form.type !== 'armor' && form.type !== 'shield' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <FieldLabel>Custo</FieldLabel>
              <input type="text" value={form.cost ?? ''} placeholder="ex.: 10 PO" onChange={e => set({ cost: e.target.value })} style={inp} />
            </div>
            <div>
              <FieldLabel>Alcance</FieldLabel>
              <input type="text" value={form.range ?? ''} placeholder="ex.: 30m" onChange={e => set({ range: e.target.value })} style={inp} />
            </div>
          </div>
          <div>
            <FieldLabel>Descrição / Propriedades</FieldLabel>
            <input type="text" value={form.description ?? ''} placeholder="Propriedades especiais..." onChange={e => set({ description: e.target.value })} style={inp} />
          </div>
        </>
      )}
    </>
  )
}

function AddItemForm({ onAdd, onCancel, initialForm }: {
  onAdd: (i: InventoryItem) => void
  onCancel: () => void
  initialForm?: Partial<InventoryItem>
}) {
  const [form, setForm] = useState<Partial<InventoryItem>>({ type: 'gear', slots: 1, quantity: 1, ...initialForm })

  function submit() {
    if (!form.name?.trim()) return
    const autoLight = isLightSource(form.name)
    const item: InventoryItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: form.name,
      description: form.description ?? '',
      slots: form.slots ?? 1,
      quantity: form.quantity ?? 1,
      type: form.type ?? 'gear',
      weaponKind: form.weaponKind,
      attackBonus: form.attackBonus,
      damageDie: form.damageDie,
      acBonus: form.acBonus,
      cost: form.cost,
      range: form.range,
      content: form.content,
      isLight: autoLight || form.isLight,
      lightKind: autoLight ? 'torch' : form.lightKind,
      lightMaxMinutes: autoLight ? 60 : form.lightMaxMinutes,
      lightMinutesLeft: autoLight ? 60 : (form.lightMinutesLeft ?? form.lightMaxMinutes),
    }
    onAdd(item)
  }

  return (
    <div
      className="worn-border animate-ink-spread"
      style={{
        background: 'rgba(42,34,16,0.4)',
        border: '1px solid rgba(139,112,48,0.28)',
        padding: '12px 14px',
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <ItemFormFields form={form} onChange={setForm} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={submit} disabled={!form.name?.trim()} style={{ ...quickBtnStyle('blood'), flex: 1, padding: '6px 0' }}>
          Adicionar
        </button>
        <button onClick={onCancel} style={{ ...quickBtnStyle('dark'), flex: 1, padding: '6px 0' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function EditItemForm({ item, onSave, onCancel }: {
  item: InventoryItem
  onSave: (p: Partial<InventoryItem>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<InventoryItem>>(item)
  return (
    <div
      className="worn-border animate-ink-spread"
      style={{
        background: 'rgba(42,34,16,0.4)',
        border: '1px solid rgba(139,112,48,0.28)',
        padding: '12px 14px',
        marginBottom: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <ItemFormFields form={form} onChange={setForm} />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onSave(form)} style={{ ...quickBtnStyle('blood'), flex: 1, padding: '6px 0' }}>
          Salvar
        </button>
        <button onClick={onCancel} style={{ ...quickBtnStyle('dark'), flex: 1, padding: '6px 0' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface Props {
  inventory: InventoryItem[]
  str: number
  dex: number
  gold: number
  silver: number
  copper: number
  onUpdate: (inventory: InventoryItem[]) => void
  onAcChange: (ac: number) => void
  onCurrencyUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
  onMeleeRangedUpdate: (patch: { meleeBonus?: number; rangedBonus?: number }) => void
  onRoll?: (result: RollResult) => void
  meleeBonus: number
  rangedBonus: number
  playerName: string
}

export function InventoryView({
  inventory, str, dex,
  gold, silver, copper,
  onUpdate, onAcChange, onCurrencyUpdate, onMeleeRangedUpdate,
  onRoll, meleeBonus, rangedBonus, playerName,
}: Props) {
  const [selectingSlot, setSelectingSlot] = useState<EquipSlot | null>(null)
  const [addingForm, setAddingForm]       = useState<Partial<InventoryItem> | null>(null)
  const [showCatalog, setShowCatalog]     = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [replaceFor, setReplaceFor]       = useState<string | null>(null)
  const [bookViewItem, setBookViewItem]   = useState<InventoryItem | null>(null)

  const selectedItem = (!editingId && selectedItemId)
    ? inventory.find(i => i.id === selectedItemId) ?? null
    : null
  const editingItem = editingId
    ? inventory.find(i => i.id === editingId) ?? null
    : null

  // NOTE: light-source burn-down now lives in CharacterSheetClient so it
  // keeps ticking on every tab, not only while the inventory is open.

  const usedSlots = inventory.reduce((acc, i) => acc + i.slots * i.quantity, 0)
  const equipped  = (slot: EquipSlot) => inventory.find(i => i.equipped && i.slot === slot)

  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onUpdate(inventory.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id: string) {
    if (id === selectedItemId) setSelectedItemId(null)
    if (id === editingId) setEditingId(null)
    const next = inventory.filter(i => i.id !== id)
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
  }

  function consumeItem(id: string) {
    const item = inventory.find(i => i.id === id)
    if (!item) return
    const nextQty = (item.quantity ?? 1) - 1
    const next = nextQty <= 0
      ? inventory.filter(i => i.id !== id)
      : inventory.map(i => i.id === id ? { ...i, quantity: nextQty } : i)
    onUpdate(next)
    if (nextQty <= 0 && item.equipped) onAcChange(calculateAC(next, dex))
  }

  function addItem(item: InventoryItem) {
    onUpdate([...inventory, item])
    setAddingForm(null)
  }

  function equipItem(id: string, slot: EquipSlot) {
    const next = inventory.map(i => {
      if (i.id === id) return { ...i, equipped: true, slot }
      // free the target slot if another item occupies it
      if (i.equipped && i.slot === slot) return { ...i, equipped: false, slot: undefined as any, isLit: false }
      return i
    })
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
    setSelectingSlot(null)
    setReplaceFor(null)
  }

  function unequipItem(id: string) {
    const next = inventory.map(i =>
      i.id === id ? { ...i, equipped: false, slot: undefined as any, isLit: false } : i
    )
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
  }

  // Equip/unequip triggered from the inventory list (auto slot resolution)
  function toggleEquipFromList(item: InventoryItem) {
    if (item.equipped) { unequipItem(item.id); return }
    if (item.type === 'armor') { equipItem(item.id, 'armor'); return }
    // hand item: fill first empty hand slot, else ask which to replace
    const hands: EquipSlot[] = ['mainHand', 'offHand']
    const emptyHand = hands.find(s => !inventory.some(i => i.equipped && i.slot === s))
    if (emptyHand) { equipItem(item.id, emptyHand); return }
    setReplaceFor(item.id)
  }

  function isEquippable(item: InventoryItem): boolean {
    return item.type === 'weapon' || item.type === 'armor' || item.type === 'shield' || !!item.isLight
  }

  function rollParry(item: InventoryItem) {
    if (!onRoll) return
    const n = Math.max(1, modifier(dex))
    const result = rollFormula(`${n}d6`, `Aparar: ${item.name}`, `Bloqueio (${n}d6)`)
    onRoll(result)
  }

  function rollAttack(item: InventoryItem) {
    if (!onRoll) return
    const isRanged = item.weaponKind === 'ranged'
    const bonus = (isRanged ? rangedBonus : meleeBonus) + (item.attackBonus ?? 0)
    const result = rollDie('d20', `Ataque: ${item.name}`, item.weaponKind ?? 'melee', bonus)
    onRoll(result)
  }

  function rollDamage(item: InventoryItem) {
    if (!onRoll || !item.damageDie) return
    const result = rollFormula(item.damageDie, `Dano: ${item.name}`, 'Arma')
    onRoll(result)
  }

  const unequippedCompatible = (slot: EquipSlot) =>
    inventory.filter(i =>
      !i.equipped &&
      (SLOT_ALLOWED[slot].includes(i.type) || (slot !== 'armor' && i.isLight))
    )

  const calcAC = calculateAC(inventory, dex)

  // Carga (weight capacity) — shown inline in the Inventário header
  const maxSlots = str
  const isEncumbered = usedSlots > maxSlots

  // Grid cells: existing items, then a small buffer of "+" quick-add cells,
  // then diagonal filler padding the grid out to a full row of GRID_COLS.
  const GRID_COLS = 5
  const ADD_BUFFER = 3
  const preFillerCount = inventory.length + ADD_BUFFER
  const totalCells = Math.ceil(preFillerCount / GRID_COLS) * GRID_COLS
  const emptyCellCount = totalCells - preFillerCount

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

        {/* Inventário — grid takes emphasis, Carga inline in the header */}
        <div className="worn-border" style={{ padding: 42 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '2px solid rgba(200,184,144,0.25)', marginBottom: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: '#ff444c', lineHeight: 1, flexShrink: 0 }}>⪧</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 24, color: '#c8b890', lineHeight: 1, whiteSpace: 'nowrap' }}>Inventário</span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginLeft: 4 }}>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 16, color: isEncumbered ? '#ff444c' : '#8a7a5a', lineHeight: 1 }}>
                  {usedSlots}<span style={{ color: isEncumbered ? 'rgba(255,68,76,0.7)' : 'rgba(138,122,90,0.7)' }}>/{maxSlots}</span>
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: isEncumbered ? '#ff444c' : '#8a7a5a', lineHeight: 1 }}>
                  {isEncumbered ? 'Sobrecarregado' : 'Carga'}
                </span>
              </span>
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setAddingForm({})} className="tactile" style={buttonStyle('dark')}>Criar</button>
              <button onClick={() => setShowCatalog(true)} className="tactile" style={buttonStyle('hollow')}>Adicionar</button>
            </div>
          </div>

          {addingForm !== null && (
            <AddItemForm
              initialForm={addingForm}
              onAdd={addItem}
              onCancel={() => setAddingForm(null)}
            />
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {/* Item grid — occupied / available / empty-filler cells */}
            <div style={{ width: GRID_COLS * GRID_TILE, flexShrink: 0, border: '1px solid rgba(200,184,144,0.25)', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }}>
              {inventory.map(item => (
                <ItemIconSlot
                  key={item.id}
                  item={item}
                  selected={selectedItemId === item.id || editingId === item.id}
                  onSelect={() => {
                    if (editingId === item.id) return
                    setSelectedItemId(selectedItemId === item.id ? null : item.id)
                    setEditingId(null)
                  }}
                />
              ))}
              {Array.from({ length: ADD_BUFFER }).map((_, i) => (
                <GridAvailableTile key={`add-${i}`} onClick={() => setShowCatalog(true)} />
              ))}
              {Array.from({ length: emptyCellCount }).map((_, i) => (
                <GridEmptyTile key={`empty-${i}`} />
              ))}
            </div>

            {/* Right pane — always present so the grid width never shifts */}
            <div style={{ width: 220, flexShrink: 0 }}>
              {editingItem ? (
                <EditItemForm
                  item={editingItem}
                  onSave={updated => { updateItem(editingItem.id, updated); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : selectedItem ? (
                <ItemDetailPane
                  item={selectedItem}
                  onClose={() => setSelectedItemId(null)}
                  onEdit={() => setEditingId(selectedItem.id)}
                  onRemove={() => removeItem(selectedItem.id)}
                  onEquipToggle={isEquippable(selectedItem) ? () => toggleEquipFromList(selectedItem) : undefined}
                  onConsume={selectedItem.type === 'gear' ? () => consumeItem(selectedItem.id) : undefined}
                  onOpen={selectedItem.type === 'document' ? () => setBookViewItem(selectedItem) : undefined}
                  onRollAttack={selectedItem.type === 'weapon' && onRoll ? () => rollAttack(selectedItem) : undefined}
                  onRollDamage={selectedItem.damageDie && onRoll ? () => rollDamage(selectedItem) : undefined}
                  onRollParry={selectedItem.type === 'shield' && onRoll ? () => rollParry(selectedItem) : undefined}
                />
              ) : (
                <ItemDetailSkeleton />
              )}
            </div>
          </div>
        </div>

        {/* Itens Equipados + Bônus de Combate */}
        <div className="worn-border" style={{ padding: 42 }}>
          <SectionHeading style={{ marginBottom: 16 }}>Itens Equipados</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['mainHand', 'offHand', 'armor'] as EquipSlot[]).map(slot => {
              const item = equipped(slot)
              return (
                <div
                  key={slot}
                  style={{
                    background: item ? 'rgba(12,8,4,0.7)' : 'rgba(8,6,4,0.5)',
                    border: '2px solid rgba(200,184,144,0.25)',
                    padding: '10px 10px',
                    minHeight: 90,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
                    {SLOT_LABELS[slot]}
                  </span>

                  {item ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#f0e8d0', lineHeight: 1, flexShrink: 0, display: 'inline-flex' }}>
                          {item.isLight
                            ? (item.isLit ? '🔥' : LIGHT_ICON[item.lightKind ?? 'torch'])
                            : ITEM_ICON[item.type] ?? '⚗'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, color: '#c4a96a', flex: 1, lineHeight: 1.3 }}>
                          {item.name}
                        </span>
                      </div>

                      {slot === 'armor' && (item.acBonus || item.type === 'armor') && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)' }}>
                          CA {calcAC}
                        </div>
                      )}

                      {item.type === 'shield' && item.acBonus && (
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)' }}>
                          +{item.acBonus} CA
                        </div>
                      )}

                      {item.type === 'weapon' && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => rollAttack(item)} style={combatPillStyle('blood')}>Atk</button>
                          {item.damageDie && <button onClick={() => rollDamage(item)} style={combatPillStyle('mist')}>Dmg</button>}
                        </div>
                      )}

                      {item.type === 'shield' && onRoll && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => rollParry(item)} style={combatPillStyle('mist')}>Aparar</button>
                        </div>
                      )}

                      {item.isLight && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => {
                              const igniting = !item.isLit
                              updateItem(item.id, { isLit: igniting })
                              if (igniting) sendToDiscord({ type: 'torch_lit', player: playerName, minutesLeft: item.lightMinutesLeft ?? item.lightMaxMinutes ?? 60 })
                            }}
                            style={combatPillStyle(item.isLit ? 'amber' : 'dark')}
                          >
                            {item.isLit ? 'Apagar' : 'Acender'}
                          </button>
                          {item.lightMinutesLeft != null && (
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 8,
                              color: item.isLit
                                ? item.lightMinutesLeft <= 10 ? 'var(--blood-bright)' : 'var(--candle-amber)'
                                : 'var(--bone-muted)',
                            }}>
                              {item.lightMinutesLeft}min
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => unequipItem(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--blood-mid)', alignSelf: 'flex-start', padding: 0 }}
                      >
                        Desequipar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectingSlot(slot)}
                      style={{
                        background: 'none',
                        border: '1px dashed rgba(196,32,32,0.25)',
                        cursor: 'pointer',
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 9,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--parchment-warm)',
                        transition: 'all 300ms',
                        borderRadius: 1,
                      }}
                    >
                      + Equipar
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Bônus de Combate — inline inputs, spellcasting style */}
          <div style={{ marginTop: 20 }}>
            <SectionSubheading trailing={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {([
                  { key: 'meleeBonus' as const, label: 'Corpo-a-corpo', value: meleeBonus },
                  { key: 'rangedBonus' as const, label: 'À distância', value: rangedBonus },
                ] as const).map(({ key, label, value }) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e5e35', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                    <NumInput
                      value={value}
                      onCommit={n => onMeleeRangedUpdate({ [key]: n })}
                      style={{
                        width: 46,
                        background: '#0a0805',
                        border: '1px solid rgba(200,184,144,0.25)',
                        color: value > 0 ? '#4fa98c' : value < 0 ? '#ff444c' : '#c8b890',
                        fontFamily: 'var(--font-numeral)',
                        fontSize: 14,
                        padding: '4px',
                        outline: 'none',
                        borderRadius: 2,
                        textAlign: 'center',
                        boxSizing: 'border-box',
                      }}
                    />
                  </span>
                ))}
              </div>
            }>
              Bônus de Combate
            </SectionSubheading>
          </div>
        </div>

        {/* Treasure */}
        <TreasureVault gold={gold} silver={silver} copper={copper} onUpdate={onCurrencyUpdate} />

      {/* Equip selection modal */}
      {selectingSlot && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectingSlot(null)}
        >
          <div
            className="worn-border animate-ink-spread"
            style={{
              background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210',
              border: '1px solid rgba(139,112,48,0.42)',
              borderTop: '2px solid #7A6030',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
              padding: '20px 24px',
              minWidth: 280,
              maxWidth: 360,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 12 }}>
              <OrnateTitle color="var(--parchment-light)" fontSize={10}>Equipar em {SLOT_LABELS[selectingSlot]}</OrnateTitle>
            </div>

            {unequippedCompatible(selectingSlot).length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)' }}>
                Nenhum item compatível disponível.
              </p>
            ) : (
              unequippedCompatible(selectingSlot).map(item => (
                <button
                  key={item.id}
                  onClick={() => equipItem(item.id, selectingSlot!)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none',
                    borderBottom: '1px solid rgba(139,112,48,0.12)',
                    padding: '8px 0', cursor: 'pointer', transition: 'background 200ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,112,48,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--parchment-light)' }}>
                    {item.isLight ? LIGHT_ICON[item.lightKind ?? 'torch'] : ITEM_ICON[item.type] ?? '⚗'} {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)', marginTop: 1 }}>
                    {item.slots} slot{item.slots !== 1 ? 's' : ''}
                    {item.damageDie ? ` · ${item.damageDie}` : ''}
                    {item.acBonus ? ` · CA ${item.acBonus}` : ''}
                  </div>
                </button>
              ))
            )}
            <button onClick={() => setSelectingSlot(null)} style={{ ...quickBtnStyle('dark'), marginTop: 12, width: '100%' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {replaceFor && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setReplaceFor(null)}
        >
          <div
            className="worn-border animate-ink-spread"
            style={{
              background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(14,10,3,.97) 100%), #2E2210',
              border: '1px solid rgba(139,112,48,0.42)',
              borderTop: '2px solid #7A6030',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
              padding: '20px 24px',
              minWidth: 280,
              maxWidth: 360,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 4 }}>
              <OrnateTitle color="var(--parchment-light)" fontSize={10}>Mãos Ocupadas</OrnateTitle>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--bone-muted)', marginBottom: 12 }}>
              Qual item substituir?
            </p>

            {(['mainHand', 'offHand'] as EquipSlot[])
              .map(slot => ({ slot, item: inventory.find(i => i.equipped && i.slot === slot) }))
              .filter(({ item }) => item)
              .map(({ slot, item }) => (
                <button
                  key={slot}
                  onClick={() => equipItem(replaceFor, slot)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    background: 'none', border: 'none',
                    borderBottom: '1px solid rgba(139,112,48,0.12)',
                    padding: '8px 0', cursor: 'pointer', transition: 'background 200ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,112,48,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--parchment-light)' }}>
                    {item!.isLight ? LIGHT_ICON[item!.lightKind ?? 'torch'] : ITEM_ICON[item!.type] ?? '⚗'} {item!.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)', marginTop: 1 }}>
                    {item!.damageDie ? `${item!.damageDie}` : ''}
                    {item!.acBonus ? `+${item!.acBonus} CA` : ''}
                  </div>
                </button>
              ))}

            <button onClick={() => setReplaceFor(null)} style={{ ...quickBtnStyle('dark'), marginTop: 12, width: '100%' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showCatalog && (
        <CatalogPickerModal
          onAdd={addItem}
          onClose={() => setShowCatalog(false)}
        />
      )}

      {bookViewItem && (
        <BookViewerModal
          item={bookViewItem}
          onClose={() => setBookViewItem(null)}
          onSaveContent={(content) => {
            updateItem(bookViewItem.id, { content })
            setBookViewItem({ ...bookViewItem, content })
          }}
        />
      )}
    </div>
  )
}
