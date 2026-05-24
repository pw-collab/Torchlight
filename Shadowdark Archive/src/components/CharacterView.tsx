import React, { useState, useEffect } from 'react';
import { Eye, Plus, X, Star, Activity, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, RollResult, Talent } from '../types';
import { rollDie, rollFormula } from '../lib/dice';
import DescriptionWithRolls from './DescriptionWithRolls';
import CharacterDescription from './CharacterDescription';

interface CharacterViewProps {
  character: Character;
  onRoll: (result: RollResult) => void;
  onUpdateCharacter?: (updates: Partial<Character>) => void;
}

export default function CharacterView({ character, onRoll, onUpdateCharacter }: CharacterViewProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'description'>('stats');
  const [isAddingTalent, setIsAddingTalent] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<string | null>(null);
  const [activeAttributeMenu, setActiveAttributeMenu] = useState<string | null>(null);
  const [customModifier, setCustomModifier] = useState<string>('');

  const [newTalent, setNewTalent] = useState<Partial<Talent>>({
    name: '',
    type: 'general',
    description: ''
  });

  const handleAdvancedRoll = (attrName: string, baseModifier: number, type: 'normal' | 'advantage' | 'disadvantage' | 'melee' | 'ranged' | 'custom') => {
    let finalModifier = baseModifier;
    let advantage = false;
    let disadvantage = false;
    let label = `${attrName} Check`;
    let subLabel = 'Attribute Roll';

    if (type === 'advantage') {
      advantage = true;
    } else if (type === 'disadvantage') {
      disadvantage = true;
    } else if (type === 'melee') {
      finalModifier += character.combatActions.melee.bonus;
      label = 'Melee Attack';
      subLabel = `${attrName} + Melee Bonus`;
    } else if (type === 'ranged') {
      finalModifier += character.combatActions.ranged.bonus;
      label = 'Ranged Attack';
      subLabel = `${attrName} + Ranged Bonus`;
    } else if (type === 'custom' && customModifier) {
      const isNegative = customModifier.startsWith('-');
      const cleanCustom = customModifier.replace(/^[+-]/, '').trim();
      
      if (cleanCustom.includes('d')) {
        const customRoll = rollFormula(cleanCustom, 'Custom', 'Custom');
        const customTotal = isNegative ? -customRoll.total : customRoll.total;
        finalModifier += customTotal;
        subLabel = `${attrName} ${isNegative ? '-' : '+'} ${cleanCustom} (${customTotal})`;
      } else {
        const customNum = parseInt(customModifier) || 0;
        finalModifier += customNum;
        subLabel = `${attrName} ${customNum >= 0 ? '+' : ''}${customNum}`;
      }
    }

    const result = rollDie('d20', label, subLabel, finalModifier, advantage, disadvantage);
    onRoll(result);
    setActiveAttributeMenu(null);
    setCustomModifier('');
  };

  const handleAddTalent = () => {
    if (onUpdateCharacter && newTalent.name && newTalent.description) {
      const talent: Talent = {
        id: Math.random().toString(36).substring(2, 9),
        name: newTalent.name,
        type: (newTalent.type as any) || 'general',
        description: newTalent.description
      };
      onUpdateCharacter({
        talents: [...character.talents, talent]
      });
      setIsAddingTalent(false);
      setNewTalent({ name: '', type: 'general', description: '' });
    }
  };

  const removeTalent = (id: string) => {
    if (onUpdateCharacter) {
      onUpdateCharacter({
        talents: character.talents.filter(t => t.id !== id)
      });
    }
  };

  const calculateModifier = (value: number) => {
    return Math.floor((value - 10) / 2);
  };

  const updateAttribute = (name: string, value: number) => {
    if (onUpdateCharacter) {
      const modifier = calculateModifier(value);
      const newAttributes = character.attributes.map(attr => 
        attr.name === name ? { ...attr, value, modifier } : attr
      );
      onUpdateCharacter({ attributes: newAttributes });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-[1600px] mx-auto p-6 lg:p-10 flex flex-col gap-8"
    >
      <div className="flex justify-center mb-4">
        <div className="flex bg-surface-container-low/50 hand-drawn-border p-1">
          <button
            onClick={() => setActiveTab('stats')}
            className={`btn-toggle px-6 py-2 ${activeTab === 'stats' ? 'active' : ''}`}
          >
            Stats
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`btn-toggle px-6 py-2 ${activeTab === 'description' ? 'active' : ''}`}
          >
            Description
          </button>
        </div>
      </div>

      {activeTab === 'stats' ? (
        <section className="w-full">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {character.attributes.map((attr) => (
            <motion.div 
              key={attr.name}
              animate={{ scale: 1, rotate: 0, y: 0 }}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={activeAttributeMenu === attr.name ? {} : { scale: 0.9, rotate: [0, -5, 5, 0], y: -10 }}
              className="tarot-card p-3 text-center transition-shadow duration-300 hover:shadow-xl group relative"
            >
              <button 
                onClick={() => setActiveAttributeMenu(activeAttributeMenu === attr.name ? null : attr.name)}
                className="absolute inset-0 z-0 w-full h-full cursor-pointer"
              />
              
              <AnimatePresence>
                {activeAttributeMenu === attr.name && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-surface-container border border-outline-variant rounded shadow-xl p-2 flex flex-col gap-1"
                  >
                    <button onClick={() => handleAdvancedRoll(attr.name, attr.modifier, 'normal')} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors">Normal Roll</button>
                    <button onClick={() => handleAdvancedRoll(attr.name, attr.modifier, 'advantage')} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors text-primary">Advantage</button>
                    <button onClick={() => handleAdvancedRoll(attr.name, attr.modifier, 'disadvantage')} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors text-error">Disadvantage</button>
                    {(attr.name === 'Strength' || attr.name === 'Dexterity') && (
                      <button onClick={() => handleAdvancedRoll(attr.name, attr.modifier, 'melee')} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors">Melee Attack</button>
                    )}
                    {attr.name === 'Dexterity' && (
                      <button onClick={() => handleAdvancedRoll(attr.name, attr.modifier, 'ranged')} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors">Ranged Attack</button>
                    )}
                    <div className="flex items-center gap-1 mt-1 border-t border-outline-variant pt-1">
                      <input 
                        type="text" 
                        placeholder="-1d4" 
                        value={customModifier}
                        onChange={(e) => setCustomModifier(e.target.value)}
                        className="w-full bg-surface-container-low text-xs p-1 rounded focus:outline-none border border-outline-variant/50"
                      />
                      <button onClick={() => handleAdvancedRoll(attr.name, attr.modifier, 'custom')} className="text-xs bg-primary text-on-primary px-2 py-1 rounded hover:bg-primary/90 transition-colors">Roll</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <span className="block text-[10px] uppercase tracking-widest mt-2 mb-2 font-label transition-colors text-on-surface-variant group-hover:text-primary relative z-10 pointer-events-none">
                {attr.name}
              </span>
              <div className="flex flex-col items-center justify-center relative z-10">
                <div className="px-1 py-2">
                  <span className={`text-5xl text-center font-headline ${
                    attr.modifier === 0 ? 'text-on-surface-variant' : 
                    attr.modifier > 0 ? 'text-primary' : 'text-error'
                  }`}>
                    {attr.modifier > 0 ? `+${attr.modifier}` : attr.modifier === 0 ? '0' : attr.modifier}
                  </span>
                </div>
                </div>

                {editingAttribute === attr.name ? (
                  <input
                    autoFocus
                    type="number"
                    value={attr.value}
                    onChange={(e) => updateAttribute(attr.name, parseInt(e.target.value) || 0)}
                    onBlur={() => setEditingAttribute(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingAttribute(null)}
                    className="text-xl font-headline text-on-surface bg-transparent border-b border-primary/50 focus:outline-none w-20 text-center mb-2"
                  />
                ) : (
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAttribute(attr.name);
                    }}
                    className="mt-4 px-4 py-1 bg-surface-container-low/80 mt-2 text-xl font-headline text-on-surface cursor-pointer hover:text-primary transition-colors mb-2"
                  >
                    {attr.value}
                  </span>
                )}
              
            </motion.div>
          ))}
        </div>
        {/* Talents & Traits Section */}
        <div className="mt-10">
          <div className="ornate-divider mb-6">
            <span className="font-label text-sm uppercase tracking-widest text-on-surface-variant px-4">Talents & Traits</span>
          </div>
          <header className="mb-6 flex justify-end">
            <button 
              onClick={() => setIsAddingTalent(true)}
              className="btn-primary"
            >
              <Plus size={14} />
              Add Talent
            </button>
          </header>

          <AnimatePresence>
            {isAddingTalent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="tarot-card p-6 space-y-5">
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <h4 className="font-headline text-xl text-primary">New Talent</h4>
                    <button onClick={() => setIsAddingTalent(false)} className="text-on-surface-variant hover:text-primary">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-label">Name</label>
                      <input 
                        type="text"
                        value={newTalent.name}
                        onChange={(e) => setNewTalent({ ...newTalent, name: e.target.value })}
                        placeholder="e.g. Expert Climber"
                        className="w-full bg-surface-container-low/50 text-sm p-3 focus:outline-none hand-drawn-border font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-label">Type</label>
                      <select 
                        value={newTalent.type}
                        onChange={(e) => setNewTalent({ ...newTalent, type: e.target.value as any })}
                        className="w-full bg-surface-container-low/50 text-sm p-3 focus:outline-none hand-drawn-border font-body"
                      >
                        <option value="ancestry">Ancestry</option>
                        <option value="class">Class</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-label">Description</label>
                    <textarea 
                      value={newTalent.description}
                      onChange={(e) => setNewTalent({ ...newTalent, description: e.target.value })}
                      placeholder="What does this talent do?"
                      rows={3}
                      className="w-full bg-surface-container-low/50 text-sm p-3 focus:outline-none hand-drawn-border font-body resize-none"
                    />
                  </div>
                  <div className="flex justify-end relative z-10">
                    <button 
                      onClick={handleAddTalent}
                      disabled={!newTalent.name || !newTalent.description}
                      className="btn-primary px-6"
                    >
                      Save Talent
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {character.talents.length > 0 ? (
              character.talents.map((talent) => (
                <div key={talent.id} className="tarot-card p-6 group relative">
                  <button 
                    onClick={() => removeTalent(talent.id)}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary transition-all p-1 z-20"
                    title="Remove Talent"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <h4 className="font-headline text-xl text-on-surface group-hover:text-primary transition-colors pr-6">{talent.name}</h4>
                    <span className={`text-[9px] uppercase tracking-widest px-2 py-1 font-label hand-drawn-border ${
                      talent.type === 'ancestry' ? 'text-primary border-primary/50' : 
                      talent.type === 'class' ? 'text-secondary border-secondary/50' :
                      'text-on-surface-variant border-outline-variant'
                    }`}>
                      {talent.type}
                    </span>
                  </div>
                  <p className="text-base text-on-surface-variant leading-relaxed font-body relative z-10">
                    {talent.description}
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full tarot-card p-10 text-center">
                <p className="text-lg text-on-surface-variant font-headline italic relative z-10">No talents or traits discovered yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    ) : (
        <CharacterDescription character={character} onUpdateCharacter={onUpdateCharacter} />
      )}

      {/* Right Panel: Quick Rolls - REMOVED, now global */}
    </motion.div>
  );
}
