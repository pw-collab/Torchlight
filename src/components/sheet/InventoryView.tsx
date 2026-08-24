'use client'

import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { InventoryItem, EquipSlot, ItemType, WeaponKind } from '@/types/inventory.types'
import type { RollResult } from '@/lib/dice'
import type { Item as CatalogItem } from '@/data/inventory/index'
import { WEAPONS, ARMORS, GEAR } from '@/data/inventory/index'
import { rollFormula, rollWithMode, modifier } from '@/lib/dice'
import type { RollMode } from '@/lib/dice'
import { RollModeMenu } from '@/components/shared/RollModeMenu'
import { sendToDiscord } from '@/lib/discord'
import { extinguishSource, lightSource, minutesLeft, snuff } from '@/lib/light'
import { maxSlots, usedSlots } from '@/lib/slots'
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
    // Burning, not merely flagged lit: a source read after its minutes ran out
    // is dark, whether or not the record has caught up yet.
    const burning = Boolean(item.isLit) && minutesLeft(item) > 0
    const fallback = burning ? '🔥' : LIGHT_ICON[item.lightKind ?? 'torch']
    const lightStyle: React.CSSProperties = burning
      ? { filter: 'drop-shadow(0 0 6px color-mix(in oklch, var(--chart-1), transparent 35%)) saturate(1.3)' }
      : { opacity: 0.5, filter: 'saturate(0.4)' }
    return <TypeIcon src={LIGHT_ICON_SRC} fallback={fallback} size={size} style={lightStyle} />
  }
  const src = ITEM_ICON_SRC[item.type]
  const fallback = ITEM_ICON[item.type] ?? '⚗'
  if (!src) return <span aria-hidden style={{ fontSize: size * 0.5, lineHeight: 1 }}>{fallback}</span>
  return <TypeIcon src={src} fallback={fallback} size={size} />
}

/**
 * Coin purse. Exported because the sheet places it on its own row of the page
 * grid, under the inventory panel — the same slot the stats tab gives to the
 * talent deck (see CharacterSheetClient).
 */
export function TreasureVault({ gold, silver, copper, onUpdate }: {
  gold: number
  silver: number
  copper: number
  onUpdate: (patch: { gold?: number; silver?: number; copper?: number }) => void
}) {
  const coins = [
    { key: 'gold'   as const, label: 'PO', color: 'text-[var(--chart-1)]',  value: gold },
    { key: 'silver' as const, label: 'PP', color: 'text-[var(--foreground)]',   value: silver },
    { key: 'copper' as const, label: 'PC', color: 'text-[var(--muted-foreground)]', value: copper },
  ]

  return (
    <div className="card-surface" style={{ padding: 24 }}>
      <SectionSubheading className="mb-3">Tesouro</SectionSubheading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {coins.map(({ key, label, color, value }) => (
          <div
            key={key}
            className="worn-border"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', padding: 12, textAlign: 'center' }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted-foreground)', marginBottom: 6 }}>
              {label}
            </div>
            <NumInput
              value={value}
              min={0}
              onCommit={n => onUpdate({ [key]: n })}
              className={cn(
                'font-heading h-auto cursor-text border-none bg-transparent p-0 text-[22px] font-bold',
                color,
              )}
            />
          </div>
        ))}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--muted-foreground)', marginTop: 12 }}>
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
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--foreground)', flex: 1 }}>
                  {ITEM_ICON[cat.type] ?? '⚗'} {cat.name}
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

