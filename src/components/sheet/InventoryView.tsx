'use client'

import { cn } from '@/lib/utils'
import { Fragment, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  BodyArmorIcon,
  BookOpen02Icon,
  BowArrowIcon,
  CancelCircleIcon,
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
import type { RollMode } from '@/lib/dice'
import { attackBonus, attackRoll, damageRoll, parryRoll } from '@/lib/attacks'
import { ITEM_ART, itemArt } from '@/lib/itemArt'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { sendToDiscord } from '@/lib/discord'
import { extinguishSource, lightSource, minutesLeft, snuff } from '@/lib/light'
import { COINS_PER_SLOT, coinSlots, maxSlots, usedSlots } from '@/lib/slots'
import { isTwoHanded } from '@/lib/inventory'
import { useTableNow } from '@/hooks/useTableNow'
import { serverNow } from '@/lib/serverClock'
import { tableNow, type TableClock } from '@/lib/dungeonClock'
import { OrnateTitle } from '@/components/shared/OrnateTitle'
import { SectionSubheading } from '@/components/shared/SectionHeading'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { HoverCard, HoverCardContent } from '@/components/ui/hover-card'
import type { VariantProps } from 'class-variance-authority'

type ButtonVariants = VariantProps<typeof buttonVariants>
import { NumInput } from '@/components/sheet/NumInput'
import { ItemAttributeTag } from '@/components/sheet/ItemAttributeTag'
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

/** A source of light as the pack draws it: burning, or spent. Anything else is just carried. */
function lightState(item: InventoryItem, now: number): 'burning' | 'spent' | undefined {
  if (!item.isLight) return undefined
  if (minutesLeft(item, now) <= 0) return 'spent'
  return item.isLit ? 'burning' : undefined
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
      fontFamily: 'var(--font-mono)', fontWeight: 600,
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
  now: number
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
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--foreground)', flex: 1 }}>
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

// ─── The pack grid ────────────────────────────────────────────────────────────
//
// Figma 339:738. Every cell of the pack is a portrait card, 102 by 138, on a
// 6px grid. One shape, four states:
//   occupied   a title bar over the item's illustration       GridItemTile
//   echo       the rest of the room an oversized item takes   GridEchoTile
//   available  a free cell: "+" adds an item                  GridAvailableTile
//   locked     filler that pads the grid out to a full row    GridEmptyTile

/** What every cell shares: the portrait ratio and the 2px outline. */
const CELL = 'relative aspect-[102/138] w-full min-w-0 border-2'

// No `outline-none` here: in Tailwind 4 it pins the outline style to `none`, and
// `focus-visible:outline-2` then draws nothing. The browser already shows an
// outline for keyboard focus only, so this just sets how it looks.
const CELL_FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

/** A cell's name, in the bar across its head: two lines at most, then an ellipsis. */
const CELL_TITLE =
  'line-clamp-2 w-full text-center font-mono text-[10px] leading-none font-semibold tracking-[0.3px] text-card-foreground uppercase [word-break:break-word]'

/** Icon size on an occupied cell whose item has no illustration yet. */
const TILE_ICON_SIZE = 40

/** The remove button hangs off the cell's bottom edge: this gap, then its own height. */
const REMOVE_GAP = 4
const REMOVE_SIZE = 32

/**
 * What the overlay and the remove button share: gone until the cell is being
 * looked at — hovered, keyboard-focused or tapped (`data-active` on the cell) —
 * and kept while one of its own menus is open. `visibility`, not just opacity,
 * so a hidden button can't be tabbed to or tapped by mistake.
 */
const REVEAL =
  'invisible opacity-0 transition-[opacity,visibility] duration-100 ' +
  'group-data-[active]/tile:visible group-data-[active]/tile:opacity-100 ' +
  'group-has-[[aria-expanded=true]]/tile:visible group-has-[[aria-expanded=true]]/tile:opacity-100'

/**
 * Figma 353:1834 at overlay size: 90 wide at most, 32 tall, the 2px line
 * inside. The height is the row's, not the button's (see the overlay's grid),
 * so a button can give a few pixels back on a card too short for the stack; and
 * on a card under 88px wide — a phone, four to a row — the label steps down a
 * size to stay on its line.
 */
const OVERLAY_BUTTON =
  'tactile h-full min-h-0 w-full min-w-0 border-2 px-1 text-xs leading-[1.2] tracking-normal @max-[88px]/tile:px-0.5 @max-[88px]/tile:text-[10px]'
/** The solid ember action: the thing you mostly came here to do. */
const OVERLAY_PRIMARY = 'border-border-frame'
/** The quiet one, ruled in cream like "Criar" in the pack's heading. */
const OVERLAY_SECONDARY = 'bg-muted text-foreground hover:bg-bg-panel border-foreground'

/** A button on the overlay. `primary` is ember, `secondary` the cream-ruled dark one. */
function OverlayButton({ tone, className, ...props }: {
  tone: 'primary' | 'secondary'
} & Omit<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button
      variant={tone === 'primary' ? 'default' : 'outline'}
      className={cn(OVERLAY_BUTTON, tone === 'primary' ? OVERLAY_PRIMARY : OVERLAY_SECONDARY, className)}
      {...props}
    />
  )
}

