'use client'

import { useState, useEffect, useRef } from 'react'
import type { InventoryItem, EquipSlot, ItemType } from '@/types/inventory.types'
import type { RollResult } from '@/lib/dice'
import { rollDie } from '@/lib/dice'
import { sendToDiscord } from '@/lib/discord'

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_LABELS: Record<EquipSlot, string> = {
  mainHand: 'Mão Principal',
  offHand: 'Mão Secundária',
  armor: 'Armadura',
}

const SLOT_ALLOWED: Record<EquipSlot, ItemType[]> = {
  mainHand: ['weapon', 'gear'],
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

// ─── Item Presets ─────────────────────────────────────────────────────────────

const WEAPON_PRESETS: Array<Partial<InventoryItem>> = [
  { name: 'Espada',     type: 'weapon', slots: 1, quantity: 1, weaponKind: 'melee',  damageDie: '1d8', description: '' },
  { name: 'Adaga',      type: 'weapon', slots: 1, quantity: 1, weaponKind: 'melee',  damageDie: '1d4', description: '' },
  { name: 'Maça',       type: 'weapon', slots: 1, quantity: 1, weaponKind: 'melee',  damageDie: '1d6', description: '' },
  { name: 'Arco Curto', type: 'weapon', slots: 2, quantity: 1, weaponKind: 'ranged', damageDie: '1d6', description: 'Duas mãos' },
  { name: 'Lança',      type: 'weapon', slots: 1, quantity: 1, weaponKind: 'melee',  damageDie: '1d6', description: '' },
  { name: 'Machado',    type: 'weapon', slots: 1, quantity: 1, weaponKind: 'melee',  damageDie: '1d6', description: '' },
]

const ARMOR_PRESETS: Array<Partial<InventoryItem>> = [
  { name: 'Couro',              type: 'armor',  slots: 1, quantity: 1, acBonus: 11, description: 'CA 11 + mod DES' },
  { name: 'Cota de Malha',      type: 'armor',  slots: 2, quantity: 1, acBonus: 14, description: 'CA 14' },
  { name: 'Armadura de Placas', type: 'armor',  slots: 3, quantity: 1, acBonus: 16, description: 'CA 16' },
  { name: 'Escudo',             type: 'shield', slots: 1, quantity: 1, acBonus: 2,  description: '+2 CA' },
]

const GEAR_PRESETS: Array<Partial<InventoryItem>> = [
  { name: 'Tocha',           type: 'gear', slots: 1, quantity: 1, isLight: true, lightKind: 'torch',   lightMaxMinutes: 60,  lightMinutesLeft: 60,  description: '60 min de luz' },
  { name: 'Lanterna',        type: 'gear', slots: 1, quantity: 1, isLight: true, lightKind: 'lantern', lightMaxMinutes: 120, lightMinutesLeft: 120, description: '120 min de luz' },
  { name: 'Vela',            type: 'gear', slots: 1, quantity: 3, isLight: true, lightKind: 'candle',  lightMaxMinutes: 30,  lightMinutesLeft: 30,  description: '30 min de luz fraca' },
  { name: 'Corda (15m)',     type: 'gear', slots: 1, quantity: 1, description: '' },
  { name: 'Rações (3 dias)', type: 'gear', slots: 1, quantity: 1, description: '' },
  { name: 'Mochila',         type: 'gear', slots: 0, quantity: 1, description: 'Não ocupa espaço' },
  { name: 'Óleo (frasco)',   type: 'gear', slots: 1, quantity: 1, description: 'Combustível para lanterna' },
  { name: 'Alavanca',        type: 'gear', slots: 1, quantity: 1, description: '' },
]

// ─── AC Calculation ───────────────────────────────────────────────────────────

function calculateAC(inv: InventoryItem[], dex: number): number {
  const dexMod = Math.floor((dex - 10) / 2)
  const armor  = inv.find(i => i.equipped && i.slot === 'armor'   && i.type === 'armor')
  const shield = inv.find(i => i.equipped && i.slot === 'offHand' && i.type === 'shield')

  let ac = 10 + dexMod
  if (armor?.acBonus) {
    // CA < 14 = armadura leve (aplica mod DES), CA >= 14 = pesada (ignora DES)
    const appliesDex = armor.acBonus < 14
    ac = armor.acBonus + (appliesDex ? dexMod : 0)
  }
  if (shield?.acBonus) ac += shield.acBonus
  return ac
}

// ─── Style helpers ────────────────────────────────────────────────────────────

function panelStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: 'linear-gradient(148deg, rgba(74,54,28,.22) 0%, rgba(46,34,16,0) 42%, rgba(14,10,3,.16) 100%), var(--parchment-mid)',
    border: '1px solid rgba(139,112,48,0.33)',
    boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
    borderRadius: 1,
    ...extra,
  }
}