/** Occupied grid cell ("Default" state, Figma 91-1044) — icon + item name, gold border. */
function ItemIconSlot({ item, selected, onSelect }: {
  item: InventoryItem
  selected: boolean
  onSelect: () => void
}) {
  return (
    <Button
      onClick={onSelect}
      title={item.name}
      variant="outline"
      aria-pressed={selected}
      className={cn(
        'relative -mt-px -ml-px aspect-square h-auto w-full flex-col justify-end gap-[3px] p-1.5',
        'bg-[var(--background)] hover:bg-[var(--background)]',
        selected ? 'z-[2] border-[var(--destructive)]' : 'z-[1] border-[var(--muted-foreground)]',
      )}
    >
      {item.equipped && (
        <span aria-hidden style={{
          position: 'absolute', top: 4, left: 4,
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--chart-2)',
        }} />
      )}
      {item.quantity > 1 && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          fontFamily: 'var(--font-numeral)', fontSize: 11,
          color: 'var(--muted-foreground)', lineHeight: 1,
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
        color: 'var(--muted-foreground)',
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
    </Button>
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

function ItemDetailPane({ item, onClose, onEdit, onRemove, onEquipToggle, onConsume, onOpen, onRollAttack, onRollDamage, onRollParry }: {
  item: InventoryItem
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
            <Button render={<span />} variant={BTN_VARIANT_MAP.blood} className="w-full justify-center">⚔ Atacar</Button>
          </RollModeMenu>
        )}
        {onRollDamage && <Button onClick={onRollDamage} variant={BTN_VARIANT_MAP.mist} className="justify-center">Dano</Button>}
        {onRollParry && <Button onClick={onRollParry} variant={BTN_VARIANT_MAP.mist} className="justify-center">Aparar</Button>}
        {onOpen && <Button onClick={onOpen} variant={BTN_VARIANT_MAP.dark} className="justify-center">📖 Ler</Button>}
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
  /** Acender e apagar são acontecimentos de mesa — a sessão quer saber. */
  onLightChange?: (change: { action: 'lit' | 'out'; itemName: string; minutesLeft: number }) => void
  /** O relógio da mesa, quando o personagem está numa (ver `lib/dungeonClock`). */
  clock?: TableClock | null
}

export function InventoryView({
  inventory, str, dex,
  onUpdate, onAcChange, onMeleeRangedUpdate,
  onRoll, meleeBonus, rangedBonus, onLightChange, clock,
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

  // NOTE: nothing counts light down any more — the minutes are derived from
  // when the source was lit (see lib/light), so they keep running with the tab
  // closed. CharacterSheetClient only settles the record once it hits zero.

  // Carga is defined once, in lib/slots — the sheet used to keep its own copy
  // (`maxSlots = str`) and disagree with the creation wizard.
  const carried = usedSlots(inventory)
  const capacity = maxSlots(str)

  // O relógio da mesa manda na queima; isto só provoca o render.
  const now = tableNow(clock, useNow())
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
      if (i.equipped && i.slot === slot) return snuff({ ...i, equipped: false, slot: undefined as any })
      return i
    })
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
    setSelectingSlot(null)
    setReplaceFor(null)
  }

  function unequipItem(id: string) {
    const next = inventory.map(i =>
      i.id === id ? snuff({ ...i, equipped: false, slot: undefined as any }) : i
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

  // Carga (weight capacity) — shown inline in the Inventário header
  const isEncumbered = carried > capacity

  // Grid cells: existing items, then one "+" quick-add cell per slot of
  // remaining carga capacity, then diagonal filler padding the grid out to
  // a full row of GRID_COLS. 4 columns — the Mochila grid shares the row
  // with the Equipamento column.
  const GRID_COLS = 4
  const availableCount = Math.max(0, capacity - carried)
  const preFillerCount = inventory.length + availableCount
  const totalCells = Math.ceil(preFillerCount / GRID_COLS) * GRID_COLS
  const emptyCellCount = totalCells - preFillerCount

  // Equipamento column mapping — the data model keeps its three slots
  // (armor / mainHand / offHand); the layout shows four cards. The offHand
  // item renders in the Escudo square when it's a shield, otherwise in the
  // second hand rectangle. Both empty states open the same offHand selector.
  const offHandItem = equipped('offHand')
  const armorItem   = equipped('armor')
  const shieldCardItem  = offHandItem?.type === 'shield' ? offHandItem : undefined
  const weapon2CardItem = offHandItem && offHandItem.type !== 'shield' ? offHandItem : undefined

  /** One Equipamento slot card — square (Armadura/Escudo, span 6) or wide
      (Mão, span 12) — preserving the exact occupied-slot content/actions of
      the old layout. `spanClass` places the card on the 12-column grid. */
  function renderEquipSlot(slot: EquipSlot, shape: 'square' | 'wide', label: string, item: InventoryItem | undefined, emptyIcon: string, spanClass: string) {
    return (
      <div
        className={spanClass}
        style={{
          background: item ? 'var(--card)' : 'var(--background)',
          border: '2px solid var(--border)',
          padding: 12,
          boxSizing: 'border-box',
          ...(shape === 'square' ? { aspectRatio: '1 / 1' } : { minHeight: 110 }),
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
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--foreground)', lineHeight: 1, flexShrink: 0, display: 'inline-flex' }}>
                {item.isLight
                  ? (item.isLit ? '🔥' : LIGHT_ICON[item.lightKind ?? 'torch'])
                  : ITEM_ICON[item.type] ?? '⚗'}
              </span>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, color: 'var(--foreground)', flex: 1, lineHeight: 1.3 }}>
                {item.name}
              </span>
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
            <span aria-hidden style={{ fontSize: shape === 'square' ? 18 : 22, lineHeight: 1, opacity: 0.3, filter: 'saturate(0.3)' }}>{emptyIcon}</span>
            <span>+ Equipar</span>
          </Button>
        )}
      </div>
    )
  }

  return (
    // No page shell: this renders straight into the sheet's content column,
    // which spans six of the page's twelve columns and already carries the
    // page's margins. Tesouro is placed on the row below by the page (see
    // TreasureVault above).
    <>
        {/* Inventário — grid takes emphasis, Carga inline in the header */}
        <div className="card-surface" style={{ padding: 24 }}>
          <div className="grid-6">
          {/* Title and actions wrap onto their own lines rather than colliding
              once the block is too narrow to hold both (phones). */}
          <div className="col-span-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 12, borderBottom: '2px solid var(--border)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, minWidth: 0 }}>
              <span aria-hidden style={{ fontFamily: 'var(--font-heading)', fontSize: 24, color: 'var(--destructive)', lineHeight: 1, flexShrink: 0 }}>⪧</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: 24, color: 'var(--muted-foreground)', lineHeight: 1, whiteSpace: 'nowrap' }}>Inventário</span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginLeft: 4 }}>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 16, color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)', lineHeight: 1 }}>
                  {carried}<span style={{ color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)' }}>/{capacity}</span>
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)', lineHeight: 1 }}>
                  {isEncumbered ? 'Sobrecarregado' : 'Carga'}
                </span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginLeft: 4 }}>
                <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 16, color: 'var(--muted-foreground)', lineHeight: 1 }}>
                  {inventory.length}
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 9, letterSpacing: '2.16px', textTransform: 'uppercase', color: 'var(--muted-foreground)', lineHeight: 1 }}>
                  {inventory.length === 1 ? 'Item' : 'Itens'}
                </span>
              </span>
            </span>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <Button onClick={() => setAddingForm({})} variant="secondary" className="tactile">Criar</Button>
              <Button onClick={() => setShowCatalog(true)} variant="hollow" className="tactile">Adicionar</Button>
            </div>
          </div>

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

          {/* Equipamento — armor + shield squares (half each), then the two
              hand slots as wide rectangles, on a nested six-column grid. */}
          <div className="grid-6 grid-6--tight col-span-2 col-sm-full" style={{ alignContent: 'start' }}>
            <div className="col-span-6">
              <SectionSubheading>Equipamento</SectionSubheading>
            </div>
            {renderEquipSlot('armor', 'square', 'Armadura', armorItem, '🛡', 'col-span-3')}
            {renderEquipSlot('offHand', 'square', 'Escudo', shieldCardItem, '🛡', 'col-span-3')}
            {renderEquipSlot('mainHand', 'wide', SLOT_LABELS.mainHand, equipped('mainHand'), '⚔', 'col-span-6')}
            {renderEquipSlot('offHand', 'wide', SLOT_LABELS.offHand, weapon2CardItem, '⚔', 'col-span-6')}
          </div>

          {/* Mochila — item grid with the detail pane below it */}
          <div className="grid-6 grid-6--tight col-span-4 col-sm-full" style={{ alignContent: 'start' }}>
            <div className="col-span-6">
              <SectionSubheading
                trailing={
                  <span style={{ fontFamily: 'var(--font-numeral)', fontSize: 14, color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)', lineHeight: 1, flexShrink: 0 }}>
                    {carried}<span style={{ color: isEncumbered ? 'var(--destructive)' : 'var(--muted-foreground)' }}>/{capacity}</span>
                  </span>
                }
              >
                Mochila
              </SectionSubheading>
            </div>

            {/* Item grid — occupied / available / empty-filler cells. Fluid:
                fills the column width, tiles stay square via aspect-ratio. */}
            <div className="col-span-6" style={{ border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${GRID_COLS}, minmax(64px, 1fr))`, alignContent: 'start' }}>
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
              ) : selectedItem ? (
                <ItemDetailPane
                  item={selectedItem}
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

          {/* Bônus de Combate — inline inputs, spellcasting style */}
          <div className="col-span-6">
            <SectionSubheading trailing={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {([
                  { key: 'meleeBonus' as const, label: 'Corpo-a-corpo', value: meleeBonus },
                  { key: 'rangedBonus' as const, label: 'À distância', value: rangedBonus },
                ] as const).map(({ key, label, value }) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                    <NumInput
                      value={value}
                      onCommit={n => onMeleeRangedUpdate({ [key]: n })}
                      className={cn(
                        'bg-secondary border-border h-auto w-[46px] rounded-sm p-1 text-sm',
                        'font-[var(--font-numeral)]',
                        value > 0
                          ? 'text-[var(--chart-2)]'
                          : value < 0
                            ? 'text-destructive'
                            : 'text-secondary-foreground',
                      )}
                    />
                  </span>
                ))}
              </div>
            }>
              Bônus de Combate
            </SectionSubheading>
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
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--foreground)' }}>
                    {item.isLight ? LIGHT_ICON[item.lightKind ?? 'torch'] : ITEM_ICON[item.type] ?? '⚗'} {item.name}
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

            {(['mainHand', 'offHand'] as EquipSlot[])
              .map(slot => ({ slot, item: inventory.find(i => i.equipped && i.slot === slot) }))
              .filter(({ item }) => item)
              .map(({ slot, item }) => (
                <Button
                  key={slot}
                  variant="ghost"
                  onClick={() => equipItem(replaceFor, slot)}
                  className="block h-auto w-full rounded-none border-b border-b-[var(--border)] px-0 py-2 text-left normal-case transition-colors duration-200 hover:bg-[var(--input)]"
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--foreground)' }}>
                    {item!.isLight ? LIGHT_ICON[item!.lightKind ?? 'torch'] : ITEM_ICON[item!.type] ?? '⚗'} {item!.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                    {item!.damageDie ? `${item!.damageDie}` : ''}
                    {item!.acBonus ? `+${item!.acBonus} CA` : ''}
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
