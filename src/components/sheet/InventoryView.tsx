'use client'

import { useState } from 'react'
import type { InventoryItem, EquipSlot, ItemType } from '@/types/inventory.types'
import { modifier } from '@/lib/dice'
import type { RollResult } from '@/lib/dice'
import { rollDie } from '@/lib/dice'

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
      textTransform: 'uppercase',
      color: 'var(--bone-muted)',
      marginBottom: 10,
      paddingBottom: 7,
      borderBottom: '1px solid rgba(139,112,48,0.18)',
    }}>
      {icon} {text}
    </div>
  )
}

interface Props {
  inventory: InventoryItem[]
  str: number
  onUpdate: (inventory: InventoryItem[]) => void
  onRoll?: (result: RollResult) => void
  meleeBonus: number
  rangedBonus: number
}

export function InventoryView({ inventory, str, onUpdate, onRoll, meleeBonus, rangedBonus }: Props) {
  const [selectingSlot, setSelectingSlot] = useState<EquipSlot | null>(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const strMod = modifier(str)
  const maxSlots = str
  const usedSlots = inventory.reduce((acc, i) => acc + i.slots * i.quantity, 0)
  const isEncumbered = usedSlots > maxSlots

  const equipped = (slot: EquipSlot) => inventory.find(i => i.equipped && i.slot === slot)

  function updateItem(id: string, patch: Partial<InventoryItem>) {
    onUpdate(inventory.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id: string) {
    onUpdate(inventory.filter(i => i.id !== id))
  }

  function addItem(item: InventoryItem) {
    onUpdate([...inventory, item])
    setAdding(false)
  }

  function equipItem(id: string, slot: EquipSlot) {
    onUpdate(inventory.map(i =>
      i.id === id ? { ...i, equipped: true, slot } : i
    ))
    setSelectingSlot(null)
  }

  function unequipItem(id: string) {
    updateItem(id, { equipped: false, slot: undefined, isLit: false })
  }

  function rollAttack(item: InventoryItem) {
    if (!onRoll) return
    const bonus = meleeBonus + (item.attackBonus ?? 0) + (item.weaponKind === 'ranged' ? rangedBonus - meleeBonus : 0)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Capacity bar */}
      <div className="worn-border" style={panelStyle({ padding: '12px 15px' })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: isEncumbered ? 'var(--blood-bright)' : 'var(--bone-muted)' }}>
            {isEncumbered ? '⚠ Sobrecarregado' : '⚗ Carga'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isEncumbered ? 'var(--blood-bright)' : 'var(--parchment-light)' }}>
            {usedSlots} / {maxSlots} slots
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--ink-deep)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: 4,
            background: isEncumbered ? 'var(--blood-bright)' : 'var(--verdigris-light)',
            width: `${Math.min(100, (usedSlots / maxSlots) * 100)}%`,
            transition: 'width 400ms',
          }} />
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)', marginTop: 4 }}>
          Força {str} determina o limite de {maxSlots} slots (FOR + mod = {str}{strMod >= 0 ? `+${strMod}` : strMod})
        </div>
      </div>

      {/* Equipped slots */}
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
                  minHeight: 80,
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
                      <span style={{ fontSize: 12 }}>{item.isLight ? LIGHT_ICON[item.lightKind ?? 'torch'] : ITEM_ICON[item.type] ?? '⚗'}</span>
                      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 10, color: 'var(--parchment-light)', flex: 1, lineHeight: 1.3 }}>
                        {item.name}
                      </span>
                    </div>

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
                        {item.lightMinutesLeft !== undefined && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: item.isLit ? 'var(--candle-amber)' : 'var(--bone-muted)' }}>
                            {item.lightMinutesLeft}min
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => unequipItem(item.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-heading)', fontSize: 7,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--blood-mid)', alignSelf: 'flex-start',
                      }}
                    >
                      Desequipar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setSelectingSlot(slot)}
                    style={{
                      background: 'none', border: '1px dashed rgba(139,112,48,0.3)',
                      cursor: 'pointer', flex: 1, display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-heading)', fontSize: 9,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
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
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
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
                    padding: '8px 0', cursor: 'pointer',
                    transition: 'background 200ms',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,112,48,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--parchment-light)' }}>
                    {ITEM_ICON[item.type] ?? '⚗'} {item.name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 9.5, color: 'var(--bone-muted)', marginTop: 1 }}>
                    {item.slots} slot{item.slots !== 1 ? 's' : ''}{item.damageDie ? ` · ${item.damageDie}` : ''}{item.acBonus ? ` · CA +${item.acBonus}` : ''}
                  </div>
                </button>
              ))
            )}
            <button
              onClick={() => setSelectingSlot(null)}
              style={{ ...quickBtnStyle('dark'), marginTop: 12, width: '100%' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Inventory list */}
      <div className="worn-border" style={panelStyle({ padding: '14px 15px' })}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 7, borderBottom: '1px solid rgba(139,112,48,0.18)' }}>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 8.5, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-muted)' }}>
            ⚗ Inventário
          </span>
          <button
            onClick={() => setAdding(true)}
            style={{
              background: 'rgba(42,34,16,0.5)',
              border: '1px solid rgba(139,112,48,0.3)',
              color: 'var(--parchment-light)',
              fontFamily: 'var(--font-heading)',
              fontSize: 8,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '4px 10px',
              cursor: 'pointer',
              borderRadius: 1,
              transition: 'all 300ms',
            }}
          >
            + Adicionar
          </button>
        </div>

        {adding && (
          <AddItemForm
            onAdd={addItem}
            onCancel={() => setAdding(false)}
          />
        )}

        {inventory.length === 0 && !adding ? (
          <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--parchment-warm)' }}>
            Nenhum item registrado no arquivo.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 0',
        borderBottom: last ? 'none' : '1px solid rgba(139,112,48,0.1)',
        transition: 'background 200ms',
        background: hov ? 'rgba(139,112,48,0.04)' : 'none',
        borderRadius: 1,
      }}
    >
      <span style={{ fontSize: 12, flexShrink: 0 }}>
        {item.isLight ? LIGHT_ICON[item.lightKind ?? 'torch'] : ITEM_ICON[item.type] ?? '⚗'}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'var(--bone-muted)' }}>
            {item.slots} slot{item.slots !== 1 ? 's' : ''}
            {item.quantity > 1 ? ` · ×${item.quantity}` : ''}
            {item.damageDie ? ` · ${item.damageDie}` : ''}
            {item.acBonus ? ` · CA ${item.acBonus}` : ''}
            {item.cost ? ` · ${item.cost}` : ''}
          </span>
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