/**
 * Occupied cell — a title bar over the item's illustration. Looking at it, with
 * the mouse, the keyboard or a finger, shows two things:
 *
 *  - an overlay across the cell with what can be done with the item
 *    (Figma 353:1863): the edit icon on top, the actions the kind of item has
 *    (`children`), and the remove icon hanging off the bottom edge;
 *  - its details beside the cell (`details`, Figma 353:1649), read-only.
 *
 * There is no click-to-open any more, so a touch screen gets a tap in its
 * place: a tap on the cell opens it, a tap on it again — or anywhere else —
 * closes it. The mouse needs nothing but to arrive and leave.
 */
function GridItemTile({ label, art, fallback, active, onActiveChange, badge, equipped, light, details, editLabel, onEdit, removeLabel, onRemove, children }: {
  label: string
  /** The item's illustration. Without one, `fallback` is drawn on a plain ground. */
  art: string | null
  fallback: IconSvgElement
  /** Being looked at: hovered, focused with the keyboard, or tapped. */
  active: boolean
  onActiveChange: (active: boolean) => void
  /** Hung over the seam between title and art — a stack's count, or the coins in the purse. */
  badge?: React.ReactNode
  /** The ember mark in the corner of whatever is in hand or worn. */
  equipped?: boolean
  /** A source of light: burning, the cell glows; spent, its drawing is greyed out. */
  light?: 'burning' | 'spent'
  /** What the popup beside the cell says. It only reads. */
  details: React.ReactNode
  editLabel: string
  onEdit: () => void
  removeLabel?: string
  /** Without it there is nothing to remove (the purse). */
  onRemove?: () => void
  /** The buttons between the edit icon and the bottom of the cell. */
  children?: React.ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  // What the last press was made with: a tap toggles, a mouse click does not.
  const pointerType = useRef('mouse')
  const detailsId = useId()

  // A tap away from a cell a tap opened closes it. A mouse needs no such thing:
  // leaving the cell does it.
  const close = useRef(onActiveChange)
  useEffect(() => { close.current = onActiveChange })
  useEffect(() => {
    if (!active) return
    function tappedAway(e: PointerEvent) {
      if (e.pointerType === 'touch' && !rootRef.current?.contains(e.target as Node)) close.current(false)
    }
    document.addEventListener('pointerdown', tappedAway)
    return () => document.removeEventListener('pointerdown', tappedAway)
  }, [active])

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={label}
      aria-describedby={active ? detailsId : undefined}
      tabIndex={0}
      data-active={active ? '' : undefined}
      onPointerDown={e => { pointerType.current = e.pointerType }}
      onPointerEnter={e => { if (e.pointerType !== 'touch') onActiveChange(true) }}
      onPointerLeave={e => { if (e.pointerType !== 'touch') onActiveChange(false) }}
      // Only a keyboard focus counts: after a click the button keeps focus, and
      // the overlay should go away with the mouse, not stay for that.
      onFocus={e => { if (e.target.matches(':focus-visible')) onActiveChange(true) }}
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) onActiveChange(false) }}
      className={cn(
        CELL, CELL_FOCUS,
        // A size container, so the overlay can ask how wide its cell is — and
        // so a cell being looked at (or holding an open menu) is lifted above
        // its neighbours, the remove button hanging over the row below.
        'group/tile @container/tile data-[active]:z-10 has-[[aria-expanded=true]]:z-10',
        'bg-bg-base text-card-foreground',
        'transition-[border-color,box-shadow] duration-150',
        active ? 'border-border-control' : 'border-border-outline',
        light === 'burning' && 'shadow-[0_0_14px_color-mix(in_oklch,var(--ember),transparent_55%)]',
      )}
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-end overflow-hidden"
        onClick={() => { if (pointerType.current === 'touch') onActiveChange(!active) }}
      >
        <span className="bg-bg-panel flex min-h-9 w-full shrink-0 items-center justify-center p-1.5">
          <span className={CELL_TITLE}>{label}</span>
        </span>

        <span className="relative min-h-0 w-full flex-1">
          {art ? (
            // The files are already 320px; the optimiser has nothing to add.
            <Image
              src={art}
              alt=""
              fill
              sizes="120px"
              unoptimized
              className={cn('object-cover', light === 'spent' && 'opacity-50 grayscale')}
            />
          ) : (
            <span className="bg-bg-raised text-muted-foreground absolute inset-0 flex items-center justify-center">
              <HugeiconsIcon
                icon={fallback}
                size={TILE_ICON_SIZE}
                strokeWidth={1.5}
                style={{ width: TILE_ICON_SIZE, height: TILE_ICON_SIZE }}
              />
            </span>
          )}

          {badge != null && (
            <span className="bg-bg-sunken text-card-foreground absolute top-[-4px] left-1/2 -translate-x-1/2 px-1.5 py-[3px] font-mono text-[8px] leading-none font-semibold tracking-[0.3px] whitespace-nowrap">
              {badge}
            </span>
          )}

          {equipped && (
            <>
              <Image
                src="/items/equipado.svg"
                alt=""
                width={12}
                height={11}
                className="absolute bottom-1.5 left-1.5 h-[11px] w-[11.7333px]"
              />
              <span className="sr-only">Equipado</span>
            </>
          )}
        </span>
      </div>

      {/* The overlay (Figma 353:1863). It covers the cell's whole box, border
          included: the 2px line plus 4px of padding is the Figma's 6. Rows of
          32px stacked from the bottom, so the actions sit in the same place on
          every card — `minmax(0, 32px)` lets them squeeze together when the
          card is too short for all of them, instead of running out of it. */}
      <div
        data-slot="tile-overlay"
        onClick={e => { if (e.target === e.currentTarget && pointerType.current === 'touch') onActiveChange(false) }}
        className={cn(
          'bg-bg-sunken/70 border-input absolute -inset-0.5 z-10 grid auto-rows-[minmax(0,32px)] content-end gap-0.5 border-2 p-1',
          REVEAL,
        )}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={onEdit}
          aria-label={editLabel}
          title={editLabel}
          className="tactile bg-muted text-foreground hover:bg-bg-panel h-full min-h-0 w-8 justify-self-center border-2 border-foreground"
        >
          <Image src="/items/editar.svg" alt="" width={16} height={16} />
        </Button>
        {children}
      </div>

      {/* Remove hangs below the cell, apart from the other buttons so it is
          never the one hit by mistake. The gap is part of its box, so the
          pointer can cross it without leaving the cell. */}
      {onRemove && (
        <div
          className={cn('absolute inset-x-0 z-10 flex justify-center', REVEAL)}
          style={{ top: 'calc(100% + 2px)', paddingTop: REMOVE_GAP }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            aria-label={removeLabel}
            title={removeLabel}
            className="tactile border-destructive bg-destructive/15 hover:bg-destructive/25 border"
            style={{ width: REMOVE_SIZE, height: REMOVE_SIZE }}
          >
            <Image src="/items/remover.svg" alt="" width={16} height={16} />
          </Button>
        </div>
      )}

      {/* The details beside the cell: read-only, so no focus is moved into it
          and it takes no pointer events — the cells under it stay hoverable.
          Escape puts it away. */}
      <HoverCard
        open={active}
        onOpenChange={(next, eventDetails) => {
          if (!next && eventDetails.reason === 'escape-key') onActiveChange(false)
        }}
      >
        <HoverCardContent
          {...PACK_POPOVER_POSITION}
          anchor={rootRef}
          id={detailsId}
          role="tooltip"
          positionerClassName="pointer-events-none"
          className={PACK_POPOVER_CLASS}
        >
          {details}
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}

