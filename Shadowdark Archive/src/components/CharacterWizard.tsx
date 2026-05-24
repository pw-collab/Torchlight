import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, Attribute } from '../types';
import { Dices, ChevronRight, ChevronLeft, Check, User, Shield, Zap } from 'lucide-react';

interface CharacterWizardProps {
  onComplete: (character: Character) => void;
  onCancel: () => void;
}

const ANCESTRIES = [
  { name: 'Human', description: 'Ambitious. You gain one additional Talent roll at level 1.' },
  { name: 'Elf', description: 'Farsight. +1 to ranged attacks or spellcasting checks.' },
  { name: 'Dwarf', description: 'Stout. Start with +2 HP. Roll HP with advantage.' },
  { name: 'Halfling', description: 'Stealthy. Once per day, become invisible for 3 rounds.' },
  { name: 'Half-Orc', description: 'Mighty. +1 to melee attack and damage rolls.' },
  { name: 'Goblin', description: 'Keen Senses. You cannot be surprised.' }
];

const CLASSES = [
  { name: 'Fighter', hpDie: 8, description: 'Masters of arms and armor.', weapons: 'All weapons', armor: 'All armor and shields' },
  { name: 'Priest', hpDie: 6, description: 'Crusaders of their deity.', weapons: 'Club, crossbow, dagger, mace, longsword, staff, warhammer', armor: 'All armor and shields' },
  { name: 'Thief', hpDie: 4, description: 'Masters of stealth and trickery.', weapons: 'Club, crossbow, dagger, shortbow, shortsword', armor: 'Leather armor, mithril chainmail' },
  { name: 'Wizard', hpDie: 4, description: 'Students of the arcane arts.', weapons: 'Dagger, staff', armor: 'None' }
];

const ALIGNMENTS = ['Lawful', 'Neutral', 'Chaotic'];

function calculateModifier(score: number): number {
  if (score <= 3) return -4;
  if (score <= 5) return -3;
  if (score <= 7) return -2;
  if (score <= 9) return -1;
  if (score <= 11) return 0;
  if (score <= 13) return 1;
  if (score <= 15) return 2;
  if (score <= 17) return 3;
  return 4;
}

