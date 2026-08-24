'use client'

import { cn } from '@/lib/utils'
import { Fragment, useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  BodyArmorIcon,
  BookOpen02Icon,
  BowArrowIcon,
  Coins01Icon,
  FlameIcon,
  KnightShieldIcon,
  Lamp01Icon,
  MoneyBag01Icon,
  OlympicTorchIcon,
  PackageIcon,
  Sword03Icon,
} from '@hugeicons/core-free-icons'
import type { InventoryItem, EquipSlot, ItemType, LightKind, WeaponKind } from '@/types/inventory.types'
import type { RollResult } from '@/lib/dice'
import type { Item as CatalogItem } from '@/data/inventory/index'
import { WEAPONS, ARMORS, GEAR } from '@/data/inventory/index'
import { rollFormula, rollWithMode, modifier } from '@/lib/dice'
import type { RollMode } from '@/lib/dice'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { sendToDiscord } from '@/lib/discord'
import { extinguishSource, lightSource, minutesLeft, snuff } from '@/lib/light'
import { COINS_PER_SLOT, coinSlots, maxSlots, usedSlots } from '@/lib/slots'
import { isTwoHanded } from '@/lib/inventory'
import { useNow } from '@/hooks/useNow'
import { tableNow, type TableClock } from '@/lib/dungeonClock'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { SectionSubheading } from '@/components/shared/SectionHeading'
import { Button, type buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import type { VariantProps } from 'class-variance-authority'

type ButtonVariants = VariantProps<typeof buttonVariants>
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

/**
 * One icon per kind of thing carried, drawn from the same set the rest of the
 * sheet uses. The pack used to reach for four SVG files under /public and fall
 * back to emoji when they 404'd — which they always did, the files being
 * capitalised — so every tile ended up a glyph from a different alphabet.
 */
const TYPE_ICON: Record<ItemType, IconSvgElement> = {
  weapon:   Sword03Icon,
  armor:    BodyArmorIcon,
  shield:   KnightShieldIcon,
  gear:     PackageIcon,
  treasure: Coins01Icon,
  document: BookOpen02Icon,
}

const LIGHT_ICON: Record<LightKind, IconSvgElement> = {
  torch:   OlympicTorchIcon,
  candle:  FlameIcon,
  lantern: Lamp01Icon,
}

/** The icon that stands for an item: its kind, sharpened by what it really is —
    a bow is not a sword, and a source that is burning is a flame. */
function iconFor(item: InventoryItem, burning = false): IconSvgElement {
  if (item.isLight) return burning ? FlameIcon : LIGHT_ICON[item.lightKind ?? 'torch']
  if (item.type === 'weapon' && item.weaponKind === 'ranged') return BowArrowIcon
  return TYPE_ICON[item.type] ?? PackageIcon
}

/** The same reading for a catalog row, which has the shape but not the flags. */
function catalogIconFor(cat: CatalogItem): IconSvgElement {
  const n = cat.name.toLowerCase()
  if (n.includes('lamp')) return Lamp01Icon
  if (cat.isTorch) return n.includes('vela') ? FlameIcon : OlympicTorchIcon
  if (cat.type === 'weapon' && cat.weaponType === 'ranged') return BowArrowIcon
  return TYPE_ICON[cat.type as ItemType] ?? PackageIcon
}

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
  const armor  = inv.find(i => i.equipped && i.slot === 'armor' && i.type === 'armor')
  // A shield is held in a hand — either hand. It used to count only from the
  // off hand, back when the layout gave it a square of its own.
  const shield = inv.find(i => i.equipped && i.type === 'shield' && (i.slot === 'mainHand' || i.slot === 'offHand'))

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
      color: 'var(--muted-foreground)',
      marginBottom: 3,
    }}>
      {children}
    </div>
  )
}

const INPUT_CLASS =
  'h-auto w-full rounded-[1px] border-[var(--border)] bg-[var(--background)] px-[7px] py-[5px] text-[11px] text-[var(--foreground)]'

type BtnVariant = 'blood' | 'mist' | 'amber' | 'dark' | 'danger' | 'green'

/** Legacy variant names mapped onto the shadcn Button variants. */
const BTN_VARIANT_MAP: Record<BtnVariant, ButtonVariants['variant']> = {
  blood:  'default',
  amber:  'default',
  green:  'default',
  mist:   'secondary',
  dark:   'secondary',
  danger: 'hollow',
}

function isLightSource(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('tocha') || n.includes('torch') || n.includes('lampião') || n.includes('lantern') || n.includes('vela') || n.includes('candle')
}

/** Compact contextual action pill — used for Atk/Dmg/Aparar/Acender inside the tight equip-slot cards. */
const COMBAT_PILL_TONE: Record<'blood' | 'mist' | 'amber' | 'dark', string> = {
  blood: 'border-[var(--destructive)] bg-[var(--destructive)]/15',
  mist:  'border-[var(--chart-4)] bg-[var(--muted)]',
  amber: 'border-[var(--primary)] bg-[var(--primary)]/15',
  dark:  'border-[var(--border)] bg-[var(--card)]',
}

