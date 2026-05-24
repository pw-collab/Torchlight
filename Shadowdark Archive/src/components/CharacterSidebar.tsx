import React, { useState, useRef } from 'react';
import { Eye, Star, Activity, Book, Upload, Download, Swords, Zap, Flame, User } from 'lucide-react';
import { Character, RollResult, Item } from '../types';
import { rollDie } from '../lib/dice';

interface CharacterSidebarProps {
  character: Character;
  onUpdateCharacter: (updates: Partial<Character>) => void;
  onImport?: (content: string, isJson?: boolean) => void;
  onRoll: (result: RollResult) => void;
  onCreateNew?: () => void;
}

export default function CharacterSidebar({ character, onUpdateCharacter, onImport, onRoll, onCreateNew }: CharacterSidebarProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPortrait, setIsEditingPortrait] = useState(false);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const litItem = character.inventory.find(i => i.isLit && i.equipped);
  const lightPercent = litItem && litItem.torchTimeRemaining !== undefined && litItem.lightSourceMaxTime 
    ? (litItem.torchTimeRemaining / litItem.lightSourceMaxTime) * 100 
    : 0;

  const updateHp = (newHp: number) => {
    onUpdateCharacter({ hp: Math.max(0, Math.min(newHp, character.maxHp)) });
  };

  const updateMaxHp = (newMax: number) => {
    const updates: Partial<Character> = { maxHp: Math.max(1, newMax) };
    if (character.hp > Math.max(1, newMax)) {
      updates.hp = Math.max(1, newMax);
    }
    onUpdateCharacter(updates);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      const isJson = file.name.endsWith('.json');
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImport(content, isJson);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveJson = () => {
    if (!character) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(character, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${character.name.replace(/\s+/g, '_').toLowerCase()}_character.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const hpPercentage = Math.min(100, Math.max(0, (character.hp / character.maxHp) * 100));

  const equippedWeapons = character.inventory.filter(i => i.equipped && i.type === 'weapon');

  const handleQuickRoll = (die: string) => {
    onRoll(rollDie(die, 'Quick Roll', die.toUpperCase()));
  };

  const handleWeaponAttack = (item: Item) => {
    const weaponType = item.weaponType || 'melee';
    const action = character.combatActions[weaponType];
    const attr = character.attributes.find(a => a.name === action.attribute);
    const modifier = (attr?.modifier || 0) + action.bonus + (item.attackBonus || 0);
    onRoll(rollDie('d20', `${item.name} Attack`, `${action.attribute}${modifier >= 0 ? '+' : ''}${modifier}`, modifier));
  };

  const handleWeaponDamage = (item: Item) => {
    if (item.damageDie) {
      onRoll(rollDie(item.damageDie, `${item.name} Damage`, 'Weapon Roll'));
    }
  };

  return (
    <aside className="flex flex-col lg:h-screen lg:fixed lg:left-0 lg:top-0 w-full lg:w-80 z-40 overflow-y-auto custom-scrollbar lg:border-r lg:border-outline-variant/20 shadow-2xl lg:shadow-none bg-surface">
      <div className="flex flex-col min-h-full relative p-6 lg:pb-6 pb-24 gap-6">
        <div className="absolute inset-0 pointer-events-none"></div>
        
        <header className="mb-2 flex flex-col items-left relative z-10">
        <div 
              className={`w-full h-64 flex-shrink-0 bg-surface-container hand-drawn-border relative cursor-pointer group/portrait ${!isStatsVisible ? 'p-1' : 'overflow-hidden'}`}
              style={!isStatsVisible ? { background: `conic-gradient(var(--color-secondary) ${hpPercentage}%, var(--color-surface-container-highest) 0)` } : {}}
              onClick={() => !isEditingPortrait && setIsEditingPortrait(true)}
            >
              <div className={`w-full h-full relative ${!isStatsVisible ? 'bg-surface-container-low hand-drawn-border overflow-hidden' : ''}`}>
                {isEditingPortrait ? (
                  <input
                    autoFocus
                    type="text"
                    placeholder="Image URL..."
                    value={character.portraitUrl || ''}
                    onChange={(e) => onUpdateCharacter({ portraitUrl: e.target.value })}
                    onBlur={() => setIsEditingPortrait(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingPortrait(false)}
                    className="w-full h-full bg-surface-container-low text-xs text-center text-primary focus:outline-none p-2"
                  />
                ) : character.portraitUrl ? (
                  <img src={character.portraitUrl} alt={character.name} className="w-full h-full object-cover group-hover/portrait:opacity-75 transition-opacity" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-50 group-hover/portrait:opacity-100 transition-opacity">
                    <Eye size={32} />
                  </div>
                )}
              </div>
            </div>
          <div className="flex flex-row items-start justify-start gap-4">
            

            

            <div className="flex flex-col flex-grow">
              {isEditingName ? (
                <input
                  autoFocus
                  type="text"
                  value={character.name}
                  onChange={(e) => onUpdateCharacter({ name: e.target.value })}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  className="font-headline text-3xl text-left text-primary tracking-widest bg-transparent border-b border-primary/50 focus:outline-none w-full"
                />
              ) : (
                <h2 
                  onClick={() => setIsEditingName(true)}
                  className="font-headline text-3xl text-left text-primary cursor-pointer hover:text-on-surface transition-colors italic font-bold"
                >
                  {character.name}
                </h2>
              )}
              <p className="text-tertiary-fixed-dim font-label text-[10px] mt-2 tracking-wide text-left">
                {character.ancestry} {character.class}{character.archetype ? ` (${character.archetype})` : ''} • {character.alignment}
              </p>
              <div className="flex flex-row gap-2 mt-3">
                <button 
                  onClick={() => setIsStatsVisible(!isStatsVisible)} 
                  className={`btn-toggle p-1.5 ${isStatsVisible ? 'active' : ''}`}
                  title="Toggle Stats"
                >
                  <Activity size={14} />
                </button>
                {onImport && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".html,.json" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary p-1.5 ml-auto"
                      title="Load Sheet"
                    >
                      <Upload size={14} />
                    </button>
                    <button 
                      onClick={handleSaveJson}
                      className="btn-secondary p-1.5"
                      title="Save Sheet"
                    >
                      <Download size={14} />
                    </button>
                    {onCreateNew && (
                      <button 
                        onClick={onCreateNew}
                        className="btn-primary p-1.5"
                        title="New Character"
                      >
                        <User size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="ornate-divider w-full mt-4">
            {/* Light Source Indicator */}
            {litItem && (
              <div className="flex flex-col items-center justify-center gap-1 mt-4 overflow-visible">
                <div className="relative w-12 h-16 flex items-center justify-center group/light overflow-visible">
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${
                    litItem.lightSourceType === 'lantern' ? 'bg-primary/40 scale-150' : 
                    litItem.lightSourceType === 'candle' ? 'bg-secondary/30 scale-75' : 'bg-primary/30'
                  }`} />
                  
                  {/* Silhouette Icon (Background) */}
                  <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant/20">
                    <Flame size={48} strokeWidth={1} />
                  </div>

                  {/* Filled Icon (Foreground) */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center text-primary overflow-hidden transition-all duration-1000"
                    style={{ 
                      clipPath: `inset(${100 - lightPercent}% 0 0 0)`,
                      filter: 'drop-shadow(0 0 8px currentColor)'
                    }}
                  >
                    <Flame size={48} fill="currentColor" strokeWidth={1} />
                  </div>

                  {/* Timer Number */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-on-surface drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
                      {litItem.torchTimeRemaining}
                    </span>
                  </div>
                </div>
                <span className="text-[8px] uppercase tracking-widest font-bold text-on-surface-variant/60">
                  {litItem.lightSourceType || 'Torch'}
                </span>
              </div>
            )}
          </div>
        </header>

        {isStatsVisible && (
          <div className="tarot-card p-6 relative z-10">
            <div className="space-y-6 relative z-10">
              <div className="group">
                <div className="flex justify-between items-end mb-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-label">HP</label>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateHp(character.hp - 1)}
                      className="w-5 h-5 flex items-center justify-center hand-drawn-border text-on-surface hover:bg-primary hover:text-background transition-colors text-xs"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={character.hp}
                      onChange={(e) => updateHp(parseInt(e.target.value) || 0)}
                      className="w-8 bg-transparent text-center text-sm font-body text-primary focus:outline-none focus:border-b border-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-xs opacity-40">/</span>
                    <input 
                      type="number" 
                      value={character.maxHp}
                      onChange={(e) => updateMaxHp(parseInt(e.target.value) || 1)}
                      className="w-8 bg-transparent text-center text-sm font-body text-on-surface-variant focus:outline-none focus:border-b border-outline/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button 
                      onClick={() => updateHp(character.hp + 1)}
                      className="w-5 h-5 flex items-center justify-center hand-drawn-border text-on-surface hover:bg-primary hover:text-background transition-colors text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="h-4 bg-surface-container-lowest overflow-hidden hand-drawn-border p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-secondary-container to-secondary shadow-[0_0_12px_rgba(139,0,0,0.4)] transition-all duration-500"
                    style={{ width: `${hpPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="hand-drawn-border p-4 text-center bg-surface-container-low/50">
                  <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">Level</span>
                  <span className="text-3xl font-headline font-bold text-on-surface">{character.level}</span>
                </div>
                <div className="hand-drawn-border p-4 text-center bg-surface-container-low/50">
                  <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">Armor Class</span>
                  <span className="text-3xl font-headline font-bold text-primary">{character.ac}</span>
                </div>
                <div className="hand-drawn-border p-4 text-center bg-surface-container-low/50">
                  <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">Melee</span>
                  <input 
                    type="number" 
                    value={character.combatActions.melee.bonus}
                    onChange={(e) => onUpdateCharacter({
                      combatActions: {
                        ...character.combatActions,
                        melee: { ...character.combatActions.melee, bonus: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="w-full bg-transparent text-center text-3xl font-headline font-bold text-on-surface focus:outline-none focus:border-b border-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="hand-drawn-border p-4 text-center bg-surface-container-low/50">
                  <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">Ranged</span>
                  <input 
                    type="number" 
                    value={character.combatActions.ranged.bonus}
                    onChange={(e) => onUpdateCharacter({
                      combatActions: {
                        ...character.combatActions,
                        ranged: { ...character.combatActions.ranged, bonus: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="w-full bg-transparent text-center text-3xl font-headline font-bold text-on-surface focus:outline-none focus:border-b border-primary/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dice & Quick Actions */}
        <div className="tarot-card p-6 relative z-10 mt-auto">
          <div className="mb-6">
            <button 
              onClick={() => onUpdateCharacter({ luck: !character.luck })}
              className={`btn-toggle w-full ${character.luck ? 'active' : ''}`}
            >
              <Star size={16} className={character.luck ? 'fill-primary' : ''} />
              <span className="text-xs uppercase tracking-widest font-label font-bold">
                Luck Token
              </span>
            </button>
          </div>

          <div className="ornate-divider mb-4">
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map((die) => (
              <button 
                key={die}
                onClick={() => handleQuickRoll(die)}
                className={`aspect-square tarot-card flex flex-col items-center justify-center transition-all active:scale-95 group ${
                  die === 'd20' ? 'border-primary/50 text-primary' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                <span className="text-xs font-label uppercase tracking-widest relative z-10 group-hover:scale-110 transition-transform">{die}</span>
              </button>
            ))}
          </div>

          {equippedWeapons.length > 0 && (
            <>
              <div className="ornate-divider mb-3">
                <span className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Equipped Weapons</span>
              </div>
              <div className="space-y-3">
                {equippedWeapons.map(weapon => (
                  <div key={weapon.id} className="tarot-card p-4">
                    <p className="text-sm font-headline text-on-surface mb-3 truncate relative z-10 text-center">{weapon.name}</p>
                    <div className="flex gap-2 relative z-10">
                      <button 
                        onClick={() => handleWeaponAttack(weapon)}
                        className="btn-primary flex-1 py-1.5"
                      >
                        <Swords size={12} /> Atk
                      </button>
                      {weapon.damageDie && (
                        <button 
                          onClick={() => handleWeaponDamage(weapon)}
                          className="btn-secondary flex-1 py-1.5 border-secondary text-secondary hover:bg-secondary hover:text-background"
                        >
                          <Zap size={12} /> Dmg
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </aside>
  );
}