/**
 * The rest of the room an oversized item takes. A two-slot pack item used to
 * simply delete a free cell somewhere else in the grid; drawing its echo puts
 * the weight where the eye expects it — right beside the thing carrying it.
 */
function GridEchoTile({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      title={`${label} — ocupa este slot`}
      className={cn(CELL, 'border-border-outline bg-bg-panel flex items-center justify-center border-dashed p-1.5')}
    >
      <span className={CELL_TITLE}>{label}</span>
    </div>
  )
}

/** Free cell ("Free" in the Figma) — click to add an item from the catalog. */
function GridAvailableTile({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Adicionar item"
      aria-label="Adicionar item"
      className={cn(
        CELL, CELL_FOCUS,
        'tactile border-border-outline bg-bg-sunken font-heading text-foreground flex cursor-pointer items-center justify-center text-[32px] leading-8',
        'hover:border-border-control hover:bg-bg-base',
      )}
    >
      <span aria-hidden>+</span>
    </button>
  )
}

/** Non-interactive filler cell ("Empty") — a locked, dashed cell padding the grid to a full row. */
function GridEmptyTile() {
  return (
    <div aria-hidden className={cn(CELL, 'border-border-outline bg-bg-base flex border-dashed')}>
      <span className="border-bg-raised flex flex-1 items-center justify-center border-2 border-dashed p-0.5">
        <Image src="/items/cadeado.svg" alt="" width={24} height={24} />
      </span>
    </div>
  )
}

// ─── The item details ─────────────────────────────────────────────────────────
//
// Figma 353:1649. The card that opens beside a cell while it is looked at. It
// only reads: the name and kind, the weight in slots, a line of what the thing
// is, and the figures it actually has (Figma 353:1970). Nothing in it is
// clickable — what can be done with the item lives on the cell's own overlay.

/**
 * Where the details hang and how they get out of their own way. Above the cell
 * by default, so the buttons on it stay uncovered; below when the row is near
 * the top of the screen, leaving room for the remove button hanging off the
 * bottom edge. It slides sideways — rather than jumping end to end — when the
 * cell is in the first or last column, and the padding keeps it off the edge.
 */
const PACK_POPOVER_POSITION = {
  side: 'top',
  align: 'center',
  sideOffset: ({ side }: { side: string }) => (side === 'bottom' ? REMOVE_GAP + REMOVE_SIZE + 8 : 8),
  collisionPadding: 16,
  collisionAvoidance: { side: 'flip', align: 'shift', fallbackAxisSide: 'start' },
} as const

/** Figma 353:1649: 224 by 240, the panel's floating surface and its 2px outline. */
const PACK_POPOVER_CLASS =
  'min-h-60 w-56 gap-0 border-2 border-border-outline bg-bg-panel p-0 shadow-none ring-0 select-none'