function combatPill(tone: keyof typeof COMBAT_PILL_TONE): string {
  return cn(
    'h-auto rounded-[1px] px-3 py-1.5 text-[8px] tracking-[0.8px] text-[var(--foreground)]',
    COMBAT_PILL_TONE[tone],
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * An item drawn as its icon, at whatever size the place it sits calls for.
 * A light source carries its state in the drawing: burning, it glows; spent or
 * stowed, it is dimmed back into the dark.
 */
function ItemGlyph({ item, size = 40, now }: {
  item: InventoryItem
  size?: number
  /** The table's clock, so a burning source is judged against the same time as everything else. */
  now?: number
}) {
  // Burning, not merely flagged lit: a source read after its minutes ran out
  // is dark, whether or not the record has caught up yet.
  const burning = Boolean(item.isLight && item.isLit) && minutesLeft(item, now) > 0
  const style: React.CSSProperties | undefined = item.isLight
    ? burning
      ? { color: 'var(--chart-1)', filter: 'drop-shadow(0 0 6px color-mix(in oklch, var(--chart-1), transparent 40%))' }
      : { opacity: 0.5 }
    : undefined

  return (
    <HugeiconsIcon
      icon={iconFor(item, burning)}
      size={size}
      strokeWidth={1.5}
      // Width and height inline, not just as attributes: `.cn-button` pins every
      // svg it contains to size-4, so inside a tile the asked-for size was
      // simply ignored.
      style={{ width: size, height: size, ...style }}
    />
  )
}

/**
 * The purse, opened. It sits where an item's details would sit, because in the
 * pack the purse *is* an item — clicking it should give you the coins, not a
 * description of a bag.
 */
function CoinPursePane({ gold, silver, copper, slots, onUpdate, onClose }: {
  gold: number
  silver: number
  copper: number
  slots: number
  onUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
  onClose: () => void
}) {
  const coins = [
    { key: 'gold'   as const, label: 'PO', color: 'text-[var(--chart-1)]',           value: gold },
    { key: 'silver' as const, label: 'PP', color: 'text-[var(--foreground)]',        value: silver },
    { key: 'copper' as const, label: 'PC', color: 'text-[var(--muted-foreground)]',  value: copper },
  ]
  const total = gold + silver + copper
  const toNextSlot = COINS_PER_SLOT - (total % COINS_PER_SLOT)

  return (
    <div className="animate-ink-spread" style={{
      width: '100%',
      boxSizing: 'border-box',
      background: 'var(--background)',
      border: '1px solid var(--destructive)',
      borderTop: '2px solid var(--destructive)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--foreground)', lineHeight: 1.2, letterSpacing: '0.02em' }}>
            Bolsa de moedas
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--chart-1)', marginTop: 3 }}>
            Tesouro
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Fechar"
          className="text-muted-foreground shrink-0 text-[11px] leading-none hover:bg-transparent"
        >
          ✕
        </Button>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
        {[
          `${slots} slot${slots !== 1 ? 's' : ''}`,
          `${total} ${total === 1 ? 'moeda' : 'moedas'}`,
        ].join(' · ')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {coins.map(({ key, label, color, value }) => (
          <div
            key={key}
            className="worn-border"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: 8, textAlign: 'center' }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 4 }}>
              {label}
            </div>
            <NumInput
              value={value}
              min={0}
              aria-label={label}
              onCommit={n => onUpdate({ [key]: n })}
              className={cn(
                'font-heading h-auto cursor-text border-none bg-transparent p-0 text-[20px] font-bold',
                color,
              )}
            />
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--muted-foreground)', lineHeight: 1.55, margin: 0 }}>
        {COINS_PER_SLOT} moedas = 1 slot de carga · faltam {toNextSlot} para o próximo.
      </p>
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
          background: 'var(--card), var(--card)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          padding: 18,
          minWidth: 340,
          maxWidth: 460,
          width: '90vw',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '78vh',
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <OrnateTitle color="var(--foreground)" fontSize={10}>Adicionar do Catálogo</OrnateTitle>
        </div>

        <Input
          autoFocus
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Buscar no catálogo"
          className="mb-2.5 h-auto rounded-sm border-[var(--border)] bg-[var(--card)] px-2.5 py-1.5 text-[11px] text-[var(--foreground)]"
        />

        <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          {(Object.keys(CATALOG_TABS) as CatalogTab[]).map(t => (
            <Button
              key={t}
              variant="ghost"
              onClick={() => setTab(t)}
              aria-pressed={tab === t}
              className={cn(
                '-mb-px h-auto rounded-none border-b-2 px-2.5 pt-1.5 pb-1 text-[8px] tracking-[0.14em]',
                'transition-all duration-[250ms]',
                tab === t
                  ? 'border-b-[var(--primary)] bg-[var(--input)] text-[var(--foreground)]'
                  : 'text-muted-foreground border-b-transparent',
              )}
            >
              {CATALOG_TABS[t].label}
            </Button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingTop: 4 }}>
          {filtered.length === 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted-foreground)', padding: '8px 4px' }}>
              Nenhum item encontrado.
            </p>
          )}
          {filtered.map(cat => (
            <Button
              key={cat.id}
              variant="ghost"
              onClick={() => { onAdd(catalogToInventoryItem(cat)); onClose() }}
              className="block h-auto w-full rounded-none border-b border-b-[var(--border)] px-1 py-2 text-left normal-case transition-colors duration-[180ms] hover:bg-[var(--input)]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HugeiconsIcon icon={catalogIconFor(cat)} size={14} strokeWidth={1.5} style={{ flexShrink: 0, color: 'var(--muted-foreground)' }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--foreground)', flex: 1 }}>
                  {cat.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--chart-1)', flexShrink: 0 }}>
                  {cat.cost}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                {cat.weight} slot{cat.weight !== 1 ? 's' : ''}
                {cat.damageDie && cat.damageDie !== '-' ? ` · ${cat.damageDie}` : ''}
                {cat.acBonus ? ` · CA ${cat.acBonus}` : ''}
                {cat.range ? ` · ${cat.range}` : ''}
                {cat.description && cat.description !== '-' ? ` — ${cat.description}` : ''}
              </div>
            </Button>
          ))}
        </div>

        <Button onClick={onClose} variant={BTN_VARIANT_MAP.dark} className="w-full mt-2.5 h-auto py-[7px]">
          Fechar
        </Button>
      </div>
    </div>
  )
}

const TYPE_LABEL: Record<ItemType, string> = {
  weapon: 'Arma', armor: 'Armadura', shield: 'Escudo',
  gear: 'Equipamento', treasure: 'Tesouro', document: 'Documento',
}

const TYPE_ACCENT: Record<ItemType, { color: string }> = {
  weapon:   { color: 'var(--destructive)' },
  armor:    { color: 'var(--chart-2)' },
  shield:   { color: 'var(--chart-2)' },
  gear:     { color: 'var(--muted-foreground)' },
  treasure: { color: 'var(--chart-1)' },
  document: { color: 'var(--muted-foreground)' },
}

/** Icon size inside a pack cell. The tile and the echoes of the space it spills
    into share it, so one item reads as one object across all its slots. */
const TILE_ICON_SIZE = 26

const TILE_LABEL_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 8,
  // The tile is a Button, and its variant sets `whitespace-nowrap`; without
  // this the two lines the clamp allows are never reached and long names are
  // simply cut off mid-word.
  whiteSpace: 'normal',
  letterSpacing: '0.3px',
  textTransform: 'uppercase',
  color: 'var(--muted-foreground)',
  textAlign: 'center',
  lineHeight: 1.2,
  width: '100%',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

