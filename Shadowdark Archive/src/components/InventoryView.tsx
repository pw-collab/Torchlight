import { Grid, List, Backpack, Swords, Zap, Coins, PlusCircle, Shield, Trash2, Save, X, Database, Loader2, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, Item, RollResult } from '../types';
import { useState, useEffect, useRef } from 'react';
import { rollDie } from '../lib/dice';
import { WEAPONS, ARMORS, GEAR } from '../data/inventory';

interface InventoryViewProps {
  character: Character;
  onUpdateCharacter: (updates: Partial<Character>) => void;
  onRoll: (result: RollResult) => void;
}

export default function InventoryView({ character, onUpdateCharacter, onRoll }: InventoryViewProps) {
  const totalSlots = character.attributes.find(a => a.name === 'Strength')?.value || 10;
  const occupiedSlots = character.inventory.reduce((acc, item) => acc + item.weight, 0);
  const remainingSlots = Math.max(0, totalSlots - occupiedSlots);

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<'mainHand' | 'offHand' | 'armor' | null>(null);
  const [newItem, setNewItem] = useState<Partial<Item>>({
    name: '',
    description: '',
    weight: 1,
    quantity: 1,
    type: 'gear',
    equipped: false
  });

  const slots = {
    mainHand: { label: 'Main Hand', allowedTypes: ['weapon', 'gear'] },
    offHand: { label: 'Off-Hand', allowedTypes: ['weapon', 'shield', 'gear'] },
    armor: { label: 'Armor', allowedTypes: ['armor'] }
  };

  const calculateAC = (inventory: Item[]) => {
    const dexMod = character.attributes.find(a => a.name === 'Dexterity')?.modifier || 0;
    let baseAC = 10 + dexMod;
    
    const equippedArmor = inventory.find(i => i.equipped && i.slot === 'armor');
    if (equippedArmor) {
      if (equippedArmor.acBonus && equippedArmor.acBonus > 5) {
        baseAC = equippedArmor.acBonus + dexMod;
      } else if (equippedArmor.acBonus) {
        baseAC += equippedArmor.acBonus;
      }
    }
    
    const equippedShield = inventory.find(i => i.equipped && i.slot === 'offHand' && i.type === 'shield');
    if (equippedShield && equippedShield.acBonus) {
      baseAC += equippedShield.acBonus;
    }
    
    return baseAC;
  };

  useEffect(() => {
    const newAC = calculateAC(character.inventory);
    if (newAC !== character.ac) {
      onUpdateCharacter({ ac: newAC });
    }
  }, [character.inventory]);

  useEffect(() => {
    const interval = setInterval(() => {
      const litLightSource = character.inventory.find(i => i.equipped && i.isLit);
      if (litLightSource && litLightSource.torchTimeRemaining !== undefined) {
        const newTime = Math.max(0, litLightSource.torchTimeRemaining - 1);
        const updates: Partial<Item> = { torchTimeRemaining: newTime };
        
        if (newTime === 0) {
          updates.isLit = false;
          if (!litLightSource.name.includes('(Fully Burned)')) {
            updates.name = `${litLightSource.name} (Fully Burned)`;
          }
        }
        updateItem(litLightSource.id, updates);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [character.inventory]);

  const [presetItems, setPresetItems] = useState<Partial<Item>[]>([]);
  const [showPresetList, setShowPresetList] = useState(false);

  const loadPresetItems = (type: 'weapons' | 'armors' | 'equipments') => {
    if (type === 'weapons') {
      setPresetItems(WEAPONS);
    } else if (type === 'armors') {
      setPresetItems(ARMORS);
    } else {
      setPresetItems(GEAR);
    }
    setShowPresetList(true);
  };

  const selectPresetItem = (item: Partial<Item>) => {
    setNewItem({
      ...item,
      id: Math.random().toString(36).substring(2, 9),
    });
    setShowPresetList(false);
  };

  const updateItem = (id: string, updates: Partial<Item>) => {
    const newInventory = character.inventory.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    onUpdateCharacter({ inventory: newInventory });
  };

  const removeItem = (id: string) => {
    const newInventory = character.inventory.filter(item => item.id !== id);
    onUpdateCharacter({ inventory: newInventory });
  };

  const addItem = () => {
    if (newItem.name) {
      const nameLower = newItem.name.toLowerCase();
      const isTorch = nameLower.includes('torch') || nameLower.includes('pira') || nameLower.includes('tocha');
      const isCandle = nameLower.includes('candle') || nameLower.includes('vela');
      const isLantern = nameLower.includes('lantern') || nameLower.includes('lampião');
      
      let lightSourceType: 'torch' | 'candle' | 'lantern' | undefined = undefined;
      let maxTime = 60;
      let range = '';
      
      if (isTorch) {
        lightSourceType = 'torch';
        maxTime = 60;
        range = '30 ft';
      } else if (isCandle) {
        lightSourceType = 'candle';
        maxTime = 120;
        range = '5 ft';
      } else if (isLantern) {
        lightSourceType = 'lantern';
        maxTime = 60;
        range = '60 ft';
      }

      const item: Item = {
        id: Math.random().toString(36).substring(2, 9),
        name: newItem.name,
        description: newItem.description || '',
        weight: newItem.weight || 1,
        quantity: newItem.quantity || 1,
        type: newItem.type || 'gear',
        equipped: newItem.equipped || false,
        weaponType: newItem.weaponType,
        attackBonus: newItem.attackBonus,
        damageDie: newItem.damageDie,
        acBonus: newItem.acBonus,
        isTorch: isTorch || isCandle || isLantern,
        lightSourceType,
        lightSourceMaxTime: maxTime,
        torchTimeRemaining: (isTorch || isCandle || isLantern) ? (newItem.torchTimeRemaining || maxTime) : undefined,
        cost: newItem.cost,
        range: range || newItem.range
      };
      onUpdateCharacter({ inventory: [...character.inventory, item] });
      setIsAddingItem(false);
      setNewItem({ name: '', description: '', weight: 1, quantity: 1, type: 'gear', equipped: false });
    }
  };

  const updateCurrency = (field: 'gold' | 'silver' | 'copper', value: number) => {
    onUpdateCharacter({ [field]: Math.max(0, value) });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto pt-8 px-6 pb-12"
    >
      {/* Inventory Header & Capacity Tracker */}
            <section className="mb-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="relative">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface tracking-tighter leading-none mb-2 italic font-bold">Inventory</h1>
        </div>
        <div className="tarot-card p-6 min-w-[320px] shadow-xl">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Capacity Status</span>
            <span className="font-headline text-4xl text-primary italic font-bold">
              {occupiedSlots} <span className="text-on-surface/40 text-sm not-italic font-normal">/ {totalSlots} Slots</span>
            </span>
          </div>
          <div className="h-2 w-full bg-surface-container-lowest overflow-hidden hand-drawn-border">
            <div 
              className={`h-full transition-all duration-700 ease-out ${occupiedSlots > totalSlots ? 'bg-error' : 'bg-gradient-to-r from-primary/60 to-primary'}`}
              style={{ width: `${Math.min((occupiedSlots / totalSlots) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <p className="text-[9px] text-tertiary italic opacity-60">Strength determines your carry limit.</p>
            {occupiedSlots > totalSlots && (
              <span className="text-[9px] text-error font-bold uppercase tracking-tighter animate-pulse">Encumbered!</span>
            )}
          </div>
        </div>
      </section>

      {/* Equipped Slots Section */}
      <section className="mb-12">
        <header className="mb-6 border-b border-outline-variant/20 pb-4 flex justify-between items-center">
          <h3 className="font-headline text-xl italic text-on-surface tracking-tight flex items-center gap-2">
            <Shield size={20} className="text-primary" />
            Equipped Items
          </h3>
          <div className="text-[10px] uppercase font-bold text-on-surface-variant/60">
            Current AC: <span className="text-primary text-sm">{character.ac}</span>
          </div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EquippedSlot 
            label="Main Hand" 
            item={character.inventory.find(i => i.equipped && i.slot === 'mainHand')} 
            onEquip={() => setSelectingSlot('mainHand')}
            onUnequip={(id) => updateItem(id, { equipped: false, slot: undefined, isLit: false })}
            onUpdate={(id, updates) => updateItem(id, updates)}
            onRoll={onRoll}
            character={character}
          />
          <EquippedSlot 
            label="Offhand" 
            item={character.inventory.find(i => i.equipped && i.slot === 'offHand')} 
            onEquip={() => setSelectingSlot('offHand')}
            onUnequip={(id) => updateItem(id, { equipped: false, slot: undefined, isLit: false })}
            onUpdate={(id, updates) => updateItem(id, updates)}
            onRoll={onRoll}
            character={character}
          />
          <EquippedSlot 
            label="Armor" 
            item={character.inventory.find(i => i.equipped && i.slot === 'armor')} 
            onEquip={() => setSelectingSlot('armor')}
            onUnequip={(id) => updateItem(id, { equipped: false, slot: undefined })}
            onUpdate={(id, updates) => updateItem(id, updates)}
            onRoll={onRoll}
            character={character}
          />
        </div>
      </section>

      {/* Slot Selection Modal */}
      <AnimatePresence>
        {selectingSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-high w-full max-w-md border border-primary/30 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                <h4 className="font-headline italic text-primary">Equip to {slots[selectingSlot].label}</h4>
                <button onClick={() => setSelectingSlot(null)} className="text-on-surface-variant hover:text-primary"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto p-2 divide-y divide-outline-variant/10">
                {character.inventory
                  .filter(i => !i.equipped && (slots[selectingSlot].allowedTypes.includes(i.type) || (selectingSlot !== 'armor' && i.isTorch)))
                  .map(item => (
                    <button 
                      key={item.id}
                      onClick={() => {
                        updateItem(item.id, { equipped: true, slot: selectingSlot });
                        setSelectingSlot(null);
                      }}
                      className="w-full text-left p-4 hover:bg-primary/5 transition-colors group flex justify-between items-center"
                    >
                      <div>
                        <div className="font-headline italic text-on-surface group-hover:text-primary transition-colors">{item.name}</div>
                        <div className="text-[10px] text-on-surface-variant/60 line-clamp-1">{item.description}</div>
                      </div>
                      <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1">Select</div>
                    </button>
                  ))}
                {character.inventory.filter(i => !i.equipped && (slots[selectingSlot].allowedTypes.includes(i.type) || (selectingSlot !== 'armor' && i.isTorch))).length === 0 && (
                  <div className="p-8 text-center italic text-on-surface-variant/60 text-sm">
                    No compatible items in your pack.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <div className="grid grid-cols-1 gap-8">
        {/* Unified Inventory Grid */}
        <div>
          <header className="mb-6 border-b border-outline-variant/20 pb-4 flex justify-between items-center">
            <h3 className="font-headline text-xl italic text-on-surface tracking-tight flex items-center gap-2">
              <Backpack size={20} className="text-primary" />
              Equipment
            </h3>
            <button 
              onClick={() => setIsAddingItem(true)}
              className="btn-primary"
            >
              <PlusCircle size={14} />
              Add Item
            </button>
          </header>

          <AnimatePresence>
            {isAddingItem && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-surface-container-high p-6 border border-primary/30 space-y-4 shadow-2xl">
                  <div className="flex justify-between items-center">
                    <h4 className="font-headline italic text-primary text-lg">New Provision</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => loadPresetItems('weapons')}
                        className="btn-secondary px-3 py-1"
                      >
                        <Database size={10} /> Weapons
                      </button>
                      <button 
                        onClick={() => loadPresetItems('armors')}
                        className="btn-secondary px-3 py-1"
                      >
                        <Database size={10} /> Armors
                      </button>
                      <button 
                        onClick={() => loadPresetItems('equipments')}
                        className="btn-secondary px-3 py-1"
                      >
                        <Database size={10} /> Gear
                      </button>
                      <button onClick={() => setIsAddingItem(false)} className="text-on-surface-variant hover:text-primary ml-2">
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {showPresetList && (
                    <div className="bg-surface-container-lowest border border-outline-variant/20 max-h-[300px] overflow-y-auto">
                      <div className="p-3 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low sticky top-0">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Select from Archives</span>
                        <button onClick={() => setShowPresetList(false)} className="text-[10px] uppercase font-bold text-primary hover:underline">Cancel</button>
                      </div>
                      <div className="divide-y divide-outline-variant/10">
                        {presetItems.map((item, idx) => (
                          <button 
                            key={idx}
                            onClick={() => selectPresetItem(item)}
                            className="w-full text-left p-4 hover:bg-primary/5 transition-colors group flex justify-between items-center"
                          >
                            <div>
                              <div className="font-headline italic text-on-surface group-hover:text-primary transition-colors">
                                {item.name} {item.cost ? <span className="text-xs text-on-surface-variant/60 not-italic ml-2">({item.cost})</span> : ''}
                              </div>
                              <div className="text-[10px] text-on-surface-variant/60 line-clamp-1">
                                {item.description}
                                {item.damageDie ? ` • Damage: ${item.damageDie}` : ''}
                                {item.acBonus ? ` • AC: ${item.acBonus}` : ''}
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1">{item.weight} Slots</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Item Name</label>
                      <input 
                        type="text"
                        value={newItem.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const nameLower = name.toLowerCase();
                          const isLight = nameLower.includes('torch') || nameLower.includes('pira') || nameLower.includes('tocha') || 
                                          nameLower.includes('candle') || nameLower.includes('vela') || 
                                          nameLower.includes('lantern') || nameLower.includes('lampião');
                          setNewItem({ ...newItem, name, isTorch: isLight });
                        }}
                        placeholder="e.g. Grappling Hook"
                        className="w-full bg-surface-container-highest text-sm p-3 focus:outline-none border-b border-transparent focus:border-primary font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Type</label>
                      <select 
                        value={newItem.type}
                        onChange={(e) => setNewItem({ ...newItem, type: e.target.value as any })}
                        className="w-full bg-surface-container-highest text-sm p-3 focus:outline-none border-b border-transparent focus:border-primary"
                      >
                        <option value="gear">Gear</option>
                        <option value="weapon">Weapon</option>
                        <option value="armor">Armor</option>
                        <option value="shield">Shield</option>
                        <option value="treasure">Treasure</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Slots</label>
                        <input 
                          type="number"
                          value={newItem.weight}
                          onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 1 })}
                          className="w-full bg-surface-container-highest text-sm p-3 focus:outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Qty</label>
                        <input 
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                          className="w-full bg-surface-container-highest text-sm p-3 focus:outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Cost</label>
                        <input 
                          type="text"
                          value={newItem.cost || ''}
                          onChange={(e) => setNewItem({ ...newItem, cost: e.target.value })}
                          className="w-full bg-surface-container-highest text-sm p-3 focus:outline-none border-b border-transparent focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Combat/AC/Light Fields */}
                  {(newItem.type === 'weapon' || newItem.type === 'armor' || newItem.type === 'shield' || newItem.isTorch) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 border border-primary/10">
                      {newItem.type === 'weapon' && (
                        <>
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Weapon Type</label>
                            <select 
                              value={newItem.weaponType || 'melee'}
                              onChange={(e) => setNewItem({ ...newItem, weaponType: e.target.value as any })}
                              className="w-full bg-surface-container-highest text-sm p-2 focus:outline-none border-b border-transparent focus:border-primary"
                            >
                              <option value="melee">Melee</option>
                              <option value="ranged">Ranged</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Attack Bonus</label>
                            <input 
                              type="number"
                              value={newItem.attackBonus || 0}
                              onChange={(e) => setNewItem({ ...newItem, attackBonus: parseInt(e.target.value) || 0 })}
                              className="w-full bg-surface-container-highest text-sm p-2 focus:outline-none border-b border-transparent focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Damage Die</label>
                            <input 
                              type="text"
                              value={newItem.damageDie || ''}
                              onChange={(e) => setNewItem({ ...newItem, damageDie: e.target.value })}
                              placeholder="e.g. 1d8"
                              className="w-full bg-surface-container-highest text-sm p-2 focus:outline-none border-b border-transparent focus:border-primary"
                            />
                          </div>
                        </>
                      )}
                      {(newItem.type === 'armor' || newItem.type === 'shield') && (
                        <div>
                          <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">AC Bonus / Base AC</label>
                          <input 
                            type="number"
                            value={newItem.acBonus || 0}
                            onChange={(e) => setNewItem({ ...newItem, acBonus: parseInt(e.target.value) || 0 })}
                            className="w-full bg-surface-container-highest text-sm p-2 focus:outline-none border-b border-transparent focus:border-primary"
                          />
                        </div>
                      )}
                      {newItem.isTorch && (
                        <>
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Light Type</label>
                            <select 
                              value={newItem.lightSourceType || 'torch'}
                              onChange={(e) => setNewItem({ ...newItem, lightSourceType: e.target.value as any })}
                              className="w-full bg-surface-container-highest text-sm p-2 focus:outline-none border-b border-transparent focus:border-primary"
                            >
                              <option value="torch">Torch</option>
                              <option value="candle">Candle</option>
                              <option value="lantern">Lantern</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Max Time (min)</label>
                            <input 
                              type="number"
                              value={newItem.torchTimeRemaining || 60}
                              onChange={(e) => setNewItem({ ...newItem, torchTimeRemaining: parseInt(e.target.value) || 60 })}
                              className="w-full bg-surface-container-highest text-sm p-2 focus:outline-none border-b border-transparent focus:border-primary"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-bold">Description</label>
                    <textarea 
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Special properties or uses..."
                      rows={2}
                      className="w-full bg-surface-container-highest text-sm p-3 focus:outline-none border-b border-transparent focus:border-primary resize-none italic"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={addItem}
                      disabled={!newItem.name}
                      className="btn-primary px-8"
                    >
                      Add to Pack
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {character.inventory.map((item) => (
              <EditableItemCard 
                key={item.id} 
                item={item} 
                onUpdate={(updates) => updateItem(item.id, updates)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
            
            {/* Empty Slots Visualized as Cards */}
            {Array.from({ length: remainingSlots }).map((_, i) => (
              <div 
                key={`empty-${i}`} 
                className="tarot-card p-6 flex flex-col items-center justify-center min-h-[140px] group hover:bg-surface-container-low transition-colors cursor-pointer border-dashed"
                onClick={() => setIsAddingItem(true)}
              >
                <div className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center mb-2 group-hover:border-primary/50 transition-colors hand-drawn-border">
                  <PlusCircle size={20} className="text-on-surface-variant/40 group-hover:text-primary/60 transition-colors" />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-bold group-hover:text-on-surface-variant/80 transition-colors">Empty Slot</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Treasure Section */}
      <section className="mt-16 tarot-card p-10 relative overflow-hidden shadow-inner">
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
          <Coins size={240} />
        </div>
        <div className="relative z-10">
          <h2 className="font-headline text-4xl mb-8 text-on-surface italic font-bold tracking-tight">Treasure Vault</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <EditableTreasureItem 
              label="Gold Pieces" 
              value={character.gold} 
              unit="GP" 
              color="text-primary"
              onChange={(val) => updateCurrency('gold', val)}
            />
            <EditableTreasureItem 
              label="Silver Pieces" 
              value={character.silver} 
              unit="SP" 
              color="text-on-surface"
              onChange={(val) => updateCurrency('silver', val)}
            />
            <EditableTreasureItem 
              label="Copper Pieces" 
              value={character.copper} 
              unit="CP" 
              color="text-tertiary"
              onChange={(val) => updateCurrency('copper', val)}
            />
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function EquippedSlot({ label, item, onEquip, onUnequip, onUpdate, onRoll, character }: { label: string, item?: Item, onEquip: () => void, onUnequip: (id: string) => void, onUpdate: (id: string, updates: Partial<Item>) => void, onRoll: (result: RollResult) => void, character: Character }) {
  const handleRollAttack = () => {
    if (item && item.type === 'weapon') {
      const weaponType = item.weaponType || 'melee';
      const action = character.combatActions[weaponType];
      const attr = character.attributes.find(a => a.name === action.attribute);
      const modifier = (attr?.modifier || 0) + action.bonus + (item.attackBonus || 0);
      const result = rollDie('d20', `${item.name} Attack`, `${action.attribute}${modifier >= 0 ? '+' : ''}${modifier}`, modifier);
      onRoll(result);
    }
  };

  const handleRollDamage = () => {
    if (item && item.damageDie) {
      const result = rollDie(item.damageDie, `${item.name} Damage`, 'Weapon Roll');
      onRoll(result);
    }
  };

  const toggleTorch = () => {
    if (item && item.isTorch) {
      onUpdate(item.id, { isLit: !item.isLit });
    }
  };

  return (
    <div className="tarot-card p-6 flex flex-col min-h-[160px] relative group shadow-sm hover:shadow-md transition-shadow">
      <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/60 mb-4">{label}</span>
      
      {item ? (
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 flex items-center justify-center bg-surface-container-highest border border-outline-variant/10 ${item.isLit ? 'text-primary' : 'text-on-surface-variant'}`}>
                {item.isTorch ? <Flame size={16} /> : item.type === 'weapon' ? <Swords size={16} /> : item.type === 'armor' ? <Shield size={16} /> : <Backpack size={16} />}
              </div>
              <h4 className="font-headline text-lg italic font-bold text-on-surface">{item.name}</h4>
            </div>
            <button 
              onClick={() => onUnequip(item.id)}
              className="text-[9px] uppercase tracking-tighter font-bold text-error hover:underline"
            >
              Unequip
            </button>
          </div>
          
          <div className="flex-1">
            {item.type === 'weapon' && (
              <div className="flex gap-2 mt-2">
                <button 
                  onClick={handleRollAttack}
                  className="btn-primary flex-1 py-1"
                >
                  Attack
                </button>
                <button 
                  onClick={handleRollDamage}
                  className="btn-secondary flex-1 py-1"
                >
                  Damage
                </button>
              </div>
            )}
            {item.isTorch && (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleTorch}
                    className={`btn-toggle px-3 py-1 flex items-center gap-1 ${item.isLit ? 'active' : ''}`}
                  >
                    <Flame size={12} className={item.isLit ? 'animate-pulse' : ''} />
                    {item.isLit ? 'Unlit' : 'Lit'}
                  </button>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    {item.torchTimeRemaining} min
                  </span>
                </div>
                <div className="flex gap-2 text-[8px] uppercase tracking-widest font-bold text-on-surface-variant/60">
                  <span>Type: {item.lightSourceType || 'Torch'}</span>
                  {item.range && <span>Range: {item.range}</span>}
                </div>
              </div>
            )}
            {(item.type === 'armor' || item.type === 'shield') && item.acBonus && (
              <div className="mt-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                AC Bonus: +{item.acBonus}
              </div>
            )}
          </div>
        </div>
      ) : (
        <button 
          onClick={onEquip}
          className="flex-1 flex flex-col items-center justify-center border border-dashed border-outline-variant/40 hover:bg-primary/5 transition-colors group/btn hand-drawn-border"
        >
          <PlusCircle size={24} className="text-on-surface-variant/40 mb-2 group-hover/btn:text-primary/60 transition-colors" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-on-surface-variant/60 group-hover/btn:text-primary/80 transition-colors">Empty Slot</span>
        </button>
      )}
    </div>
  );
}

function EditableItemCard({ item, onUpdate, onRemove }: { item: Item, onUpdate: (updates: Partial<Item>) => void, onRemove: () => void, key?: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(item);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  const Icon = item.isTorch ? Flame : item.type === 'weapon' ? Swords : item.type === 'armor' ? Shield : Backpack;

  if (isEditing) {
    return (
      <div className="tarot-card p-5 shadow-2xl space-y-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] uppercase tracking-widest font-bold text-primary">Editing Item</span>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="text-on-surface-variant hover:text-error"><X size={16} /></button>
            <button onClick={handleSave} className="text-primary hover:text-primary/80"><Save size={16} /></button>
          </div>
        </div>
        <input 
          type="text"
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className="w-full bg-surface-container-low p-2 text-sm font-headline italic focus:outline-none border-b border-primary"
        />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[8px] uppercase tracking-tighter opacity-60">Slots</label>
            <input 
              type="number"
              value={editData.weight}
              onChange={(e) => setEditData({ ...editData, weight: parseInt(e.target.value) || 1 })}
              className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-tighter opacity-60">Qty</label>
            <input 
              type="number"
              value={editData.quantity}
              onChange={(e) => setEditData({ ...editData, quantity: parseInt(e.target.value) || 1 })}
              className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[8px] uppercase tracking-tighter opacity-60">Range</label>
            <input 
              type="text"
              value={editData.range || ''}
              onChange={(e) => setEditData({ ...editData, range: e.target.value })}
              className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
            />
          </div>
        </div>
        {editData.type === 'weapon' && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[8px] uppercase tracking-tighter opacity-60">Type</label>
              <select 
                value={editData.weaponType || 'melee'}
                onChange={(e) => setEditData({ ...editData, weaponType: e.target.value as any })}
                className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
              >
                <option value="melee">Melee</option>
                <option value="ranged">Ranged</option>
              </select>
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-tighter opacity-60">Atk Bonus</label>
              <input 
                type="number"
                value={editData.attackBonus || 0}
                onChange={(e) => setEditData({ ...editData, attackBonus: parseInt(e.target.value) || 0 })}
                className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-tighter opacity-60">Damage</label>
              <input 
                type="text"
                value={editData.damageDie || ''}
                onChange={(e) => setEditData({ ...editData, damageDie: e.target.value })}
                className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        )}
        {(editData.type === 'armor' || editData.type === 'shield') && (
          <div>
            <label className="block text-[8px] uppercase tracking-tighter opacity-60">AC Bonus</label>
            <input 
              type="number"
              value={editData.acBonus || 0}
              onChange={(e) => setEditData({ ...editData, acBonus: parseInt(e.target.value) || 0 })}
              className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
            />
          </div>
        )}
        {editData.isTorch && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[8px] uppercase tracking-tighter opacity-60">Light Type</label>
              <select 
                value={editData.lightSourceType || 'torch'}
                onChange={(e) => setEditData({ ...editData, lightSourceType: e.target.value as any })}
                className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
              >
                <option value="torch">Torch</option>
                <option value="candle">Candle</option>
                <option value="lantern">Lantern</option>
              </select>
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-tighter opacity-60">Time Left</label>
              <input 
                type="number"
                value={editData.torchTimeRemaining || 0}
                onChange={(e) => setEditData({ ...editData, torchTimeRemaining: parseInt(e.target.value) || 0 })}
                className="w-full bg-surface-container-low p-2 text-xs focus:outline-none"
              />
            </div>
          </div>
        )}
        <textarea 
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
          rows={2}
          className="w-full bg-surface-container-low p-2 text-xs focus:outline-none resize-none italic"
        />
      </div>
    );
  }

  return (
    <div className={`tarot-card p-6 transition-all group relative ${item.equipped ? 'bg-primary/5 border-primary' : ''}`}>
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="p-1 text-on-surface-variant hover:text-primary transition-colors">
          <Grid size={14} />
        </button>
        <button onClick={onRemove} className="p-1 text-on-surface-variant hover:text-error transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-start gap-4 mb-4">
        <div className={`w-10 h-10 flex items-center justify-center bg-surface-container-highest border border-outline-variant/10 ${item.equipped ? 'text-primary' : 'text-on-surface-variant'}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h4 className="font-headline text-xl text-on-surface leading-none italic font-bold group-hover:text-primary transition-colors">{item.name}</h4>
            <span className="text-[9px] font-bold uppercase tracking-widest bg-surface-container-highest px-2 py-0.5 text-on-surface-variant">
              {item.weight} Slot{item.weight !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-3 mt-1">
            <span className="text-[9px] uppercase tracking-widest text-primary font-bold">
              {item.type === 'weapon' ? `${item.weaponType || 'melee'} weapon` : item.type}
            </span>
            {item.quantity > 1 && <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Qty: {item.quantity}</span>}
            {item.cost && <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Cost: {item.cost}</span>}
            {item.equipped && <span className="text-[9px] uppercase tracking-widest text-secondary font-bold">Equipped</span>}
          </div>
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-on-surface-variant/80 leading-relaxed italic border-t border-outline-variant/10 pt-3">
          {item.description}
        </p>
      )}
    </div>
  );
}

function EditableTreasureItem({ label, value, unit, color, onChange }: { label: string, value: number, unit: string, color: string, onChange: (val: number) => void }) {
  return (
    <div className="group">
      <p className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant mb-2 font-bold">{label}</p>
      <div className="flex items-baseline gap-3">
        <input 
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={`bg-transparent font-headline text-5xl font-bold italic w-32 focus:outline-none border-b border-transparent focus:border-primary/30 ${color} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        />
        <span className="text-sm font-label text-tertiary uppercase tracking-widest opacity-60">{unit}</span>
      </div>
    </div>
  );
}