/** The same two blocks for everything that opens one: a heading and a body. */
function PackDetails({ title, label, slots, description, children }: {
  title: string
  /** The line under the title: what kind of thing it is. */
  label: string
  slots: number
  description?: string
  /** The attribute tags. */
  children?: React.ReactNode
}) {
  return (
    <>
      <div className="flex min-h-9 items-start gap-2 p-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1 tracking-[0.3px]">
          <span className="font-heading text-card-foreground line-clamp-2 text-base leading-none font-normal [word-break:break-word]">
            {title}
          </span>
          <span className="text-muted-foreground font-mono text-[8px] leading-none font-semibold uppercase">
            {label}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Image src="/items/slots.svg" alt="" width={10} height={11} />
          <span className="text-foreground font-mono text-sm leading-[1.2] font-bold tracking-[0.3px]">
            <span className="sr-only">Slots: </span>
            {slots}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 p-3">
        {description && (
          <p className="text-muted-foreground font-[family-name:var(--font-body)] text-[11px] leading-[1.2] tracking-[0.3px]">
            {description}
          </p>
        )}
        {children && <div className="mt-auto grid grid-cols-2 gap-1">{children}</div>}
      </div>
    </>
  )
}

/** "5 sp" is a figure and a unit: the unit is drawn smaller, beside it. */
function splitCost(cost: string): { value: string; unit?: string } {
  const m = cost.trim().match(/^(\d[\d.,]*)\s*(.+)$/)
  return m ? { value: m[1], unit: m[2] } : { value: cost.trim() }
}

/** Only the figures an item actually has — a rope has no damage die. */
function itemTags(item: InventoryItem, now: number): React.ReactNode[] {
  const tags: React.ReactNode[] = []
  if (item.damageDie) tags.push(<ItemAttributeTag key="damage" kind="damage" label="Dano" value={item.damageDie} />)
  if (item.acBonus) {
    tags.push(<ItemAttributeTag key="armor" kind="armor" label="CA" value={item.type === 'shield' ? `+${item.acBonus}` : String(item.acBonus)} />)
  }
  if (item.range) tags.push(<ItemAttributeTag key="distance" kind="distance" label="Alcance" value={item.range} />)
  if (item.isLight) {
    tags.push(<ItemAttributeTag key="light" kind="light" label="Luz restante" value={String(minutesLeft(item, now))} unit="min" />)
  }
  if (item.cost) {
    const { value, unit } = splitCost(item.cost)
    tags.push(<ItemAttributeTag key="cost" kind="cost" label="Custo" value={value} unit={unit} />)
  }
  return tags
}

function ItemDetails({ item, now }: { item: InventoryItem; now: number }) {
  const described = Boolean(item.description && item.description !== '-')
  const kind = [TYPE_LABEL[item.type] ?? item.type, isTwoHanded(item) ? '2 mãos' : null].filter(Boolean).join(' · ')
  const tags = itemTags(item, now)

  return (
    <PackDetails
      title={item.name}
      label={kind}
      slots={item.slots ?? 0}
      description={described ? item.description : undefined}
    >
      {tags.length > 0 ? tags : undefined}
    </PackDetails>
  )
}

/**
 * The purse. It sits where an item's details would sit, because in the pack the
 * purse *is* an item — hovering it should give you the coins, not a description
 * of a bag. Changing them is the edit icon's job (see `CoinPurseModal`).
 */
function PurseDetails({ gold, silver, copper, slots }: {
  gold: number
  silver: number
  copper: number
  slots: number
}) {
  const toNextSlot = COINS_PER_SLOT - ((gold + silver + copper) % COINS_PER_SLOT)

  return (
    <PackDetails
      title="Bolsa de moedas"
      label="Tesouro"
      slots={slots}
      description={`${COINS_PER_SLOT} moedas = 1 slot de carga · faltam ${toNextSlot} para o próximo.`}
    >
      <ItemAttributeTag kind="cost" label="Ouro" value={String(gold)} unit="PO" />
      <ItemAttributeTag kind="cost" label="Prata" value={String(silver)} unit="PP" />
      <ItemAttributeTag kind="cost" label="Cobre" value={String(copper)} unit="PC" />
    </PackDetails>
  )
}

/**
 * The coins, edited. This used to be the purse's popup; the popup only reads
 * now, so the three counts moved to a modal like the item's own form. Each
 * count is saved as it is committed — there is nothing to confirm.
 */
function CoinPurseModal({ gold, silver, copper, slots, onUpdate, onClose }: {
  gold: number
  silver: number
  copper: number
  slots: number
  onUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
  onClose: () => void
}) {
  const coins = [
    { key: 'gold'   as const, label: 'PO', color: 'text-[var(--chart-1)]',          value: gold },
    { key: 'silver' as const, label: 'PP', color: 'text-[var(--foreground)]',       value: silver },
    { key: 'copper' as const, label: 'PC', color: 'text-[var(--muted-foreground)]', value: copper },
  ]
  const total = gold + silver + copper
  const toNextSlot = COINS_PER_SLOT - (total % COINS_PER_SLOT)

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
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          padding: 18,
          minWidth: 300,
          maxWidth: 380,
          width: '90vw',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <OrnateTitle color="var(--foreground)" fontSize={10}>Bolsa de moedas</OrnateTitle>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {coins.map(({ key, label, color, value }) => (
            <div
              key={key}
              className="worn-border"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: 8, textAlign: 'center' }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 4 }}>
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

        <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 10, color: 'var(--muted-foreground)', lineHeight: 1.5, margin: 0 }}>
          {total} {total === 1 ? 'moeda' : 'moedas'} · {slots} {slots === 1 ? 'slot' : 'slots'} · {COINS_PER_SLOT} moedas = 1 slot de carga, faltam {toNextSlot} para o próximo.
        </p>

        <Button onClick={onClose} variant={BTN_VARIANT_MAP.dark} className="w-full h-auto py-[7px]">
          Fechar
        </Button>
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