function sectionLabel(text: string, icon?: string) {
  return (
    <div style={{
      fontFamily: 'var(--font-heading)',
      fontSize: 8.5,
      letterSpacing: '0.2em',
      textTransform: 'uppercase' as const,
      color: 'var(--bone-muted)',
      marginBottom: 10,
      paddingBottom: 7,
      borderBottom: '1px solid rgba(139,112,48,0.18)',
    }}>
      {icon} {text}
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
    <div className="worn-border" style={panelStyle({ padding: '12px 15px' })}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 8.5,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: isEncumbered ? 'var(--blood-bright)' : 'var(--bone-muted)',
        }}>
          {isEncumbered ? '⚠ Sobrecarregado' : '⚗ Carga'}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: isEncumbered ? 'var(--blood-bright)' : 'var(--parchment-light)',
        }}>
          {usedSlots} / {maxSlots} slots
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
        Força {str} determina o limite de {maxSlots} slots de carga.
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
    <div className="worn-border" style={panelStyle({ padding: '12px 14px' })}>
      {sectionLabel('Tesouro', '✦')}
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
            <input
              type="number"
              value={value}
              min={0}
              onChange={e => onUpdate({ [key]: Math.max(0, parseInt(e.target.value) || 0) })}
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

type PresetTab = 'weapons' | 'armors' | 'gear'
const PRESET_TABS: Record<PresetTab, { label: string; items: Array<Partial<InventoryItem>> }> = {
  weapons: { label: '⚔ Armas',        items: WEAPON_PRESETS },
  armors:  { label: '🛡 Armaduras',   items: ARMOR_PRESETS  },
  gear:    { label: '⚗ Equipamentos', items: GEAR_PRESETS   },
}

