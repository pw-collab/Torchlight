'use client'

import { useState, useEffect, useRef } from 'react'
import type { InventoryItem, EquipSlot, ItemType } from '@/types/inventory.types'
import type { RollResult } from '@/lib/dice'
import type { Item as CatalogItem } from '@/data/inventory/index'
import { WEAPONS, ARMORS, GEAR } from '@/data/inventory/index'
import { rollDie, rollFormula, modifier } from '@/lib/dice'
import { sendToDiscord } from '@/lib/discord'
import { NumInput } from '@/components/sheet/NumInput'

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
}

const LIGHT_ICON: Record<string, string> = {
  torch: '🕯',
  candle: '🕯',
  lantern: '🏮',
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

const PANEL_BORDER = '1px solid rgba(139,112,48,0.33)'
const PANEL_BORDER_LIGHT = '1px solid rgba(139,112,48,0.18)'

function panelBase(extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: PANEL_BORDER,
    borderTop: 'none',
    ...extra,
  }
}

function sectionHeader(text: string) {
  return (
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 8.5,
      letterSpacing: '0.2em',
      textTransform: 'uppercase' as const,
      color: 'var(--bone-muted)',
      paddingBottom: 7,
      borderBottom: PANEL_BORDER_LIGHT,
      marginBottom: 10,
    }}>
      {text}
    </div>
  )
}

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

function quickBtnStyle(variant: BtnVariant): React.CSSProperties {
  const map: Record<BtnVariant, [string, string, string]> = {
    blood:  ['rgba(139,21,21,0.35)',  'var(--blood-mid)',       'var(--bone-white)'],
    mist:   ['rgba(42,26,58,0.35)',   'rgba(107,78,138,0.5)',  'var(--bone-white)'],
    amber:  ['rgba(106,58,10,0.3)',   '#6B3A0A',               'var(--bone-white)'],
    dark:   ['rgba(42,34,16,0.4)',    'rgba(139,112,48,0.3)',  'var(--bone-muted)'],
    danger: ['rgba(139,21,21,0.2)',   'rgba(196,32,32,0.4)',   'var(--blood-bright)'],
    green:  ['rgba(42,80,69,0.3)',    '#2A5045',               'var(--bone-white)'],
  }
  const [bg, border, color] = map[variant]
  return {
    background: bg,
    border: `1px solid ${border}`,
    color,
    fontFamily: 'var(--font-heading)',
    fontSize: 8,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: 1,
    transition: 'all 250ms',
    whiteSpace: 'nowrap' as const,
  }
}

function isLightSource(name: string): boolean {
  const n = name.toLowerCase()
  return n.includes('tocha') || n.includes('torch') || n.includes('lampião') || n.includes('lantern') || n.includes('vela') || n.includes('candle')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CapacityDashboard({ str, usedSlots }: { str: number; usedSlots: number }) {
  const maxSlots = str
  const isEncumbered = usedSlots > maxSlots
  const percent = Math.min(100, maxSlots > 0 ? (usedSlots / maxSlots) * 100 : 0)

  return (
    <div style={panelBase({ padding: 20, background: 'var(--parchment-mid)', border: PANEL_BORDER, borderTop: PANEL_BORDER })}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 8.5,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isEncumbered ? 'var(--blood-bright)' : 'var(--bone-muted)',
        }}>
          {isEncumbered ? 'Sobrecarregado' : 'Carga'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: isEncumbered ? 'var(--blood-bright)' : 'var(--parchment-light)',
        }}>
          {usedSlots} / {maxSlots}
        </span>
      </div>

      <div style={{ height: 4, background: 'var(--ink-deep)', borderRadius: 1, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{
          height: 4,
          background: isEncumbered ? 'var(--blood-bright)' : 'var(--verdigris-light)',
          width: `${percent}%`,
          transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {Array.from({ length: maxSlots }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              background: i < usedSlots
                ? isEncumbered ? 'var(--blood-bright)' : 'var(--verdigris-light)'
                : 'transparent',
              border: `1px solid ${
                i < usedSlots
                  ? isEncumbered ? 'var(--blood-bright)' : 'var(--verdigris-light)'
                  : 'rgba(139,112,48,0.25)'
              }`,
              transition: 'all 300ms',
              opacity: i < usedSlots ? 0.85 : 0.45,
            }}
          />
        ))}
      </div>

      <div style={{
        fontFamily: 'var(--font-body)',
        fontStyle: 'italic',
        fontSize: 9.5,
        color: 'var(--bone-muted)',
        marginTop: 6,
      }}>
        FOR {str} → {maxSlots} slots
      </div>
    </div>
  )
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
    <div style={panelBase({ padding: 40 })}>
      {sectionHeader('Tesouro')}
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
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-light)', marginBottom: 10 }}>
          Adicionar do Catálogo
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

