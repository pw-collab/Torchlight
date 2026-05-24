import { Zap, Lock, RefreshCw, AlertTriangle, Plus, X, Search, Eye, Sparkles, Orbit, Flame, Skull, Users, Shield, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Character, RollResult, Spell, AttributeName } from '../types';
import { rollDie, rollFormula } from '../lib/dice';
import { SPELLS } from '../data/spells';
import DescriptionWithRolls from './DescriptionWithRolls';

interface SpellsViewProps {
  character: Character;
  onRoll: (result: RollResult) => void;
  onUpdateCharacter: (updates: Partial<Character>) => void;
}

const MISHAPS = [
  "The spell backfires, dealing 1d6 damage to you.",
  "You are blinded for 1d4 rounds.",
  "Your skin turns a bright, glowing purple for 24 hours.",
  "You cannot speak for 1 hour.",
  "A small, harmless cloud of soot follows you for 1 day.",
  "The spell's effect is reversed (if possible).",
  "You fall unconscious for 1d6 rounds.",
  "A random item in your inventory is teleported 30 feet away.",
  "You lose the ability to cast any spells for 1 hour.",
  "The spell works, but you also summon a hostile skeleton nearby.",
  "You age 1d10 years instantly.",
  "Your hair falls out and regrows as feathers.",
  "You swap positions with a random creature you can see.",
  "The spell targets you instead of the intended target.",
  "You are surrounded by a sphere of silence (10' radius) for 1 hour."
];

const getTierTitle = (tier: number) => {
  switch (tier) {
    case 1: return "Tier 1";
    case 2: return "Tier 2";
    case 3: return "Tier 3";
    case 4: return "Tier 4";
    case 5: return "Tier 5";
    case 6: return "Tier 6";
    case 7: return "Tier 7";
    default: return `Tier ${tier} Spells`;
  }
};