/** Occupied grid cell ("Default" state, Figma 91-1044) — icon + name, gold border. */
function GridItemTile({ label, title, icon, selected, badge, dot, onSelect }: {
  label: string
  title: string
  icon: React.ReactNode
  selected: boolean
  /** Top-right numeral — a stack's count, or the coins in the purse. */
  badge?: React.ReactNode
  /** Top-left pip, marking something in hand or worn. */
  dot?: boolean
  onSelect: () => void
}) {
  return (
    <Button
      onClick={onSelect}
      title={title}
      variant="outline"
      aria-pressed={selected}
      className={cn(
        'relative -mt-px -ml-px aspect-square h-auto w-full flex-col justify-end gap-[3px] p-1.5',
        'bg-[var(--background)] hover:bg-[var(--background)]',
        selected ? 'z-[2] border-[var(--destructive)]' : 'z-[1] border-[var(--muted-foreground)]',
      )}
    >
      {dot && (
        <span aria-hidden style={{
          position: 'absolute', top: 4, left: 4,
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--chart-2)',
        }} />
      )}
      {badge != null && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          fontFamily: 'var(--font-numeral)', fontSize: 11,
          color: 'var(--muted-foreground)', lineHeight: 1,
        }}>
          {badge}
        </span>
      )}
      <div style={{ flex: '1 0 0', minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={TILE_LABEL_STYLE}>{label}</span>
    </Button>
  )
}

function ItemIconSlot({ item, selected, now, onSelect }: {
  item: InventoryItem
  selected: boolean
  now?: number
  onSelect: () => void
}) {
  return (
    <GridItemTile
      label={item.name}
      title={item.name}
      icon={<ItemGlyph item={item} size={TILE_ICON_SIZE} now={now} />}
      selected={selected}
      badge={item.quantity > 1 ? `×${item.quantity}` : undefined}
      dot={item.equipped}
      onSelect={onSelect}
    />
  )
}

/**
 * The purse. It is always in the pack — nothing adds it and nothing takes it
 * away — and it weighs only what the coins in it weigh, which is nothing at all
 * until they reach a hundred (see `coinSlots`).
 */
function CoinPurseTile({ total, selected, onSelect }: {
  total: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <GridItemTile
      label="Bolsa de moedas"
      title={`Bolsa de moedas — ${total} ${total === 1 ? 'moeda' : 'moedas'}`}
      icon={
        <HugeiconsIcon
          icon={MoneyBag01Icon}
          size={TILE_ICON_SIZE}
          strokeWidth={1.5}
          style={{ width: TILE_ICON_SIZE, height: TILE_ICON_SIZE, color: 'var(--chart-1)' }}
        />
      }
      selected={selected}
      badge={total > 0 ? total : undefined}
      onSelect={onSelect}
    />
  )
}

/**
 * The rest of the room an oversized item takes. A two-slot pack item used to
 * simply delete a free cell somewhere else in the grid; drawing its echo puts
 * the weight where the eye expects it — right beside the thing carrying it.
 */
function GridEchoTile({ label, icon }: { label: string; icon: IconSvgElement }) {
  return (
    <div
      title={`${label} — ocupa este slot`}
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        margin: '-1px 0 0 -1px',
        border: '1px dashed var(--muted-foreground)',
        background: 'var(--muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        padding: 6,
        position: 'relative',
        zIndex: 0,
        opacity: 0.45,
      }}
    >
      <HugeiconsIcon icon={icon} size={TILE_ICON_SIZE} strokeWidth={1.5} />
      <span style={{ ...TILE_LABEL_STYLE, fontSize: 7 }}>{label}</span>
    </div>
  )
}

/** Free grid cell ("Available" state) — click to add an item from the catalog. */
function GridAvailableTile({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      title="Adicionar item"
      aria-label="Adicionar item"
      variant="outline"
      className={cn(
        'tactile relative z-[1] -mt-px -ml-px aspect-square h-auto w-full p-1.5',
        'border-[var(--destructive)]/25 bg-[var(--background)] transition-colors duration-200',
        'hover:border-[var(--destructive)]/55 hover:bg-[var(--destructive)]/5',
      )}
    >
      <span aria-hidden className="font-heading text-[32px] leading-none text-[var(--destructive)]/40">+</span>
    </Button>
  )
}