function PresetPickerModal({ onSelect, onClose }: {
  onSelect: (preset: Partial<InventoryItem>) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<PresetTab>('weapons')

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
          minWidth: 320,
          maxWidth: 420,
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--parchment-light)', marginBottom: 12 }}>
          ⚗ Adicionar de Predefinição
        </div>

        <div style={{ display: 'flex', gap: 2, marginBottom: 12, borderBottom: '1px solid rgba(139,112,48,0.2)', paddingBottom: 0 }}>
          {(Object.keys(PRESET_TABS) as PresetTab[]).map(t => (
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
              {PRESET_TABS[t].label}
            </button>
          ))}
        </div>

        {PRESET_TABS[tab].items.map((preset, i) => (
          <button
            key={i}
            onClick={() => onSelect(preset)}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              borderBottom: '1px solid rgba(139,112,48,0.1)',
              padding: '9px 4px',
              cursor: 'pointer',
              transition: 'background 200ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,112,48,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--parchment-light)', marginBottom: 2 }}>
              {preset.isLight
                ? LIGHT_ICON[preset.lightKind ?? 'torch']
                : ITEM_ICON[preset.type ?? 'gear'] ?? '⚗'
              } {preset.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)' }}>
              {preset.slots} slot{preset.slots !== 1 ? 's' : ''}
              {preset.damageDie ? ` · ${preset.damageDie}` : ''}
              {preset.acBonus ? ` · CA ${preset.acBonus}` : ''}
              {preset.description ? ` · ${preset.description}` : ''}
            </div>
          </button>
        ))}

        <button onClick={onClose} style={{ ...quickBtnStyle('dark'), width: '100%', marginTop: 12, padding: '7px 0' }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function ItemRow({ item, last, onEdit, onRemove, onRollAttack, onRollDamage }: {
  item: InventoryItem
  last: boolean
  onEdit: () => void
  onRemove: () => void
  onRollAttack?: () => void
  onRollDamage?: () => void
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
          {onRollAttack && <button onClick={onRollAttack} style={quickBtnStyle('blood')}>Atk</button>}
          {onRollDamage && <button onClick={onRollDamage} style={quickBtnStyle('mist')}>Dmg</button>}
          <button onClick={onEdit} style={quickBtnStyle('dark')}>✎</button>
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
  const [showPresets, setShowPresets]     = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)

  // Stable refs for the light timer (avoids stale closures)
  const inventoryRef = useRef(inventory)
  const onUpdateRef  = useRef(onUpdate)
  const playerRef    = useRef(playerName)
  useEffect(() => { inventoryRef.current = inventory }, [inventory])
  useEffect(() => { onUpdateRef.current  = onUpdate   }, [onUpdate])
  useEffect(() => { playerRef.current    = playerName  }, [playerName])

  // Per-item light source burn timer
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

  const maxSlots  = str
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

  function addItem(item: InventoryItem) {
    onUpdate([...inventory, item])
    setAddingForm(null)
  }

  function equipItem(id: string, slot: EquipSlot) {
    const next = inventory.map(i => i.id === id ? { ...i, equipped: true, slot } : i)
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
    setSelectingSlot(null)
  }

  function unequipItem(id: string) {
    const next = inventory.map(i =>
      i.id === id ? { ...i, equipped: false, slot: undefined as any, isLit: false } : i
    )
    onUpdate(next)
    onAcChange(calculateAC(next, dex))
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
    const result = rollDie(item.damageDie, `Dano: ${item.name}`, 'Arma')
    onRoll(result)
  }

  const unequippedCompatible = (slot: EquipSlot) =>
    inventory.filter(i =>
      !i.equipped &&
      (SLOT_ALLOWED[slot].includes(i.type) || (slot !== 'armor' && i.isLight))
    )

  function handlePresetSelect(preset: Partial<InventoryItem>) {
    setShowPresets(false)
    setAddingForm(preset)
  }

  const calcAC = calculateAC(inventory, dex)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* A: Capacity Dashboard + Melee/Ranged bonuses */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
        <div style={{ flex: 1 }}>
          <CapacityDashboard str={str} usedSlots={usedSlots} />
        </div>
        <div className="worn-border" style={{ ...panelStyle({ padding: '12px 14px' }), flexShrink: 0, minWidth: 148 }}>
          {sectionLabel('Bônus', '⚔')}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { key: 'meleeBonus' as const, label: '⚔ Corpo', value: meleeBonus },
              { key: 'rangedBonus' as const, label: '🏹 Dist.', value: rangedBonus },
            ] as const).map(({ key, label, value }) => (
              <div
                key={key}
                className="worn-border"
                style={{ background: 'rgba(42,34,16,0.4)', border: '1px solid rgba(139,112,48,0.22)', padding: '6px 8px', textAlign: 'center' }}
              >
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 6.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 2 }}>
                  {label}
                </div>
                <input
                  type="number"
                  value={value}
                  onChange={e => onMeleeRangedUpdate({ [key]: parseInt(e.target.value) || 0 })}
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

      {/* B: Equipped Slots */}
      <div className="worn-border" style={panelStyle({ padding: '14px 15px' })}>
        {sectionLabel('Itens Equipados', '⚔')}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {(['mainHand', 'offHand', 'armor'] as EquipSlot[]).map(slot => {
            const item = equipped(slot)
            return (
              <div
                key={slot}
                className="worn-border"
                style={{
                  background: item
                    ? 'linear-gradient(148deg, rgba(74,54,28,.3) 0%, rgba(14,10,3,.2) 100%), #2E2210'
                    : 'rgba(42,34,16,0.3)',
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

                    {slot === 'offHand' && item.type === 'shield' && item.acBonus && (
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

      {/* C: Backpack */}
      <div className="worn-border" style={panelStyle({ padding: '14px 15px' })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
            ⚗ Inventário
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { setShowPresets(true); setAddingForm(null) }} style={quickBtnStyle('dark')}>
              ⚗ Predefinição
            </button>
            <button onClick={() => { setAddingForm({}); setShowPresets(false) }} style={quickBtnStyle('blood')}>
              + Adicionar
            </button>
          </div>
        </div>

        {showPresets && (
          <PresetPickerModal
            onSelect={handlePresetSelect}
            onClose={() => setShowPresets(false)}
          />
        )}

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
                    onRollAttack={onRoll ? () => rollAttack(item) : undefined}
                    onRollDamage={onRoll && item.damageDie ? () => rollDamage(item) : undefined}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* D: Treasure Vault */}
      <TreasureVault gold={gold} silver={silver} copper={copper} onUpdate={onCurrencyUpdate} />
    </div>
  )
}