export default function CharacterWizard({ onComplete, onCancel }: CharacterWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Partial<Character>>({
    name: '',
    ancestry: '',
    class: '',
    alignment: 'Neutral',
    background: '',
    deity: '',
    level: 1,
    xp: 0,
    maxXp: 10,
    hp: 1,
    maxHp: 1,
    ac: 10,
    gold: 0,
    silver: 0,
    copper: 0,
    luck: false,
    attributes: [
      { name: 'Strength', value: 10, modifier: 0 },
      { name: 'Dexterity', value: 10, modifier: 0 },
      { name: 'Constitution', value: 10, modifier: 0 },
      { name: 'Intelligence', value: 10, modifier: 0 },
      { name: 'Wisdom', value: 10, modifier: 0 },
      { name: 'Charisma', value: 10, modifier: 0 },
    ],
    inventory: [],
    spells: [],
    talents: [],
    combatActions: {
      melee: { name: 'Melee Attack', attribute: 'Strength', bonus: 0 },
      ranged: { name: 'Ranged Attack', attribute: 'Dexterity', bonus: 0 },
      spellcasting: { name: 'Spellcasting', attribute: 'Intelligence', bonus: 0 },
    }
  });

  const [rolledStats, setRolledStats] = useState(false);
  const [rolledHp, setRolledHp] = useState(false);
  const [hpRoll, setHpRoll] = useState(0);

  const handleRollStats = () => {
    const newAttributes = draft.attributes!.map(attr => {
      const roll1 = Math.floor(Math.random() * 6) + 1;
      const roll2 = Math.floor(Math.random() * 6) + 1;
      const roll3 = Math.floor(Math.random() * 6) + 1;
      const total = roll1 + roll2 + roll3;
      return { ...attr, value: total, modifier: calculateModifier(total) };
    });
    setDraft({ ...draft, attributes: newAttributes });
    setRolledStats(true);
  };

  const handleRollHp = () => {
    const cls = CLASSES.find(c => c.name === draft.class);
    if (!cls) return;
    
    let roll1 = Math.floor(Math.random() * cls.hpDie) + 1;
    let finalRoll = roll1;

    if (draft.ancestry === 'Dwarf') {
      const roll2 = Math.floor(Math.random() * cls.hpDie) + 1;
      finalRoll = Math.max(roll1, roll2);
    }

    const conMod = draft.attributes!.find(a => a.name === 'Constitution')?.modifier || 0;
    let totalHp = finalRoll + conMod;
    if (totalHp < 1) totalHp = 1;
    
    if (draft.ancestry === 'Dwarf') {
      totalHp += 2;
    }

    setHpRoll(finalRoll);
    setDraft({ ...draft, hp: totalHp, maxHp: totalHp });
    setRolledHp(true);
  };

  const handleFinish = () => {
    const finalCharacter: Character = {
      ...(draft as Character),
      id: Math.random().toString(36).substring(2, 9),
    };
    onComplete(finalCharacter);
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto flex flex-col">
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-headline text-3xl text-primary">Create Character</h1>
          <button onClick={onCancel} className="text-on-surface-variant hover:text-on-surface">Cancel</button>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {['Basics', 'Stats', 'Class', 'Details', 'Review'].map((label, i) => (
            <div key={label} className="flex-1 flex flex-col gap-2">
              <div className={`h-2 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-container-highest'}`} />
              <span className={`text-[10px] uppercase tracking-widest font-label ${i <= step ? 'text-primary' : 'text-on-surface-variant'}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-surface-container rounded-lg border border-outline-variant/20 p-6 shadow-xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-headline text-2xl text-on-surface">Who are you?</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Name</label>
                    <input 
                      type="text" 
                      value={draft.name} 
                      onChange={e => setDraft({ ...draft, name: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded p-3 text-on-surface focus:outline-none focus:border-primary"
                      placeholder="Enter character name..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Background</label>
                    <input 
                      type="text" 
                      value={draft.background} 
                      onChange={e => setDraft({ ...draft, background: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/50 rounded p-3 text-on-surface focus:outline-none focus:border-primary"
                      placeholder="e.g., Urchin, Blacksmith, Noble..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Alignment</label>
                    <div className="flex gap-4">
                      {ALIGNMENTS.map(al => (
                        <button
                          key={al}
                          onClick={() => setDraft({ ...draft, alignment: al })}
                          className={`flex-1 py-3 rounded border transition-colors ${draft.alignment === al ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-container-low border-outline-variant/50 text-on-surface-variant hover:border-primary/50'}`}
                        >
                          {al}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-headline text-2xl text-on-surface">Roll Attributes</h2>
                  <button onClick={handleRollStats} className="btn-primary flex items-center gap-2">
                    <Dices size={16} /> Roll 3d6
                  </button>
                </div>
                
                <p className="text-sm text-on-surface-variant">In Shadowdark, attributes are rolled 3d6 strictly in order.</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {draft.attributes!.map(attr => (
                    <div key={attr.name} className="bg-surface-container-low border border-outline-variant/30 rounded p-4 text-center">
                      <div className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">{attr.name}</div>
                      <div className="text-3xl font-headline text-on-surface mb-1">{rolledStats ? attr.value : '-'}</div>
                      <div className="text-sm font-bold text-primary">{rolledStats ? (attr.modifier >= 0 ? `+${attr.modifier}` : attr.modifier) : '-'}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-headline text-2xl text-on-surface">Choose Ancestry & Class</h2>
                
                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-3">Ancestry</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ANCESTRIES.map(anc => (
                      <button
                        key={anc.name}
                        onClick={() => setDraft({ ...draft, ancestry: anc.name })}
                        className={`text-left p-3 rounded border transition-colors ${draft.ancestry === anc.name ? 'bg-primary/20 border-primary' : 'bg-surface-container-low border-outline-variant/50 hover:border-primary/50'}`}
                      >
                        <div className={`font-headline text-lg ${draft.ancestry === anc.name ? 'text-primary' : 'text-on-surface'}`}>{anc.name}</div>
                        <div className="text-xs text-on-surface-variant mt-1">{anc.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-3">Class</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {CLASSES.map(cls => (
                      <button
                        key={cls.name}
                        onClick={() => {
                          setDraft({ ...draft, class: cls.name });
                          setRolledHp(false);
                        }}
                        className={`text-left p-3 rounded border transition-colors ${draft.class === cls.name ? 'bg-primary/20 border-primary' : 'bg-surface-container-low border-outline-variant/50 hover:border-primary/50'}`}
                      >
                        <div className={`font-headline text-lg ${draft.class === cls.name ? 'text-primary' : 'text-on-surface'}`}>{cls.name}</div>
                        <div className="text-xs text-on-surface-variant mt-1">{cls.description}</div>
                        <div className="text-[10px] text-on-surface-variant mt-2 opacity-70">
                          <strong>HP:</strong> 1d{cls.hpDie} + CON<br/>
                          <strong>Weapons:</strong> {cls.weapons}<br/>
                          <strong>Armor:</strong> {cls.armor}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-headline text-2xl text-on-surface">Hit Points & Details</h2>
                
                {!draft.class ? (
                  <p className="text-error">Please go back and select a class first.</p>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded p-6 text-center">
                      <h3 className="font-label uppercase tracking-widest text-xs text-on-surface-variant mb-4">Starting Hit Points</h3>
                      {rolledHp ? (
                        <div>
                          <div className="text-5xl font-headline text-primary mb-2">{draft.hp}</div>
                          <div className="text-sm text-on-surface-variant">
                            (Roll: {hpRoll} + CON: {draft.attributes!.find(a => a.name === 'Constitution')?.modifier || 0} {draft.ancestry === 'Dwarf' ? '+ 2 Dwarf' : ''})
                          </div>
                        </div>
                      ) : (
                        <button onClick={handleRollHp} className="btn-primary mx-auto flex items-center gap-2">
                          <Dices size={16} /> Roll 1d{CLASSES.find(c => c.name === draft.class)?.hpDie} + CON
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Deity (Optional)</label>
                        <input 
                          type="text" 
                          value={draft.deity} 
                          onChange={e => setDraft({ ...draft, deity: e.target.value })}
                          className="w-full bg-surface-container-low border border-outline-variant/50 rounded p-3 text-on-surface focus:outline-none focus:border-primary"
                          placeholder="e.g., Saint Terragnis"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-label uppercase tracking-widest text-on-surface-variant mb-2">Starting Gold</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={draft.gold} 
                            onChange={e => setDraft({ ...draft, gold: parseInt(e.target.value) || 0 })}
                            className="w-full bg-surface-container-low border border-outline-variant/50 rounded p-3 text-on-surface focus:outline-none focus:border-primary"
                          />
                          <button onClick={() => setDraft({ ...draft, gold: (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) })} className="btn-secondary whitespace-nowrap">
                            Roll 3d6
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h2 className="font-headline text-2xl text-on-surface text-center mb-6">Review Character</h2>
                
                <div className="bg-surface-container-low border border-outline-variant/30 rounded p-6">
                  <div className="text-center mb-6">
                    <h3 className="font-headline text-3xl text-primary">{draft.name || 'Unnamed Adventurer'}</h3>
                    <p className="text-sm text-on-surface-variant uppercase tracking-widest mt-1">Level 1 {draft.ancestry} {draft.class}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{draft.alignment} • {draft.background}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {draft.attributes!.map(attr => (
                      <div key={attr.name} className="text-center">
                        <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{attr.name.substring(0, 3)}</div>
                        <div className="text-xl font-headline text-on-surface">{attr.value}</div>
                        <div className="text-xs font-bold text-primary">{attr.modifier >= 0 ? `+${attr.modifier}` : attr.modifier}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-center gap-8 border-t border-outline-variant/20 pt-6">
                    <div className="text-center">
                      <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">HP</div>
                      <div className="text-2xl font-headline text-primary">{draft.hp}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Gold</div>
                      <div className="text-2xl font-headline text-primary">{draft.gold}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 flex justify-between">
          <button 
            onClick={prevStep} 
            disabled={step === 0}
            className={`btn-secondary flex items-center gap-2 ${step === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft size={16} /> Back
          </button>
          
          {step < 4 ? (
            <button 
              onClick={nextStep}
              disabled={
                (step === 1 && !rolledStats) || 
                (step === 2 && (!draft.ancestry || !draft.class)) ||
                (step === 3 && !rolledHp)
              }
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="btn-primary flex items-center gap-2 bg-primary text-on-primary"
            >
              <Check size={16} /> Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