function AddItemForm({ onAdd, onCancel }: { onAdd: (i: InventoryItem) => void; onCancel: () => void }) {
  const blank: Partial<InventoryItem> = { type: 'gear', slots: 1, quantity: 1 }
  const [form, setForm] = useState<Partial<InventoryItem>>(blank)

  function submit() {
    if (!form.name?.trim()) return
    const isLight = isLightSource(form.name)
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
      isLight: isLight || form.isLight,
      lightKind: isLight ? 'torch' : form.lightKind,
      lightMaxMinutes: isLight ? 60 : form.lightMaxMinutes,
      lightMinutesLeft: isLight ? 60 : form.lightMinutesLeft,
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
        <button onClick={submit} disabled={!form.name?.trim()} style={{ ...quickBtnStyle('blood'), flex: 1 }}>
          Adicionar
        </button>
        <button onClick={onCancel} style={{ ...quickBtnStyle('dark'), flex: 1 }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function EditItemForm({ item, onSave, onCancel }: { item: InventoryItem; onSave: (p: Partial<InventoryItem>) => void; onCancel: () => void }) {
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
        <button onClick={() => onSave(form)} style={{ ...quickBtnStyle('blood'), flex: 1 }}>
          Salvar
        </button>
        <button onClick={onCancel} style={{ ...quickBtnStyle('dark'), flex: 1 }}>
          Cancelar
        </button>
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
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <FieldLabel>Slots</FieldLabel>
            <input type="number" value={form.slots ?? 1} min={1} onChange={e => set({ slots: parseInt(e.target.value) || 1 })} style={inp} />
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <FieldLabel>CA Base / Bônus</FieldLabel>
            <input type="number" value={form.acBonus ?? 0} onChange={e => set({ acBonus: parseInt(e.target.value) || 0 })} style={inp} />
          </div>
        </div>
      )}

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
  )
}

function isLightSource(name: string) {
  const n = name.toLowerCase()
  return n.includes('tocha') || n.includes('torch') || n.includes('lampião') || n.includes('lantern') || n.includes('vela') || n.includes('candle')
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-muted)', marginBottom: 3 }}>
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

type BtnVariant = 'blood' | 'mist' | 'amber' | 'dark' | 'danger'

function quickBtnStyle(variant: BtnVariant): React.CSSProperties {
  const map: Record<BtnVariant, [string, string, string]> = {
    blood:  ['rgba(139,21,21,0.35)', 'var(--blood-mid)', 'var(--bone-white)'],
    mist:   ['rgba(42,26,58,0.35)', 'rgba(107,78,138,0.5)', 'var(--bone-white)'],
    amber:  ['rgba(106,58,10,0.3)', '#6B3A0A', 'var(--bone-white)'],
    dark:   ['rgba(42,34,16,0.4)', 'rgba(139,112,48,0.3)', 'var(--bone-muted)'],
    danger: ['rgba(139,21,21,0.2)', 'rgba(196,32,32,0.4)', 'var(--blood-bright)'],
  }
  const [bg, border, color] = map[variant]
  return {
    background: bg,
    border: `1px solid ${border}`,
    color,
    fontFamily: 'var(--font-heading)',
    fontSize: 8,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: 1,
    transition: 'all 250ms',
    whiteSpace: 'nowrap',
  }
}