function ItemRow({ item, last, onEdit, onRemove, onEquipToggle, onConsume }: {
  item: InventoryItem
  last: boolean
  onEdit: () => void
  onRemove: () => void
  onEquipToggle?: () => void
  onConsume?: () => void
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: last ? 'none' : '1px solid rgba(139,112,48,0.1)',
        background: hov ? 'rgba(139,112,48,0.04)' : 'none',
        borderRadius: 1,
        transition: 'background 200ms',
      }}
    >
      <span style={{ fontSize: 12, flexShrink: 0 }}>
        {item.isLight
          ? (item.isLit ? '🔥' : LIGHT_ICON[item.lightKind ?? 'torch'])
          : ITEM_ICON[item.type] ?? '⚗'}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--parchment-light)', fontWeight: 500 }}>
            {item.name}
          </span>
          {item.equipped && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--verdigris-light)', background: 'rgba(42,80,69,0.2)', border: '1px solid rgba(42,80,69,0.35)', padding: '1px 5px', borderRadius: 1 }}>
              Equipado
            </span>
          )}
          {item.isLit && (
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--candle-amber)', background: 'rgba(196,120,42,0.12)', border: '1px solid rgba(196,120,42,0.3)', padding: '1px 5px', borderRadius: 1 }}>
              Acesa
            </span>
          )}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)', marginTop: 2 }}>
          {item.slots} slot{item.slots !== 1 ? 's' : ''}
          {item.quantity > 1 ? ` · ×${item.quantity}` : ''}
          {item.damageDie ? ` · ${item.damageDie}` : ''}
          {item.acBonus ? ` · CA ${item.acBonus}` : ''}
          {item.isLight && item.lightMinutesLeft != null ? ` · ${item.lightMinutesLeft}min` : ''}
          {item.cost ? ` · ${item.cost}` : ''}
        </div>
      </div>

      {hov && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {onConsume && <button onClick={onConsume} style={quickBtnStyle('green')}>Consumir</button>}
          <button onClick={onEdit} style={quickBtnStyle('dark')}>✎</button>
          {onEquipToggle && (
            <button onClick={onEquipToggle} style={quickBtnStyle(item.equipped ? 'amber' : 'mist')}>
              {item.equipped ? 'Desequipar' : 'Equipar'}
            </button>
          )}
          <button onClick={onRemove} style={quickBtnStyle('danger')}>✕</button>
        </div>
      )}
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
  const [replaceFor, setReplaceFor]       = useState<string | null>(null)

  const inventoryRef = useRef(inventory)
  const onUpdateRef  = useRef(onUpdate)
  const playerRef    = useRef(playerName)
  useEffect(() => { inventoryRef.current = inventory }, [inventory])
  useEffect(() => { onUpdateRef.current  = onUpdate   }, [onUpdate])
  useEffect(() => { playerRef.current    = playerName  }, [playerName])

  useEffect(() => {
    const id = setInterval(() => {
      const inv = inventoryRef.current
      if (!inv.some(i => i.equipped && i.isLight && i.isLit && (i.lightMinutesLeft ?? 0) > 0)) return

      let burnedOut = false
      const updated = inv.map(item => {
        if (!item.equipped || !item.isLight || !item.isLit) return item
        const mins = (item.lightMinutesLeft ?? 0) - 1
        if (mins <= 0) {
          burnedOut = true
          return { ...item, isLit: false, lightMinutesLeft: 0 }
        }
        return { ...item, lightMinutesLeft: mins }
      })

      onUpdateRef.current(updated)
      if (burnedOut) sendToDiscord({ type: 'torch_out', player: playerRef.current })
    }, 60_000)

    return () => clearInterval(id)
  }, [])

  const usedSlots = inventory.reduce((acc, i) => acc + i.slots * i.quantity, 0)
  const equipped  = (slot: EquipSlot) => inventory.find(i => i.equipped && i.slot === slot)

  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onUpdate(inventory.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id: string) {
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

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>

      {/* ── Left column: Equipped + Backpack + Treasure ── */}
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid rgba(139,112,48,0.22)' }}>

        {/* Equipped Slots */}
        <div style={{ padding: 40, borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
          {sectionHeader('Itens Equipados')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {(['mainHand', 'offHand', 'armor'] as EquipSlot[]).map(slot => {
              const item = equipped(slot)
              return (
                <div
                  key={slot}
                  className="worn-border"
                  style={{
                    background: item ? 'rgba(42,34,16,0.5)' : 'rgba(42,34,16,0.3)',
                    border: `1px solid ${item ? 'rgba(139,112,48,0.4)' : 'rgba(139,112,48,0.18)'}`,
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
                        <span style={{ fontSize: 12 }}>
                          {item.isLight
                            ? (item.isLit ? '🔥' : LIGHT_ICON[item.lightKind ?? 'torch'])
                            : ITEM_ICON[item.type] ?? '⚗'}
                        </span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, color: 'var(--parchment-light)', flex: 1, lineHeight: 1.3 }}>
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
                          <button onClick={() => rollAttack(item)} style={quickBtnStyle('blood')}>Atk</button>
                          {item.damageDie && <button onClick={() => rollDamage(item)} style={quickBtnStyle('mist')}>Dmg</button>}
                        </div>
                      )}

                      {item.type === 'shield' && onRoll && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => rollParry(item)} style={quickBtnStyle('mist')}>Aparar</button>
                        </div>
                      )}

                      {item.isLight && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => updateItem(item.id, { isLit: !item.isLit })}
                            style={quickBtnStyle(item.isLit ? 'amber' : 'dark')}
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
                        border: '1px dashed rgba(139,112,48,0.3)',
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
        </div>

        {/* Backpack */}
        <div style={{ padding: 40, borderBottom: '1px solid rgba(139,112,48,0.22)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
              Inventário
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setAddingForm({})} style={quickBtnStyle('dark')}>
                + Manual
              </button>
              <button onClick={() => setShowCatalog(true)} style={quickBtnStyle('blood')}>
                Catálogo
              </button>
            </div>
          </div>

          {addingForm !== null && (
            <AddItemForm
              initialForm={addingForm}
              onAdd={addItem}
              onCancel={() => setAddingForm(null)}
            />
          )}

          {inventory.length === 0 && addingForm === null ? (
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
              Nenhum item registrado no arquivo.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {inventory.map((item, i) => (
                <li key={item.id}>
                  {editingId === item.id ? (
                    <EditItemForm
                      item={item}
                      onSave={updated => { updateItem(item.id, updated); setEditingId(null) }}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <ItemRow
                      item={item}
                      last={i === inventory.length - 1}
                      onEdit={() => setEditingId(item.id)}
                      onRemove={() => removeItem(item.id)}
                      onEquipToggle={isEquippable(item) ? () => toggleEquipFromList(item) : undefined}
                      onConsume={item.type === 'gear' ? () => consumeItem(item.id) : undefined}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Treasure */}
        <TreasureVault gold={gold} silver={silver} copper={copper} onUpdate={onCurrencyUpdate} />
      </div>

      {/* ── Right column: Capacity + Bonuses ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        <CapacityDashboard str={str} usedSlots={usedSlots} />

        {/* Bonuses (vertical) */}
        <div style={{ padding: 20, background: 'var(--parchment-mid)', border: PANEL_BORDER, borderTop: 'none' }}>
          {sectionHeader('Bônus de Combate')}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([
              { key: 'meleeBonus' as const, label: 'Corpo-a-Corpo', value: meleeBonus },
              { key: 'rangedBonus' as const, label: 'À Distância', value: rangedBonus },
            ] as const).map(({ key, label, value }) => (
              <div
                key={key}
                className="worn-border"
                style={{ background: 'rgba(42,34,16,0.4)', border: '1px solid rgba(139,112,48,0.22)', padding: '6px 8px', textAlign: 'center' }}
              >
                <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9, color: 'var(--bone-muted)', marginBottom: 2 }}>
                  {label}
                </div>
                <NumInput
                  value={value}
                  onCommit={n => onMeleeRangedUpdate({ [key]: n })}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700,
                    color: value > 0 ? 'var(--verdigris-light)' : value < 0 ? 'var(--blood-bright)' : 'var(--bone-white)',
                    cursor: 'text',
                  }}
                />
              </div>
            ))}
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
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-light)', marginBottom: 12 }}>
              Equipar em {SLOT_LABELS[selectingSlot]}
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
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-light)', marginBottom: 4 }}>
              Mãos Ocupadas
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
    </div>
  )
}