/**
 * Editing is a modal, not a popup. The form is three columns of fields wide —
 * it used to share the fixed block under the grid, and there is nothing that
 * shape can be hung off a 64px tile. The catalog and the equip picker already
 * open this way, so it is the shape the pack already speaks.
 */
function EditItemModal({ item, onSave, onCancel }: {
  item: InventoryItem
  onSave: (p: Partial<InventoryItem>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<Partial<InventoryItem>>(item)
  return (
    <div
      onClick={onCancel}
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
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderTop: '2px solid var(--border)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.8)',
          padding: 18,
          minWidth: 340,
          maxWidth: 460,
          width: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <OrnateTitle color="var(--foreground)" fontSize={10}>Editar {item.name}</OrnateTitle>
        </div>
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
    </div>
  )
}

// ─── The equipment cards ──────────────────────────────────────────────────────
//
// Figma 345:2082. Armour and the two hands, three cards in the character
// card's second column, each under its own small label.

/** The label above a card: where on the body it goes. */
const EQUIP_LABEL =
  'text-muted-foreground font-mono text-[7px] leading-[11px] font-semibold tracking-[1.12px] uppercase'

const EQUIP_CARD = 'flex min-h-[110px] flex-col gap-1.5 border-2 p-3'

const EQUIP_TITLE =
  'text-card-foreground line-clamp-2 min-w-0 flex-1 font-mono text-xs leading-[1.15] font-semibold tracking-[0.3px] uppercase [word-break:break-word]'

/** The one line of figures under a card's name, on the floating surface. */
const EQUIP_STRIP = 'bg-bg-panel text-muted-foreground flex items-start gap-2 p-[3px] font-mono text-xs leading-3'

/**
 * Figma 64:849 at card size. The component is 36px tall there with the 2px ink
 * line inside a 10px padding; the box here puts the line outside the padding.
 */
const EQUIP_BUTTON = 'h-9 min-w-9 border-2 px-2 text-xs leading-4 tracking-[0.8px]'

/** The card's ✕ — takes the item out of the hand or off the body. */
function UnequipButton({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="muted"
      onClick={onClick}
      aria-label={`Desequipar ${name}`}
      title="Desequipar"
      className="border-destructive text-destructive hover:border-destructive hover:bg-bg-panel size-9 p-0"
    >
      <HugeiconsIcon icon={CancelCircleIcon} size={16} strokeWidth={1.5} style={{ width: 16, height: 16 }} />
    </Button>
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
  /**
   * Where the equipment slots and the bonuses render, when not beside the
   * pack. The desktop sheet hands in the character card's second column;
   * the slots stay this component's (one state, one picker), only drawn there.
   */
  equipmentTarget?: HTMLElement | null
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
  onLightChange, clock, equipmentTarget,
}: Props) {
  const [selectingSlot, setSelectingSlot] = useState<EquipSlot | null>(null)
  const [addingForm, setAddingForm]       = useState<Partial<InventoryItem> | null>(null)
  const [showCatalog, setShowCatalog]     = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [activeTileId, setActiveTileId]   = useState<string | null>(null)
  const [coinsOpen, setCoinsOpen]         = useState(false)
  const [replaceFor, setReplaceFor]       = useState<string | null>(null)
  const [bookViewItem, setBookViewItem]   = useState<InventoryItem | null>(null)

  // One cell at a time shows its overlay and details: the pack tracks which one
  // is being looked at, and each cell asks whether that is itself. A cell only
  // clears the slot if it still holds it — the mouse leaving one cell must not
  // undo the keyboard having just arrived at another.
  const setTileActive = (id: string, active: boolean) =>
    setActiveTileId(prev => (active ? id : prev === id ? null : prev))
  const editingItem = editingId
    ? inventory.find(i => i.id === editingId) ?? null
    : null

  // NOTE: nothing counts light down any more — the minutes are derived from
  // when the source was lit (see lib/light), so they keep running with the tab
  // closed. CharacterSheetClient only settles the record once it hits zero.

  // Carga is defined once, in lib/slots — the sheet used to keep its own copy
  // (`maxSlots = str`) and disagree with the creation wizard. Coins weigh too,
  // a hundred to the slot, now that the purse rides in the pack.
  const purseTotal = gold + silver + copper
  const purseSlots = coinSlots({ gold, silver, copper })
  const carried = usedSlots(inventory) + purseSlots
  const capacity = maxSlots(str)

  // O relógio da mesa manda na queima; isto só provoca o render.
  const now = useTableNow(clock)
  // Writes read the clock at the moment of the click, not the last tick.
  const clickNow = () => tableNow(clock, serverNow())
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
    if (id === activeTileId) setActiveTileId(null)
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
    // The last of a stack takes its overlay with it — the tile it sat on is gone.
    if (nextQty <= 0) {
      if (id === activeTileId) setActiveTileId(null)
      if (item.equipped) onAcChange(calculateAC(next, dex))
    }
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
      return displaced ? snuff({ ...i, equipped: false, slot: undefined }, clickNow()) : i
    })

    onUpdate(next)
    onAcChange(calculateAC(next, dex))
    setSelectingSlot(null)
    setReplaceFor(null)
  }

  function unequipItem(id: string) {
    const next = inventory.map(i =>
      i.id === id ? snuff({ ...i, equipped: false, slot: undefined }, clickNow()) : i
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

  // The rolls themselves live in lib/attacks, shared with the sheet's quick
  // attack menu.
  function rollParry(item: InventoryItem) {
    if (!onRoll) return
    onRoll(parryRoll(item, dex))
  }

  function rollAttack(item: InventoryItem, mode: RollMode) {
    if (!onRoll) return
    onRoll(attackRoll(item, { str, dex, meleeBonus, rangedBonus }, mode))
  }

  function rollDamage(item: InventoryItem) {
    const result = damageRoll(item)
    if (!onRoll || !result) return
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

  /**
   * What the overlay offers for this kind of item (Figma 353:1863 shows a torch:
   * equip it, or use it up). The edit and remove icons are on every cell; these
   * are the buttons between them, top to bottom, the ember one being the thing
   * you mostly came for:
   *
   *   weapon     Atk | Dmg, then Equipar      shield    Aparar, then Equipar
   *   armor      Equipar                      gear      Consumir (a light: Equipar first)
   *   document   Ler                          treasure  nothing but edit and remove
   *
   * The card is 138 tall and the edit icon takes 32 of it, so no kind gets more
   * than two rows.
   */
  function renderItemActions(item: InventoryItem) {
    const rolls  = item.type === 'weapon' && onRoll
    const parry  = item.type === 'shield' && onRoll
    const damage = Boolean(item.damageDie && onRoll)
    const hasMain = Boolean(rolls || parry || item.type === 'gear' || item.type === 'document')

    return (
      <>
        {(rolls || damage) && (
          // A grid, not a flex row: `flex-1` starts every item from its own
          // border and padding, so the one with a border came out wider.
          <div className={cn('grid h-full w-full gap-0.5', rolls && damage ? 'grid-cols-2' : 'grid-cols-1')}>
            {rolls && (
              <RollModeMenu label={`Rolar ataque com ${item.name}`} onRoll={mode => rollAttack(item, mode)} className="block h-full min-w-0">
                {/* Drawn as a button, not one: the menu trigger around it is the control. */}
                <span className={cn(buttonVariants({ variant: 'default' }), OVERLAY_BUTTON, OVERLAY_PRIMARY)}>Atk</span>
              </RollModeMenu>
            )}
            {damage && (
              <OverlayButton tone="secondary" onClick={() => rollDamage(item)}>Dmg</OverlayButton>
            )}
          </div>
        )}

        {parry && <OverlayButton tone="primary" onClick={() => rollParry(item)}>Aparar</OverlayButton>}

        {isEquippable(item) && (
          <OverlayButton
            tone={hasMain ? 'secondary' : 'primary'}
            onClick={() => toggleEquipFromList(item)}
            // "Desequipar" is the longest word on any card and the cards are
            // fluid, so it is set a size down to stay on one line.
            className={item.equipped ? 'text-[10px]' : undefined}
          >
            {item.equipped ? (
              <>
                {/* On a card under 88px — a phone, four to a row — even that
                    does not fit, so the same action goes by a shorter name.
                    The hidden one is out of the accessible name too, so the
                    name always matches what is on the button. */}
                <span className="@max-[88px]/tile:hidden">Desequipar</span>
                <span className="hidden @max-[88px]/tile:inline">Guardar</span>
              </>
            ) : 'Equipar'}
          </OverlayButton>
        )}

        {item.type === 'gear' && <OverlayButton tone="primary" onClick={() => consumeItem(item.id)}>Consumir</OverlayButton>}

        {item.type === 'document' && (
          <OverlayButton tone="primary" onClick={() => { setActiveTileId(null); setBookViewItem(item) }}>Ler</OverlayButton>
        )}
      </>
    )
  }

  // Grid cells: the purse, then every item — one cell per slot it weighs, the
  // extras drawn as echoes so the room it takes is visible where it is taken —
  // then one "+" quick-add cell per slot of remaining carga capacity, then
  // locked filler padding the grid out to a full row. Six cells to a row beside
  // the character card (Figma 339:738), four on the phone, where the pack has
  // the whole width and the cells would otherwise shrink past reading.
  const gridCols = equipmentTarget ? 6 : 4
  const availableCount = Math.max(0, capacity - carried)
  // An empty purse still needs somewhere to be, so it holds a cell even when it
  // weighs nothing.
  const purseCells = Math.max(1, purseSlots)
  const itemCells = inventory.reduce((n, i) => n + tileCount(i), 0)
  const preFillerCount = purseCells + itemCells + availableCount
  const totalCells = Math.ceil(preFillerCount / gridCols) * gridCols
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
      : renderEquipSlot(slot, SLOT_LABELS[slot], own, spanClass)
  }

  /** One Equipamento slot (Figma 347:2163): its label, then a card — the item
      filed under it, or the dashed "+ Equipar" that opens the picker.
      `spanClass` places it on the nested six-column grid. */
  function renderEquipSlot(slot: EquipSlot, label: string, item: InventoryItem | undefined, spanClass: string) {
    return (
      <div className={cn('flex flex-col gap-[3px]', spanClass)}>
        <span className={EQUIP_LABEL}>{label}</span>
        {item ? renderEquipCard(slot, item) : (
          <button
            type="button"
            onClick={() => setSelectingSlot(slot)}
            aria-label={`Equipar em ${label}`}
            className={cn(
              'border-border-outline bg-bg-sunken text-card-foreground flex min-h-[110px] w-full cursor-pointer items-center justify-center border-2 border-dashed p-3',
              'font-mono text-xs leading-[1.15] font-semibold tracking-[0.3px] uppercase transition-colors',
              'hover:border-border-control hover:bg-bg-base',
              CELL_FOCUS,
            )}
          >
            + Equipar
          </button>
        )}
      </div>
    )
  }

  /** The card of something worn or held: its name, the one figure that matters
      about it, and what can be done with it from here. */
  function renderEquipCard(slot: EquipSlot, item: InventoryItem) {
    // One write to light, one to snuff — the minutes in between come off the
    // table clock (server time, pauses and turns applied), so they keep running
    // with the tab closed.
    const remaining = item.isLight ? minutesLeft(item, now) : 0
    const burning = Boolean(item.isLight && item.isLit) && remaining > 0

    function toggleLight() {
      const next = burning ? extinguishSource(item, clickNow()) : lightSource(item, clickNow())
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
    }

    const bonus = item.type === 'weapon' ? attackBonus(item, { str, dex, meleeBonus, rangedBonus }) : 0
    const figures: React.ReactNode[] = []
    if (item.type === 'weapon') {
      figures.push(<span key="atk">{bonus >= 0 ? `+${bonus}` : bonus}</span>)
      if (item.damageDie) figures.push(<span key="dmg">{item.damageDie}</span>)
    }
    if (slot === 'armor' && (item.acBonus || item.type === 'armor')) figures.push(<span key="ac">CA {calcAC}</span>)
    if (item.type === 'shield' && item.acBonus) figures.push(<span key="shield">+{item.acBonus} CA</span>)
    if (item.isLight) {
      figures.push(
        <span key="light" className={burning && remaining <= 10 ? 'text-destructive' : undefined}>
          {remaining}min
        </span>,
      )
    }

    return (
      <div className={cn(EQUIP_CARD, 'border-border-outline bg-bg-base')}>
        <div className="flex items-start gap-1.5">
          <span className={EQUIP_TITLE}>{item.name}</span>
          {isTwoHanded(item) && (
            <span className="text-muted-foreground shrink-0 font-mono text-[8px] leading-none font-semibold tracking-[0.12em] uppercase">
              2 mãos
            </span>
          )}
        </div>

        {figures.length > 0 && <div className={EQUIP_STRIP}>{figures}</div>}

        <div className="mt-auto flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            {item.type === 'weapon' && (
              <>
                <RollModeMenu label={`Rolar ataque com ${item.name}`} onRoll={mode => rollAttack(item, mode)}>
                  {/* Drawn as a button, not one: the menu trigger around it is the control. */}
                  <span className={cn(buttonVariants({ variant: 'default' }), EQUIP_BUTTON, 'border-border-frame')}>Atk</span>
                </RollModeMenu>
                {item.damageDie && (
                  <Button onClick={() => rollDamage(item)} variant="muted" className={EQUIP_BUTTON}>Dmg</Button>
                )}
              </>
            )}

            {item.type === 'shield' && onRoll && (
              <Button onClick={() => rollParry(item)} variant="muted" className={EQUIP_BUTTON}>Aparar</Button>
            )}

            {item.isLight && (
              <Button
                onClick={toggleLight}
                disabled={!burning && remaining <= 0}
                variant={burning ? 'muted' : 'default'}
                className={cn(EQUIP_BUTTON, !burning && 'border-border-frame')}
              >
                {burning ? 'Apagar' : remaining > 0 ? 'Acender' : 'Consumida'}
              </Button>
            )}
          </div>

          <UnequipButton name={item.name} onClick={() => unequipItem(item.id)} />
        </div>
      </div>
    )
  }

  /** The off hand, when a two-handed weapon already has it. Not an empty slot
      and not a second item — the same weapon, shown where its other hand is. */
  function renderBothHandsEcho(item: InventoryItem, spanClass: string, label = SLOT_LABELS.offHand) {
    return (
      <div className={cn('flex flex-col gap-[3px]', spanClass)}>
        <span className={EQUIP_LABEL}>{label}</span>
        <div className={cn(EQUIP_CARD, 'border-border-outline bg-bg-panel border-dashed')}>
          <span className={cn(EQUIP_TITLE, 'text-muted-foreground flex-none')}>{item.name}</span>
          <span className="text-muted-foreground font-[family-name:var(--font-body)] text-xs italic">
            Ocupada pelas duas mãos
          </span>
          <div className="mt-auto flex justify-end">
            <UnequipButton name={item.name} onClick={() => unequipItem(item.id)} />
          </div>
        </div>
      </div>
    )
  }

  // Equipamento: armadura and the two hands, three wide cards stacked on a
  // nested six-column grid, then the combat bonuses under them.
  const equipment = (
    <div className="grid-6 grid-6--tight" style={{ alignContent: 'start' }}>
      <div className="col-span-6">
        <SectionSubheading>Equipamento</SectionSubheading>
      </div>
      {renderEquipSlot('armor', 'Armadura', armorItem, 'col-span-6')}
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
            // The same raised tile as the attributes, now that the bonuses sit
            // in the character card beside them.
            background: 'var(--bg-raised)',
            border: '2px solid var(--border-frame)',
            padding: 8,
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 4 }}>
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
  )

  return (
    // No page shell: this renders straight into the sheet's content column,
    // which spans six of the page's twelve columns and already carries the
    // page's margins. Nothing sits on the row below any more — the coin purse
    // moved into the pack, where it is just another item you can click.
    <>
        {equipmentTarget && createPortal(equipment, equipmentTarget)}
        <div className="inv-panel card-surface">
          {/* Without a character card beside it (the phone) the equipment
              rides above the pack instead. */}
          {!equipmentTarget && <div className="inv-panel__equipment">{equipment}</div>}

          {/* The heading carries the carga, the item count and the two ways of
              adding something (Figma 339:734). It takes the room the title
              does not, and wraps inside it — otherwise "Mochila" is the first
              thing squeezed away on a phone, and it is the one word here that
              names the section. */}
          <header className="inv-panel__head">
            <h2 className="font-heading text-foreground shrink-0 text-[18px] leading-none font-normal">Mochila</h2>
            <div className="inv-panel__tools">
              <span className="inline-flex items-center gap-1">
                <span className={cn('font-heading text-[14px] leading-[14px]', isEncumbered ? 'text-destructive' : 'text-muted-foreground')}>
                  {carried}/{capacity}
                </span>
                <span className={cn('font-mono text-[8px] leading-2 font-semibold tracking-[1.12px] uppercase', isEncumbered ? 'text-destructive' : 'text-muted-foreground')}>
                  {isEncumbered ? 'Sobrecarregado' : 'Carga'}
                </span>
              </span>
              <span className="text-muted-foreground inline-flex items-center gap-1">
                <span className="font-heading text-[14px] leading-[14px]">{inventory.length}</span>
                <span className="font-mono text-[8px] leading-2 font-semibold tracking-[1.12px] uppercase">
                  {inventory.length === 1 ? 'Item' : 'Itens'}
                </span>
              </span>
              <span className="flex gap-2">
                <Button
                  onClick={() => setAddingForm({})}
                  variant="outline"
                  className="tactile bg-muted text-foreground hover:bg-bg-panel h-8 border-2 border-foreground px-[18px] text-base leading-[1.2] tracking-normal"
                >
                  Criar
                </Button>
                <Button
                  onClick={() => setShowCatalog(true)}
                  className="tactile h-8 border-2 border-border-frame px-[18px] text-base leading-[1.2] tracking-normal"
                >
                  Adicionar
                </Button>
              </span>
            </div>
          </header>

          {/* Item grid (Figma 339:738) — purse / occupied / echo / available /
              locked-filler cells, six to a row beside the character card.
              Fluid: tiles keep their portrait ratio at any width. Each occupied
              cell is the anchor its own details hang from; there is no fixed
              pane under the grid. The grid scrolls on its own and fades out
              where it is cut. */}
          <div className="inv-panel__grid" style={{ '--inv-cols': gridCols } as React.CSSProperties}>
            {addingForm !== null && (
              <div className="inv-panel__form">
                <AddItemForm
                  initialForm={addingForm}
                  onAdd={addItem}
                  onCancel={() => setAddingForm(null)}
                />
              </div>
            )}

            <GridItemTile
              label="Bolsa de moedas"
              art={ITEM_ART.purse}
              fallback={MoneyBag01Icon}
              badge={purseTotal > 0 ? purseTotal : undefined}
              active={activeTileId === COIN_PURSE_ID}
              onActiveChange={active => setTileActive(COIN_PURSE_ID, active)}
              details={<PurseDetails gold={gold} silver={silver} copper={copper} slots={purseSlots} />}
              editLabel="Editar moedas"
              onEdit={() => { setActiveTileId(null); setCoinsOpen(true) }}
            />
            {Array.from({ length: purseCells - 1 }).map((_, i) => (
              <GridEchoTile key={`purse-echo-${i}`} label="Bolsa de moedas" />
            ))}
            {inventory.map(item => (
              <Fragment key={item.id}>
                <GridItemTile
                  label={item.name}
                  art={itemArt(item)}
                  fallback={iconFor(item)}
                  badge={item.quantity > 1 ? `x${item.quantity}` : undefined}
                  equipped={item.equipped}
                  light={lightState(item, now)}
                  active={activeTileId === item.id}
                  onActiveChange={active => setTileActive(item.id, active)}
                  details={<ItemDetails item={item} now={now} />}
                  editLabel={`Editar ${item.name}`}
                  onEdit={() => { setActiveTileId(null); setEditingId(item.id) }}
                  removeLabel={`Remover ${item.name}`}
                  onRemove={() => removeItem(item.id)}
                >
                  {renderItemActions(item)}
                </GridItemTile>
                {Array.from({ length: tileCount(item) - 1 }).map((_, i) => (
                  <GridEchoTile key={`${item.id}-echo-${i}`} label={item.name} />
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--foreground)' }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 11, color: 'var(--foreground)' }}>
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

      {coinsOpen && (
        <CoinPurseModal
          gold={gold}
          silver={silver}
          copper={copper}
          slots={purseSlots}
          onUpdate={onCurrencyUpdate}
          onClose={() => setCoinsOpen(false)}
        />
      )}

      {editingItem && (
        <EditItemModal
          item={editingItem}
          onSave={updated => { updateItem(editingItem.id, updated); setEditingId(null) }}
          onCancel={() => setEditingId(null)}
        />
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