export default function SpellsView({ character, onRoll, onUpdateCharacter }: SpellsViewProps) {
  const [isAddingSpell, setIsAddingSpell] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<number | 'all'>('all');

  const action = character.combatActions.spellcasting;
  const attr = character.attributes.find(a => a.name === action.attribute);
  const castingBonus = (attr?.modifier || 0) + action.bonus;

  const handleAttributeChange = (newAttribute: string) => {
    onUpdateCharacter({
      combatActions: {
        ...character.combatActions,
        spellcasting: {
          ...character.combatActions.spellcasting,
          attribute: newAttribute as AttributeName
        }
      }
    });
  };

  const handleBonusChange = (newBonus: number) => {
    onUpdateCharacter({
      combatActions: {
        ...character.combatActions,
        spellcasting: {
          ...character.combatActions.spellcasting,
          bonus: newBonus
        }
      }
    });
  };

  const handleCast = (spell: Spell, type: 'normal' | 'advantage' | 'disadvantage' | 'custom' = 'normal', customMod: string = '') => {
    if (spell.isLost) return;

    let finalModifier = castingBonus;
    let advantage = false;
    let disadvantage = false;
    let subLabel = spell.name;

    if (type === 'advantage') {
      advantage = true;
    } else if (type === 'disadvantage') {
      disadvantage = true;
    } else if (type === 'custom' && customMod) {
      const isNegative = customMod.startsWith('-');
      const cleanCustom = customMod.replace(/^[+-]/, '').trim();
      
      if (cleanCustom.includes('d')) {
        const customRoll = rollFormula(cleanCustom, 'Custom', 'Custom');
        const customTotal = isNegative ? -customRoll.total : customRoll.total;
        finalModifier += customTotal;
        subLabel = `${spell.name} ${isNegative ? '-' : '+'} ${cleanCustom} (${customTotal})`;
      } else {
        const customNum = parseInt(customMod) || 0;
        finalModifier += customNum;
        subLabel = `${spell.name} ${customNum >= 0 ? '+' : ''}${customNum}`;
      }
    }

    const result = rollDie('d20', 'Spellcasting', subLabel, finalModifier, advantage, disadvantage);
    onRoll(result);

    const dc = 10 + spell.tier;

    if (result.result === 1) {
      // Critical Failure
      const mishapIndex = Math.floor(Math.random() * MISHAPS.length);
      const mishap = MISHAPS[mishapIndex];

      // Mark spell as lost
      const newSpells = character.spells.map(s =>
        s.id === spell.id ? { ...s, isLost: true } : s
      );
      onUpdateCharacter({ spells: newSpells });

      // Trigger mishap roll
      onRoll({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        label: "MAGICAL MISHAP!",
        subLabel: mishap,
        die: "Mishap Table",
        result: mishapIndex + 1,
        total: mishapIndex + 1,
        isFumble: true
      });
    } else if (result.total < dc) {
      // Failure
      const newSpells = character.spells.map(s =>
        s.id === spell.id ? { ...s, isLost: true } : s
      );
      onUpdateCharacter({ spells: newSpells });
    }
  };

  const handleRest = () => {
    const newSpells = character.spells.map(s => ({ ...s, isLost: false }));
    onUpdateCharacter({ spells: newSpells });
  };

  const handleAddSpell = (spell: Spell) => {
    if (character.spells.some(s => s.id === spell.id)) return;
    onUpdateCharacter({ spells: [...character.spells, { ...spell, isLost: false }] });
  };

  const handleRemoveSpell = (spellId: string) => {
    onUpdateCharacter({ spells: character.spells.filter(s => s.id !== spellId) });
  };

  const handleRecoverSpell = (spellId: string) => {
    const newSpells = character.spells.map(s =>
      s.id === spellId ? { ...s, isLost: false } : s
    );
    onUpdateCharacter({ spells: newSpells });
  };

  const filteredAvailableSpells = SPELLS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === 'all' || s.tier === filterTier;
    const notAlreadyKnown = !character.spells.some(known => known.id === s.id);

    return matchesSearch && matchesTier && notAlreadyKnown;
  });

  const knownTiers = Array.from(new Set(character.spells.map(s => s.tier))).sort((a, b) => a - b);
  const availableTiers = Array.from(new Set(SPELLS.map(s => s.tier))).sort((a, b) => a - b);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto pt-8 px-6 pb-24"
    >
      <header className="flex flex-col lg:flex-row lg:items-start justify-between gap-8 mb-16">
        <div>
          <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface mb-2">Spellbook</h1>
          <div className="flex gap-3 h-full">
            <button
              onClick={handleRest}
              className="btn-primary"
              title="Recover all lost spells"
            >
              <RefreshCw size={16} /> Recover
            </button>
            <button
              onClick={() => setIsAddingSpell(true)}
              className="btn-primary"
            >
              <Plus size={16} /> Learn Spell
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="tarot-card p-4 flex flex-col md:flex-row gap-6 md:items-center bg-surface-container-low shadow-lg">
            <div className="flex flex-col min-w-[120px]">
              <span className="text-[8px] font-bold text-tertiary uppercase tracking-widest mb-1">Casting Attribute</span>
              <select
                value={action.attribute}
                onChange={(e) => handleAttributeChange(e.target.value)}
                className="bg-transparent font-headline text-lg text-primary focus:outline-none cursor-pointer hover:text-primary-fixed transition-colors"
              >
                {['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'].map(attrName => (
                  <option key={attrName} value={attrName} className="bg-surface-container-high text-on-surface">{attrName}</option>
                ))}
              </select>
            </div>

            <div className="h-8 w-full bg-outline-variant/20 hidden md:block" />

            <div className="flex flex-col">
              <span className="text-[8px] font-bold text-tertiary uppercase tracking-widest mb-1">Misc Bonus</span>
              <div className="flex items-center gap-2">
                <span className="text-primary font-headline text-lg">+</span>
                <input
                  type="number"
                  value={action.bonus}
                  onChange={(e) => handleBonusChange(parseInt(e.target.value) || 0)}
                  className="w-12 bg-transparent font-headline text-xl text-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="h-10 w-px bg-outline-variant/30 hidden md:block" />

            <div className="flex flex-col items-center justify-center bg-primary/5 px-6 py-2 rounded-xl border border-primary/20 shadow-inner">
              <span className="text-[8px] font-bold text-primary uppercase tracking-widest mb-0.5">Total Bonus</span>
              <span className="font-headline text-4xl text-primary leading-none">{castingBonus}</span>
            </div>
          </div>


        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {character.spells.length > 0 ? (
          character.spells
            .sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name))
            .map((spell) => (
              <SpellCard
                key={spell.id}
                spell={spell}
                onCast={() => handleCast(spell)}
                onRecover={() => handleRecoverSpell(spell.id)}
                onRemove={() => handleRemoveSpell(spell.id)}
                onRollFormula={(formula) => onRoll(rollFormula(formula, spell.name))}
              />
            ))
        ) : (
          <div className="col-span-full py-32 text-center tarot-card border-dashed bg-surface-container-lowest/30">
            <Zap size={64} className="mx-auto text-outline-variant mb-6 opacity-20" />
            <h3 className="font-headline text-2xl text-on-surface-variant mb-2 italic">Your spellbook is empty</h3>
            <p className="text-on-surface-variant/60 text-sm max-w-md mx-auto mb-8">Seek ancient scrolls and forgotten tomes in the dark corners of the world to learn new incantations.</p>
            <button
              onClick={() => setIsAddingSpell(true)}
              className="btn-secondary mx-auto"
            >
              <Plus size={16} /> Learn your first spell
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddingSpell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingSpell(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[80vh] tarot-card shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
                <div>
                  <h2 className="font-headline text-2xl text-on-surface italic font-bold">Ancient Knowledge</h2>
                  <p className="text-[10px] text-tertiary uppercase tracking-widest">Select a spell to add to your scriptorium</p>
                </div>
                <button
                  onClick={() => setIsAddingSpell(false)}
                  className="p-2 hover:text-primary transition-colors text-on-surface-variant"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 bg-surface-container border-b border-outline-variant/10 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
                  <input
                    type="text"
                    placeholder="Search spells..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/20 py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterTier('all')}
                    className={`btn-toggle ${filterTier === 'all' ? 'active' : ''}`}
                  >
                    All Tiers
                  </button>
                  {availableTiers.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setFilterTier(tier as any)}
                      className={`btn-toggle ${filterTier === tier ? 'active' : ''}`}
                    >
                      Tier {tier}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAvailableSpells.map((spell) => (
                  <div
                    key={spell.id}
                    className="tarot-card p-4 hover:border-primary/50 transition-all group cursor-pointer"
                    onClick={() => {
                      handleAddSpell(spell);
                      setIsAddingSpell(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-headline text-lg text-primary group-hover:text-primary-fixed transition-colors">{spell.name}</h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-surface-container-highest text-tertiary uppercase tracking-widest">Tier {spell.tier}</span>
                    </div>
                    <div className="flex gap-4 mb-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] text-tertiary uppercase tracking-tighter">Range</span>
                        <span className="text-[10px] font-medium">{spell.range}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] text-tertiary uppercase tracking-tighter">Duration</span>
                        <span className="text-[10px] font-medium">{spell.duration}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface/70 line-clamp-2 italic">{spell.description}</p>
                  </div>
                ))}
                {filteredAvailableSpells.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-tertiary italic">No matching spells found in the archives.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const typeStyles: Record<string, any> = {
  Spell: {
    mainColor: 'text-arcane',
    borderColor: 'border-arcane',
    accentBg: 'bg-arcane/10',
    fontHeadline: 'font-arcane',
    paperBg: 'bg-[#f4ecd8]', // Standard parchment
    traitBg: 'bg-[#e2d5b5]/30',
    icon: <Sparkles size={16} />,
    bgPattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' stroke='%23008b8b' stroke-width='0.5' fill='none' opacity='0.05'/%3E%3Ccircle cx='50' cy='50' r='30' stroke='%23008b8b' stroke-width='0.3' fill='none' opacity='0.05'/%3E%3Cpath d='M50 10 L50 90 M10 50 L90 50' stroke='%23008b8b' stroke-width='0.2' opacity='0.05'/%3E%3C/svg%3E")`,
  },
  Miracle: {
    mainColor: 'text-divine',
    borderColor: 'border-divine',
    accentBg: 'bg-divine/10',
    fontHeadline: 'font-divine',
    paperBg: 'bg-[#fdf5e6]', // Old Lace
    traitBg: 'bg-[#f5deb3]/30',
    icon: <Sun size={16} />,
    bgPattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z' fill='%23b8860b' opacity='0.05'/%3E%3C/svg%3E")`,
  },
  Witchery: {
    mainColor: 'text-occult',
    borderColor: 'border-occult',
    accentBg: 'bg-occult/10',
    fontHeadline: 'font-occult',
    paperBg: 'bg-[#e8e4d9]', // Slightly grey/aged
    traitBg: 'bg-[#d2b48c]/30',
    icon: <Moon size={16} />,
    bgPattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 10 Q50 40 40 70 Q30 40 40 10' fill='%23880e4f' opacity='0.05'/%3E%3Cpath d='M10 40 Q40 50 70 40 Q40 30 10 40' fill='%23880e4f' opacity='0.05'/%3E%3C/svg%3E")`,
    irregular: true,
  },
};

interface SpellCardProps {
  key?: string;
  spell: Spell;
  color: string;
  onCast: (type: 'normal' | 'advantage' | 'disadvantage' | 'custom', customMod?: string) => void;
  onRecover: () => void;
  onRemove: () => void;
  onRollFormula: (formula: string) => void;
}

function SpellCard({ spell, onCast, onRecover, onRemove, onRollFormula }: Omit<SpellCardProps, 'color'>) {
  const [showCastMenu, setShowCastMenu] = useState(false);
  const [customModifier, setCustomModifier] = useState<string>('');

  const typeStyle = (spell.type === 'Miracle' ? typeStyles.Miracle :
    spell.type === 'Witchery' ? typeStyles.Witchery :
      typeStyles.Spell) || typeStyles.Spell;

  const dc = 10 + spell.tier;

  const getSchoolIcon = (school?: string) => {
    if (!school) return typeStyle.icon;
    switch (school.toLowerCase()) {
      case 'divination': return <Eye size={16} />;
      case 'illusion': return <Sparkles size={16} />;
      case 'conjuration': return <Orbit size={16} />;
      case 'evocation': return <Flame size={16} />;
      case 'necromancy': return <Skull size={16} />;
      case 'enchantment': return <Users size={16} />;
      case 'abjuration': return <Shield size={16} />;
      case 'transmutation': return <Zap size={16} />;
      default: return typeStyle.icon;
    }
  };

  return (
    <motion.div
      layout
      className={`border-2 border-white group relative transition-all duration-500 p-0 flex flex-col ${spell.isLost ? 'is-lost' : ''} hover:shadow-2xl hover:-translate-y-1 ${typeStyle.paperBg} h-[420px] shadow-md overflow-hidden ${typeStyle.irregular ? 'rounded-[7px_255px_3px_25px/255px_5px_225px_3px]' : 'rounded-sm'}`}
      style={{
        backgroundImage: `${typeStyle.bgPattern}, url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`
      }}
    >
      {/* HEADER */}
      <div className="p-4 flex justify-between items-start"
        style={{
          backgroundColor: `var(--color-${spell.type === 'Miracle' ? 'divine' : spell.type === 'Witchery' ? 'occult' : 'arcane'})`
        }}
      >
        <div>
          <h3 className={`${typeStyle.fontHeadline} text-xl italic font-bold text-on-surface transition-colors leading-tight`}>{spell.name}</h3>
          <span className="text-sm text-black/80 font-medium">Tier {spell.tier} · {spell.school || spell.type}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 flex items-center justify-center rounded-full border border-white/30 text-white">
            {getSchoolIcon(spell.school)}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-white/70 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        <div className="text-[14px] text-[#2c241a]/90 leading-relaxed italic flex-1 overflow-y-auto custom-scrollbar pr-2">
          <DescriptionWithRolls text={spell.description} onRoll={onRollFormula} />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className={`flex flex-col items-center p-1.5 ${typeStyle.accentBg} border ${typeStyle.borderColor}/20 rounded`}>
            <span className="text-[7px] text-[#5c5346] uppercase tracking-widest mb-0.5">Range</span>
            <span className={`text-[10px] font-medium ${typeStyle.mainColor} text-center line-clamp-1`}>{spell.range}</span>
          </div>

          <div className={`flex flex-col items-center p-1.5 ${typeStyle.accentBg} border ${typeStyle.borderColor}/20 rounded`}>
            <span className="text-[7px] text-[#5c5346] uppercase tracking-widest mb-0.5">Duration</span>
            <span className={`text-[10px] font-medium ${typeStyle.mainColor} text-center line-clamp-1`}>{spell.duration}</span>
          </div>

          <div className={`flex flex-col items-center p-1.5 ${typeStyle.accentBg} border ${typeStyle.borderColor}/20 rounded`}>
            <span className="text-[7px] text-[#5c5346] uppercase tracking-widest mb-0.5">DC</span>
            <span className={`text-[10px] font-medium ${typeStyle.mainColor} text-center line-clamp-1`}>{dc}</span>
          </div>
        </div>
      </div>

      {/* FOOTER / CTA */}
      <div className={`p-4 ${typeStyle.traitBg} border-t border-[#5c5346]/10 relative overflow-visible`}>
        {spell.isLost ? (
          <div className="relative h-10 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center text-[#5c5346]/60 py-2.5 text-[10px] font-bold uppercase tracking-widest gap-2 border border-dashed border-[#5c5346]/30 transition-opacity duration-300 group-hover:opacity-0 rounded-sm">
              <AlertTriangle size={14} /> Spell Lost
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRecover();
              }}
              className="btn-primary w-full absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-white border-none"
              style={{
                backgroundColor: `var(--color-${spell.type === 'Miracle' ? 'divine' : spell.type === 'Witchery' ? 'occult' : 'arcane'})`,
                WebkitTextFillColor: 'white'
              }}
            >
              <RefreshCw size={14} /> Recover Spell
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowCastMenu(!showCastMenu)}
              className="btn-primary w-full text-white border-none shadow-lg hover:brightness-110"
              style={{
                backgroundColor: `var(--color-${spell.type === 'Miracle' ? 'divine' : spell.type === 'Witchery' ? 'occult' : 'arcane'})`,
                WebkitTextFillColor: 'white'
              }}
            >
              <Zap size={14} /> Cast Spell
            </button>

            <AnimatePresence>
              {showCastMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-surface-container border border-outline-variant rounded shadow-xl p-2 flex flex-col gap-1"
                >
                  <button onClick={() => { onCast('normal'); setShowCastMenu(false); }} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors text-on-surface">Normal Roll</button>
                  <button onClick={() => { onCast('advantage'); setShowCastMenu(false); }} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors text-primary">Advantage</button>
                  <button onClick={() => { onCast('disadvantage'); setShowCastMenu(false); }} className="text-xs text-left px-2 py-1 hover:bg-surface-container-high rounded transition-colors text-error">Disadvantage</button>
                  <div className="flex items-center gap-1 mt-1 border-t border-outline-variant pt-1">
                    <input 
                      type="text" 
                      placeholder="-1d4" 
                      value={customModifier}
                      onChange={(e) => setCustomModifier(e.target.value)}
                      className="w-full bg-surface-container-low text-xs p-1 rounded focus:outline-none border border-outline-variant/50 text-on-surface"
                    />
                    <button onClick={() => { onCast('custom', customModifier); setShowCastMenu(false); setCustomModifier(''); }} className="text-xs bg-primary text-on-primary px-2 py-1 rounded hover:bg-primary/90 transition-colors">Roll</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Lost Overlay */}
      {spell.isLost && (
        <div className={`absolute inset-0 ${typeStyle.paperBg}/40 backdrop-grayscale pointer-events-none z-10`} />
      )}
    </motion.div>
  );
}