/** Non-interactive filler cell ("Empty" state) — diagonal hatch pattern padding the grid to a full row. */
function GridEmptyTile() {
  return (
    <div
      aria-hidden
      style={{
        width: '100%',
        aspectRatio: '1 / 1',
        boxSizing: 'border-box',
        margin: '-1px 0 0 -1px',
        border: '1px dashed var(--border)',
        background: 'repeating-linear-gradient(45deg, var(--border) 0px, var(--border) 1px, transparent 1px, transparent 7px), var(--background)',
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
    background: 'var(--border)',
    borderRadius: 2,
  })
  return (
    <div aria-hidden style={{
      width: '100%',
      boxSizing: 'border-box',
      background: 'var(--background)',
      border: '1px dashed var(--border)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={line('70%', 12)} />
      <div style={line('40%', 7)} />
      <div style={{ height: 1, background: 'var(--border)' }} />
      <div style={line('100%')} />
      <div style={line('85%')} />
      <div style={line('92%')} />
      <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center', margin: '10px 0 4px' }}>
        Selecione um item para ver os detalhes
      </p>
    </div>
  )
}

function ItemDetailPane({ item, now, onClose, onEdit, onRemove, onEquipToggle, onConsume, onOpen, onRollAttack, onRollDamage, onRollParry }: {
  item: InventoryItem
  now?: number
  onClose: () => void
  onEdit: () => void
  onRemove: () => void
  onEquipToggle?: () => void
  onConsume?: () => void
  onOpen?: () => void
  onRollAttack?: (mode: RollMode) => void
  onRollDamage?: () => void
  onRollParry?: () => void
}) {
  const accent = TYPE_ACCENT[item.type] ?? TYPE_ACCENT.gear

  return (
    <div className="animate-ink-spread" style={{
      width: '100%',
      boxSizing: 'border-box',
      background: 'var(--background)',
      border: '1px solid var(--destructive)',
      borderTop: '2px solid var(--destructive)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ flexShrink: 0, color: accent.color, marginTop: 1 }}>
          <ItemGlyph item={item} size={18} now={now} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            color: 'var(--foreground)',
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
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          aria-label="Fechar"
          className="text-muted-foreground shrink-0 text-[11px] leading-none hover:bg-transparent"
        >
          ✕
        </Button>
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--muted-foreground)', lineHeight: 1.7 }}>
        {[
          `${item.slots} slot${item.slots !== 1 ? 's' : ''}`,
          item.quantity > 1 ? `×${item.quantity}` : null,
          item.damageDie || null,
          item.acBonus ? `CA ${item.acBonus}` : null,
          item.isLight ? `${minutesLeft(item)}min` : null,
          item.cost || null,
        ].filter(Boolean).join(' · ')}
      </div>

      {(item.equipped || item.isLit) && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {item.equipped && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--chart-2)', background: 'color-mix(in oklch, var(--chart-2), transparent 80%)', border: '1px solid color-mix(in oklch, var(--chart-2), transparent 65%)', padding: '1px 5px' }}>
              Equipado
            </span>
          )}
          {item.isLit && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--primary-foreground)', background: 'color-mix(in oklch, var(--primary), transparent 85%)', border: '1px solid color-mix(in oklch, var(--primary), transparent 70%)', padding: '1px 5px' }}>
              Acesa
            </span>
          )}
        </div>
      )}

      {item.description && item.description !== '-' && (
        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10.5, color: 'var(--muted-foreground)', lineHeight: 1.55, margin: 0 }}>
          {item.description}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
        {onRollAttack && (
          <RollModeMenu label={`Rolar ataque com ${item.name}`} onRoll={onRollAttack}>
            <Button render={<span />} variant={BTN_VARIANT_MAP.blood} className="w-full justify-center">
              <HugeiconsIcon icon={Sword03Icon} size={13} strokeWidth={1.8} /> Atacar
            </Button>
          </RollModeMenu>
        )}
        {onRollDamage && <Button onClick={onRollDamage} variant={BTN_VARIANT_MAP.mist} className="justify-center">Dano</Button>}
        {onRollParry && <Button onClick={onRollParry} variant={BTN_VARIANT_MAP.mist} className="justify-center">Aparar</Button>}
        {onOpen && (
          <Button onClick={onOpen} variant={BTN_VARIANT_MAP.dark} className="justify-center">
            <HugeiconsIcon icon={BookOpen02Icon} size={13} strokeWidth={1.8} /> Ler
          </Button>
        )}
        {onConsume && <Button onClick={onConsume} variant={BTN_VARIANT_MAP.green} className="justify-center">Consumir</Button>}
        {onEquipToggle && (
          <Button onClick={onEquipToggle} variant={BTN_VARIANT_MAP[item.equipped ? 'amber' : 'dark']} className="justify-center">
            {item.equipped ? 'Desequipar' : 'Equipar'}
          </Button>
        )}
        <Button onClick={onEdit} variant={BTN_VARIANT_MAP.dark} className="justify-center">✎ Editar</Button>
        <Button onClick={onRemove} variant={BTN_VARIANT_MAP.danger} className="justify-center">✕ Remover</Button>
      </div>
    </div>
  )
}

function ItemFormFields({ form, onChange }: {
  form: Partial<InventoryItem>
  onChange: (f: Partial<InventoryItem>) => void
}) {
  const set = (patch: Partial<InventoryItem>) => onChange({ ...form, ...patch })
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
        <div>
          <FieldLabel>Nome</FieldLabel>
          <Input type="text" value={form.name ?? ''} onChange={e => set({ name: e.target.value })} placeholder="ex.: Espada Curta" className={INPUT_CLASS} />
        </div>
        <div>
          <FieldLabel>Tipo</FieldLabel>
          <NativeSelect value={form.type ?? 'gear'} onChange={e => set({ type: e.target.value as ItemType })} aria-label="Tipo" className={INPUT_CLASS}>
            <NativeSelectOption value="gear">Equipamento</NativeSelectOption>
            <NativeSelectOption value="weapon">Arma</NativeSelectOption>
            <NativeSelectOption value="armor">Armadura</NativeSelectOption>
            <NativeSelectOption value="shield">Escudo</NativeSelectOption>
            <NativeSelectOption value="treasure">Tesouro</NativeSelectOption>
            <NativeSelectOption value="document">Documento</NativeSelectOption>
          </NativeSelect>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <FieldLabel>Slots</FieldLabel>
            <Input type="number" value={form.slots ?? 1} min={0} onChange={e => set({ slots: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
          </div>
          <div>
            <FieldLabel>Qtd</FieldLabel>
            <Input type="number" value={form.quantity ?? 1} min={1} onChange={e => set({ quantity: parseInt(e.target.value) || 1 })} className={INPUT_CLASS} />
          </div>
        </div>
      </div>

      {form.type === 'weapon' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div>
            <FieldLabel>Tipo de Arma</FieldLabel>
            <NativeSelect value={form.weaponKind ?? 'melee'} onChange={e => set({ weaponKind: e.target.value as WeaponKind })} aria-label="Tipo de arma" className={INPUT_CLASS}>
              <NativeSelectOption value="melee">Corpo-a-Corpo</NativeSelectOption>
              <NativeSelectOption value="ranged">À Distância</NativeSelectOption>
            </NativeSelect>
          </div>
          <div>
            <FieldLabel>Bônus Ataque</FieldLabel>
            <Input type="number" value={form.attackBonus ?? 0} onChange={e => set({ attackBonus: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
          </div>
          <div>
            <FieldLabel>Dano</FieldLabel>
            <Input type="text" value={form.damageDie ?? ''} placeholder="ex.: 1d8" onChange={e => set({ damageDie: e.target.value })} className={INPUT_CLASS} />
          </div>
        </div>
      )}

      {(form.type === 'armor' || form.type === 'shield') && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <div>
            <FieldLabel>{form.type === 'shield' ? 'Bônus CA (+)' : 'CA Base'}</FieldLabel>
            <Input type="number" value={form.acBonus ?? 0} onChange={e => set({ acBonus: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
          </div>
          <div>
            <FieldLabel>Descrição</FieldLabel>
            <Input type="text" value={form.description ?? ''} placeholder="Propriedades..." onChange={e => set({ description: e.target.value })} className={INPUT_CLASS} />
          </div>
        </div>
      )}

      {form.type !== 'armor' && form.type !== 'shield' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <FieldLabel>Custo</FieldLabel>
              <Input type="text" value={form.cost ?? ''} placeholder="ex.: 10 PO" onChange={e => set({ cost: e.target.value })} className={INPUT_CLASS} />
            </div>
            <div>
              <FieldLabel>Alcance</FieldLabel>
              <Input type="text" value={form.range ?? ''} placeholder="ex.: 30m" onChange={e => set({ range: e.target.value })} className={INPUT_CLASS} />
            </div>
          </div>
          <div>
            <FieldLabel>Descrição / Propriedades</FieldLabel>
            <Input type="text" value={form.description ?? ''} placeholder="Propriedades especiais..." onChange={e => set({ description: e.target.value })} className={INPUT_CLASS} />
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
        background: 'var(--card)',
        border: '1px solid var(--border)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <ItemFormFields form={form} onChange={setForm} />
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <Button onClick={submit} disabled={!form.name?.trim()} variant={BTN_VARIANT_MAP.blood} className="flex-1 h-auto py-1.5">
          Adicionar
        </Button>
        <Button onClick={onCancel} variant={BTN_VARIANT_MAP.dark} className="flex-1 h-auto py-1.5">
          Cancelar
        </Button>
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
        background: 'var(--card)',
        border: '1px solid var(--border)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <ItemFormFields form={form} onChange={setForm} />
      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
        <Button onClick={() => onSave(form)} variant={BTN_VARIANT_MAP.blood} className="flex-1 h-auto py-1.5">
          Salvar
        </Button>
        <Button onClick={onCancel} variant={BTN_VARIANT_MAP.dark} className="flex-1 h-auto py-1.5">
          Cancelar
        </Button>
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface Props {
  inventory: InventoryItem[]
  str: number
  dex: number
  onUpdate: (inventory: InventoryItem[]) => void
  onAcChange: (ac: number) => void
  onMeleeRangedUpdate: (patch: { meleeBonus?: number; rangedBonus?: number }) => void
  onRoll?: (result: RollResult) => void
  meleeBonus: number
  rangedBonus: number
  gold: number
  silver: number
  copper: number
  /** O dinheiro é um item da mochila agora, então quem mexe nele é esta aba. */
  onCurrencyUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
  /** Acender e apagar são acontecimentos de mesa — a sessão quer saber. */
  onLightChange?: (change: { action: 'lit' | 'out'; itemName: string; minutesLeft: number }) => void
  /** O relógio da mesa, quando o personagem está numa (ver `lib/dungeonClock`). */
  clock?: TableClock | null
}

/** The purse is not a row in the inventory, so selection needs a name for it. */
const COIN_PURSE_ID = '__coin-purse__'

/**
 * Cells an item takes in the pack: one per slot it weighs, and never fewer than
 * one — a weightless thing (the pack itself, a mithral shield) still has to be
 * somewhere you can click.
 */
function tileCount(item: InventoryItem): number {
  return Math.max(1, (item.slots ?? 0) * (item.quantity ?? 1))
}

export function InventoryView({
  inventory, str, dex,
  onUpdate, onAcChange, onMeleeRangedUpdate,
  onRoll, meleeBonus, rangedBonus,
  gold, silver, copper, onCurrencyUpdate,
  onLightChange, clock,
}: Props) {
  const [selectingSlot, setSelectingSlot] = useState<EquipSlot | null>(null)
  const [addingForm, setAddingForm]       = useState<Partial<InventoryItem> | null>(null)
  const [showCatalog, setShowCatalog]     = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [replaceFor, setReplaceFor]       = useState<string | null>(null)
  const [bookViewItem, setBookViewItem]   = useState<InventoryItem | null>(null)

  const purseOpen = !editingId && selectedItemId === COIN_PURSE_ID
  const selectedItem = (!editingId && selectedItemId && !purseOpen)
    ? inventory.find(i => i.id === selectedItemId) ?? null
    : null
  const editingItem = editingId
    ? inventory.find(i => i.id === editingId) ?? null
    : null

  // NOTE: nothing counts light down any more — the minutes are derived from
  // when the source was lit (see lib/light), so they keep running with the tab
  // closed. CharacterSheetClient only settles the record once it hits zero.

  // Carga is defined once, in lib/slots — the sheet used to keep its own copy
  // (`maxSlots = str`) and disagree with the creation wizard. Coins weigh too,
  // a hundred to the slot, now that the purse rides in the pack.
  const purseSlots = coinSlots({ gold, silver, copper })
  const carried = usedSlots(inventory) + purseSlots
  const capacity = maxSlots(str)

  // O relógio da mesa manda na queima; isto só provoca o render.
  const now = tableNow(clock, useNow())
  const equipped  = (slot: EquipSlot) => inventory.find(i => i.equipped && i.slot === slot)

  /**
   * What is actually filling a hand. A two-handed weapon is filed under one
   * hand and takes the other with it, so a hand can be full with nothing
   * recorded against it. Either hand can be the one on record — this version
   * files them under the main hand, but rows written before it did not.
   */
  function handOccupant(slot: EquipSlot): InventoryItem | undefined {
    const direct = equipped(slot)
    if (direct) return direct
    if (slot === 'armor') return undefined
    const other = equipped(slot === 'mainHand' ? 'offHand' : 'mainHand')
    return other && isTwoHanded(other) ? other : undefined
  }

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
    const incoming = inventory.find(i => i.id === id)
    if (!incoming) return

    const hands: EquipSlot[] = ['mainHand', 'offHand']
    const takesBothHands = slot !== 'armor' && isTwoHanded(incoming)
    // Both hands means both hands: the record still names one, and the other is
    // read off the weapon (see handOccupant).
    const target: EquipSlot = takesBothHands ? 'mainHand' : slot

    const next = inventory.map(i => {
      if (i.id === id) return { ...i, equipped: true, slot: target }
      if (!i.equipped || !i.slot) return i
      // What has to come off: whatever holds the slot being filled, both hands
      // when the incoming weapon needs both, and any two-handed weapon already
      // held — that one stops fitting the moment either hand is taken.
      const displaced =
        i.slot === slot ||
        (takesBothHands && hands.includes(i.slot)) ||
        (slot !== 'armor' && hands.includes(i.slot) && isTwoHanded(i))
      return displaced ? snuff({ ...i, equipped: false, slot: undefined }) : i
    })

    onUpdate(next)
    onAcChange(calculateAC(next, dex))
    setSelectingSlot(null)
    setReplaceFor(null)
  }

  function unequipItem(id: string) {
    const next = inventory.map(i =>
      i.id === id ? snuff({ ...i, equipped: false, slot: undefined }) : i
    )
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
  }

  // Equip/unequip triggered from the inventory list (auto slot resolution)
  function toggleEquipFromList(item: InventoryItem) {
    if (item.equipped) { unequipItem(item.id); return }
    if (item.type === 'armor') { equipItem(item.id, 'armor'); return }
    // Two-handed: there is nothing to ask. It takes both hands, and whatever is
    // in them comes off — the same thing that happens to the one hand a normal
    // weapon would displace.
    if (isTwoHanded(item)) { equipItem(item.id, 'mainHand'); return }
    // hand item: fill first empty hand slot, else ask which to replace
    const hands: EquipSlot[] = ['mainHand', 'offHand']
    const emptyHand = hands.find(s => !handOccupant(s))
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

  function rollAttack(item: InventoryItem, mode: RollMode) {
    if (!onRoll) return
    const isRanged = item.weaponKind === 'ranged'
    const attrMod = modifier(isRanged ? dex : str)
    const bonus = attrMod + (isRanged ? rangedBonus : meleeBonus) + (item.attackBonus ?? 0)
    onRoll(rollWithMode('d20', `Ataque: ${item.name}`, item.weaponKind ?? 'melee', bonus, mode))
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

  // Carga (weight capacity) — shown inline in the Mochila heading
  const isEncumbered = carried > capacity

  // Grid cells: the purse, then every item — one cell per slot it weighs, the
  // extras drawn as echoes so the room it takes is visible where it is taken —
  // then one "+" quick-add cell per slot of remaining carga capacity, then
  // diagonal filler padding the grid out to a full row of GRID_COLS. 4 columns
  // — the Mochila grid shares the row with the Equipamento column.
  const GRID_COLS = 4
  const availableCount = Math.max(0, capacity - carried)
  // An empty purse still needs somewhere to be, so it holds a cell even when it
  // weighs nothing.
  const purseCells = Math.max(1, purseSlots)
  const itemCells = inventory.reduce((n, i) => n + tileCount(i), 0)
  const preFillerCount = purseCells + itemCells + availableCount
  const totalCells = Math.ceil(preFillerCount / GRID_COLS) * GRID_COLS
  const emptyCellCount = totalCells - preFillerCount

  // Equipamento column — three cards, one per slot the data model keeps. The
  // shield lost its own square: a shield goes in a hand, like everything else
  // that is held.
  const armorItem = equipped('armor')

  /** A hand card: the item filed under it, or — when a two-handed weapon in the
      other hand has claimed it — an echo of that weapon. */
  function renderHandSlot(slot: EquipSlot, spanClass: string) {
    const own = equipped(slot)
    const claimed = !own ? handOccupant(slot) : undefined
    return claimed
      ? renderBothHandsEcho(claimed, spanClass, SLOT_LABELS[slot])
      : renderEquipSlot(slot, SLOT_LABELS[slot], own, Sword03Icon, spanClass)
  }

  /** One Equipamento slot card — a wide rectangle stacked with the others.
      `spanClass` places the card on the nested six-column grid. */
  function renderEquipSlot(slot: EquipSlot, label: string, item: InventoryItem | undefined, emptyIcon: IconSvgElement, spanClass: string) {
    return (
      <div
        className={spanClass}
        style={{
          background: item ? 'var(--card)' : 'var(--background)',
          border: '2px solid var(--border)',
          padding: 12,
          boxSizing: 'border-box',
          minHeight: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          {label}
        </span>

        {item ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: 'var(--foreground)', lineHeight: 1, flexShrink: 0, display: 'inline-flex' }}>
                <ItemGlyph item={item} size={16} now={now} />
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, color: 'var(--foreground)', flex: 1, lineHeight: 1.3 }}>
                {item.name}
              </span>
              {isTwoHanded(item) && (
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', flexShrink: 0 }}>
                  2 mãos
                </span>
              )}
            </div>

            {slot === 'armor' && (item.acBonus || item.type === 'armor') && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--muted-foreground)' }}>
                CA {calcAC}
              </div>
            )}

            {item.type === 'shield' && item.acBonus && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--muted-foreground)' }}>
                +{item.acBonus} CA
              </div>
            )}

            {item.type === 'weapon' && (
              <div style={{ display: 'flex', gap: 4 }}>
                <RollModeMenu label={`Rolar ataque com ${item.name}`} onRoll={mode => rollAttack(item, mode)}>
                  <Button render={<span />} variant="outline" className={combatPill('blood')}>Atk</Button>
                </RollModeMenu>
                {item.damageDie && <Button onClick={() => rollDamage(item)} variant="outline" className={combatPill('mist')}>Dmg</Button>}
              </div>
            )}

            {item.type === 'shield' && onRoll && (
              <div style={{ display: 'flex', gap: 4 }}>
                <Button onClick={() => rollParry(item)} variant="outline" className={combatPill('mist')}>Aparar</Button>
              </div>
            )}

            {item.isLight && (() => {
              // One write to light, one to snuff — the minutes in between come
              // off the wall clock, so they keep running with the tab closed.
              const remaining = minutesLeft(item, now)
              const burning = Boolean(item.isLit) && remaining > 0

              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Button
                    onClick={() => {
                      const next = burning ? extinguishSource(item) : lightSource(item)
                      updateItem(item.id, {
                        isLit: next.isLit,
                        litAt: next.litAt,
                        lightMinutesLeft: next.lightMinutesLeft,
                      })
                      if (!burning) sendToDiscord({ type: 'torch_lit', minutesLeft: remaining })
                      onLightChange?.({
                        action: burning ? 'out' : 'lit',
                        itemName: item.name,
                        minutesLeft: remaining,
                      })
                    }}
                    disabled={!burning && remaining <= 0}
                    variant="outline" className={combatPill(burning ? 'amber' : 'dark')}>
                    {burning ? 'Apagar' : remaining > 0 ? 'Acender' : 'Consumida'}
                  </Button>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    color: burning
                      ? remaining <= 10 ? 'var(--destructive)' : 'var(--chart-1)'
                      : 'var(--muted-foreground)',
                  }}>
                    {remaining}min
                  </span>
                </div>
              )
            })()}

            <Button
              variant="link"
              onClick={() => unequipItem(item.id)}
              className="mt-auto h-auto self-start p-0 text-[7px] tracking-[0.12em] text-[var(--destructive)] no-underline"
            >
              Desequipar
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setSelectingSlot(slot)}
            className="h-auto flex-1 flex-col gap-[5px] rounded-[1px] border-dashed border-[var(--destructive)] bg-transparent text-[9px] tracking-[0.12em] text-[var(--muted-foreground)] transition-all duration-300"
          >
            <HugeiconsIcon icon={emptyIcon} size={22} strokeWidth={1.5} style={{ opacity: 0.3 }} />
            <span>+ Equipar</span>
          </Button>
        )}
      </div>
    )
  }

  /** The off hand, when a two-handed weapon already has it. Not an empty slot
      and not a second item — the same weapon, shown where its other hand is. */
  function renderBothHandsEcho(item: InventoryItem, spanClass: string, label = SLOT_LABELS.offHand) {
    return (
      <div
        className={spanClass}
        style={{
          background: 'var(--muted)',
          border: '2px dashed var(--border)',
          padding: 12,
          boxSizing: 'border-box',
          minHeight: 110,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          opacity: 0.6,
        }}
      >
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
          {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'var(--muted-foreground)', lineHeight: 1, flexShrink: 0, display: 'inline-flex' }}>
            <HugeiconsIcon icon={iconFor(item)} size={16} strokeWidth={1.5} />
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, color: 'var(--muted-foreground)', flex: 1, lineHeight: 1.3 }}>
            {item.name}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--muted-foreground)' }}>
          Ocupada pelas duas mãos
        </span>
        <Button
          variant="link"
          onClick={() => unequipItem(item.id)}
          className="mt-auto h-auto self-start p-0 text-[7px] tracking-[0.12em] text-[var(--destructive)] no-underline"
        >
          Desequipar
        </Button>
      </div>
    )
  }

  return (
    // No page shell: this renders straight into the sheet's content column,
    // which spans six of the page's twelve columns and already carries the
    // page's margins. Nothing sits on the row below any more — the coin purse
    // moved into the pack, where it is just another item you can click.
    <>
        <div className="card-surface" style={{ padding: 24 }}>
          <div className="grid-6">

          {addingForm !== null && (
            <div className="col-span-6">
              <AddItemForm
                initialForm={addingForm}
                onAdd={addItem}
                onCancel={() => setAddingForm(null)}
              />
            </div>
          )}

          {/* Two-column split on the six-column grid — Equipamento takes a
              third (span 2), Mochila the rest (span 4); both fill the row on
              narrow widths. */}

          {/* Equipamento — armadura and the two hands, three wide cards
              stacked on a nested six-column grid, then the combat bonuses
              under them. */}
          <div className="grid-6 grid-6--tight col-span-2 col-sm-full" style={{ alignContent: 'start' }}>
            <div className="col-span-6">
              <SectionSubheading>Equipamento</SectionSubheading>
            </div>
            {renderEquipSlot('armor', 'Armadura', armorItem, BodyArmorIcon, 'col-span-6')}
            {renderHandSlot('mainHand', 'col-span-6')}
            {renderHandSlot('offHand', 'col-span-6')}

            {/* Bônus — the two attack bonuses side by side, under the slots
                they apply to. */}
            <div className="col-span-6" style={{ marginTop: 6 }}>
              <SectionSubheading>Bônus</SectionSubheading>
            </div>
            {([
              { key: 'meleeBonus' as const, label: 'Corpo-a-corpo', value: meleeBonus },
              { key: 'rangedBonus' as const, label: 'À distância', value: rangedBonus },
            ] as const).map(({ key, label, value }) => (
              <div
                key={key}
                className="col-span-3"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  padding: 8,
                  boxSizing: 'border-box',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 4 }}>
                  {label}
                </div>
                <NumInput
                  value={value}
                  aria-label={label}
                  onCommit={n => onMeleeRangedUpdate({ [key]: n })}
                  className={cn(
                    'font-heading h-auto cursor-text border-none bg-transparent p-0 text-[20px] font-bold',
                    value > 0
                      ? 'text-[var(--chart-2)]'
                      : value < 0
                        ? 'text-destructive'
                        : 'text-[var(--foreground)]',
                  )}
                />
              </div>
            ))}
          </div>

          {/* Mochila — item grid with the detail pane below it. The panel has
              no heading of its own any more, so this one carries the carga,
              the item count and the two ways of adding something. */}
          <div className="grid-6 grid-6--tight col-span-4 col-sm-full" style={{ alignContent: 'start' }}>
            <div className="col-span-6">
              <SectionSubheading
                trailing={
                  // Takes the room the title does not, and wraps inside it —
                  // otherwise "Mochila" is the first thing squeezed away on a
                  // phone, and it is the one word here that names the section.
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, flex: '1 1 0', minWidth: 0 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 14, color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)', lineHeight: 1 }}>
                        {carried}/{capacity}
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)', lineHeight: 1 }}>
                        {isEncumbered ? 'Sobrecarregado' : 'Carga'}
                      </span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 14, color: 'var(--muted-foreground)', lineHeight: 1 }}>
                        {inventory.length}
                      </span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', lineHeight: 1 }}>
                        {inventory.length === 1 ? 'Item' : 'Itens'}
                      </span>
                    </span>
                    <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <Button onClick={() => setAddingForm({})} variant="secondary" size="sm" className="tactile">Criar</Button>
                      <Button onClick={() => setShowCatalog(true)} variant="hollow" size="sm" className="tactile">Adicionar</Button>
                    </span>
                  </div>
                }
              >
                Mochila
              </SectionSubheading>
            </div>

            {/* Item grid — purse / occupied / echo / available / empty-filler
                cells. Fluid: fills the column width, tiles stay square via
                aspect-ratio. */}
            <div className="col-span-6" style={{ border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${GRID_COLS}, minmax(64px, 1fr))`, alignContent: 'start' }}>
                <CoinPurseTile
                  total={gold + silver + copper}
                  selected={purseOpen}
                  onSelect={() => {
                    setSelectedItemId(purseOpen ? null : COIN_PURSE_ID)
                    setEditingId(null)
                  }}
                />
                {Array.from({ length: purseCells - 1 }).map((_, i) => (
                  <GridEchoTile key={`purse-echo-${i}`} label="Bolsa de moedas" icon={MoneyBag01Icon} />
                ))}
                {inventory.map(item => (
                  <Fragment key={item.id}>
                    <ItemIconSlot
                      item={item}
                      now={now}
                      selected={selectedItemId === item.id || editingId === item.id}
                      onSelect={() => {
                        if (editingId === item.id) return
                        setSelectedItemId(selectedItemId === item.id ? null : item.id)
                        setEditingId(null)
                      }}
                    />
                    {Array.from({ length: tileCount(item) - 1 }).map((_, i) => (
                      <GridEchoTile key={`${item.id}-echo-${i}`} label={item.name} icon={iconFor(item)} />
                    ))}
                  </Fragment>
                ))}
                {Array.from({ length: availableCount }).map((_, i) => (
                  <GridAvailableTile key={`add-${i}`} onClick={() => setShowCatalog(true)} />
                ))}
                {Array.from({ length: emptyCellCount }).map((_, i) => (
                  <GridEmptyTile key={`empty-${i}`} />
                ))}
              </div>

              {/* Detail pane — always present so the column height never collapses */}
              <div className="col-span-6">
              {editingItem ? (
                <EditItemForm
                  item={editingItem}
                  onSave={updated => { updateItem(editingItem.id, updated); setEditingId(null) }}
                  onCancel={() => setEditingId(null)}
                />
              ) : purseOpen ? (
                <CoinPursePane
                  gold={gold}
                  silver={silver}
                  copper={copper}
                  slots={purseSlots}
                  onUpdate={onCurrencyUpdate}
                  onClose={() => setSelectedItemId(null)}
                />
              ) : selectedItem ? (
                <ItemDetailPane
                  item={selectedItem}
                  now={now}
                  onClose={() => setSelectedItemId(null)}
                  onEdit={() => setEditingId(selectedItem.id)}
                  onRemove={() => removeItem(selectedItem.id)}
                  onEquipToggle={isEquippable(selectedItem) ? () => toggleEquipFromList(selectedItem) : undefined}
                  onConsume={selectedItem.type === 'gear' ? () => consumeItem(selectedItem.id) : undefined}
                  onOpen={selectedItem.type === 'document' ? () => setBookViewItem(selectedItem) : undefined}
                  onRollAttack={selectedItem.type === 'weapon' && onRoll ? mode => rollAttack(selectedItem, mode) : undefined}
                  onRollDamage={selectedItem.damageDie && onRoll ? () => rollDamage(selectedItem) : undefined}
                  onRollParry={selectedItem.type === 'shield' && onRoll ? () => rollParry(selectedItem) : undefined}
                />
              ) : (
                <ItemDetailSkeleton />
              )}
              </div>
          </div>
          </div>
        </div>

      {/* Equip selection modal */}
      {selectingSlot && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelectingSlot(null)}
        >
          <div
            className="worn-border animate-ink-spread"
            style={{
              background: 'var(--card), var(--card)',
              border: '1px solid var(--border)',
              borderTop: '2px solid var(--border)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
              padding: 24,
              minWidth: 280,
              maxWidth: 360,
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 12 }}>
              <OrnateTitle color="var(--foreground)" fontSize={10}>Equipar em {SLOT_LABELS[selectingSlot]}</OrnateTitle>
            </div>

            {unequippedCompatible(selectingSlot).length === 0 ? (
              <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted-foreground)' }}>
                Nenhum item compatível disponível.
              </p>
            ) : (
              unequippedCompatible(selectingSlot).map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => equipItem(item.id, selectingSlot!)}
                  className="block h-auto w-full rounded-none border-b border-b-[var(--border)] px-0 py-2 text-left normal-case transition-colors duration-200 hover:bg-[var(--input)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--foreground)' }}>
                    <ItemGlyph item={item} size={14} now={now} />
                    <span>{item.name}</span>
                    {isTwoHanded(item) && (
                      <span style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>
                        2 mãos
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                    {item.slots} slot{item.slots !== 1 ? 's' : ''}
                    {item.damageDie ? ` · ${item.damageDie}` : ''}
                    {item.acBonus ? ` · CA ${item.acBonus}` : ''}
                  </div>
                </Button>
              ))
            )}
            <Button onClick={() => setSelectingSlot(null)} variant={BTN_VARIANT_MAP.dark} className="w-full mt-3">
              Cancelar
            </Button>
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
              background: 'var(--card), var(--card)',
              border: '1px solid var(--border)',
              borderTop: '2px solid var(--border)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
              padding: 24,
              minWidth: 280,
              maxWidth: 360,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ marginBottom: 4 }}>
              <OrnateTitle color="var(--foreground)" fontSize={10}>Mãos Ocupadas</OrnateTitle>
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 12 }}>
              Qual item substituir?
            </p>

            {/* A two-handed weapon fills both hands off one record, so it would
                otherwise be offered twice — the same choice, listed as two. */}
            {(['mainHand', 'offHand'] as EquipSlot[])
              .map(slot => ({ slot, item: handOccupant(slot) }))
              .filter((entry): entry is { slot: EquipSlot; item: InventoryItem } => Boolean(entry.item))
              .filter((entry, i, all) => all.findIndex(o => o.item.id === entry.item.id) === i)
              .map(({ slot, item }) => (
                <Button
                  key={slot}
                  variant="ghost"
                  onClick={() => equipItem(replaceFor, slot)}
                  className="block h-auto w-full rounded-none border-b border-b-[var(--border)] px-0 py-2 text-left normal-case transition-colors duration-200 hover:bg-[var(--input)]"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--foreground)' }}>
                    <ItemGlyph item={item} size={14} now={now} />
                    <span>{item.name}</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                    {isTwoHanded(item) ? 'Ocupa as duas mãos · ' : ''}
                    {item.damageDie ? `${item.damageDie}` : ''}
                    {item.acBonus ? `+${item.acBonus} CA` : ''}
                  </div>
                </Button>
              ))}

            <Button onClick={() => setReplaceFor(null)} variant={BTN_VARIANT_MAP.dark} className="w-full mt-3">
              Cancelar
            </Button>
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
    </>
  )
}
