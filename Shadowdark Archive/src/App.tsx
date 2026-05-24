/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import CharacterView from './components/CharacterView';
import CharacterSidebar from './components/CharacterSidebar';
import InventoryView from './components/InventoryView';
import SpellsView from './components/SpellsView';
import RollToasts from './components/RollToasts';
import DiceOverlay from './components/DiceOverlay';
import { Character, RollResult } from './types';
import { parseNotionHTML } from './lib/notionParser';

import CharacterWizard from './components/CharacterWizard';

const DEFAULT_CHARACTER: Character = {
  id: 'placeholder',
  name: 'Dark powers',
  ancestry: 'None',
  class: 'None',
  archetype: 'None',
  alignment: 'Neutral',
  level: 1,
  xp: 2450,
  maxXp: 5000,
  hp: 28,
  maxHp: 32,
  ac: 15,
  attributes: [
    { name: 'Strength', value: 10, modifier: -2 },
    { name: 'Dexterity', value: 13, modifier: 1 },
    { name: 'Constitution', value: 12, modifier: 1 },
    { name: 'Intelligence', value: 16, modifier: 3 },
    { name: 'Wisdom', value: 11, modifier: 0 },
    { name: 'Charisma', value: 10, modifier: 0 },
  ],
  combatActions: {
    melee: { name: 'Melee Attack', attribute: 'Strength', bonus: 0 },
    ranged: { name: 'Ranged Attack', attribute: 'Dexterity', bonus: 0 },
    spellcasting: { name: 'Spellcasting', attribute: 'Intelligence', bonus: 0 },
  },
  inventory: [
    { id: '1', name: 'Shortsword', description: 'A sharp, double-edged blade.', weight: 1, quantity: 1, type: 'weapon', equipped: true },
    { id: '2', name: 'Leather Armor', description: 'Tough, cured hide.', weight: 1, quantity: 1, type: 'armor', equipped: true },
    { id: '3', name: 'Thieves\' Tools', description: 'A set of lockpicks and probes.', weight: 1, quantity: 1, type: 'gear' },
    { id: '4', name: 'Rope (50ft)', description: 'Sturdy hempen rope.', weight: 1, quantity: 1, type: 'gear' },
    { id: '5', name: 'Torches (3)', description: 'Provides light for 1 hour.', weight: 1, quantity: 3, type: 'gear' },
  ],
  spells: [
    { id: '1', name: 'Invisibility', tier: 2, type: 'Illusion', range: 'Self', duration: '10 min', castingTime: '1 Action', description: 'Become invisible until you attack or cast a spell.' },
    { id: '2', name: 'Mage Hand', tier: 1, type: 'Transmutation', range: '30 ft', duration: '1 min', castingTime: '1 Action', description: 'A spectral hand that can manipulate objects.' },
  ],
  talents: [
    { id: '1', name: 'Ambitious', type: 'ancestry', description: 'You gain one additional Talent roll at level 1.' },
    { id: '2', name: 'Backstab', type: 'class', description: 'Deal extra damage when attacking an unaware foe.' },
    { id: '3', name: 'Expert Climber', type: 'class', description: 'Advantage on checks to climb vertical surfaces.' },
  ],
  gold: 124,
  silver: 45,
  copper: 12,
  background: 'Urchin',
  originDomain: 'The Sinking City',
  originDomainLink: 'https://notion.so/sinking-city',
  deity: 'Saint Terragnis',
  deityLink: 'https://notion.so/saint-terragnis',
  languages: ['Common', 'Thieves\' Cant'],
  luck: true,
};

export default function App() {
  const [currentView, setCurrentView] = useState('character');
  const [character, setCharacter] = useState<Character>(() => {
    const saved = localStorage.getItem('shadowdark_character');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved character", e);
      }
    }
    return DEFAULT_CHARACTER;
  });
  const [rollHistory, setRollHistory] = useState<RollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<RollResult | null>(null);

  useEffect(() => {
    localStorage.setItem('shadowdark_character', JSON.stringify(character));
  }, [character]);

  const handleRoll = useCallback((result: RollResult) => {
    setIsRolling(true);
    setLastResult(result);
    
    // Delay adding to history until animation completes
    setTimeout(() => {
      setRollHistory(prev => [result, ...prev].slice(0, 20));
      setIsRolling(false);
    }, 600);

    // Send to Discord Webhook
    const webhookUrl = "https://discord.com/api/webhooks/1486864291100496018/PWeQmJ1rgTtCH0W3tTNTAZN-H_Gtiq_AzA01kfAY_trH6Ni8MP8C6FhPChsnl37ZkLdS";
    
    let color = 3447003; // Default blue
    if (result.isCritical) color = 5763719; // Green
    if (result.isFumble) color = 15548997; // Red

    const embed: any = {
      title: `🎲 Rolled ${result.label}`,
      color: color,
      fields: [
        {
          name: "Result",
          value: `**${result.total}**`,
          inline: true
        },
        {
          name: "Details",
          value: `${result.result} (${result.die})${result.modifier !== undefined && result.modifier !== 0 ? (result.modifier >= 0 ? ` + ${result.modifier}` : ` - ${Math.abs(result.modifier)}`) : ''}`,
          inline: true
        }
      ],
      footer: {
        text: new Date(result.timestamp).toLocaleTimeString()
      }
    };

    if (result.subLabel) {
      embed.description = `*${result.subLabel}*`;
    }

    if (result.isCritical) {
      embed.fields.push({ name: "Critical!", value: "Critical Success!", inline: false });
    } else if (result.isFumble) {
      embed.fields.push({ name: "Fumble!", value: "Critical Failure!", inline: false });
    }

    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: character.name,
        embeds: [embed]
      })
    }).catch(err => console.error("Failed to send roll to Discord:", err));

  }, [character.name]);

  const handleClearHistory = () => {
    setRollHistory([]);
  };

  const handleImport = (content: string, isJson: boolean = false) => {
    if (isJson) {
      try {
        const importedData = JSON.parse(content);
        setCharacter(prev => ({ ...prev, ...importedData }));
      } catch (e) {
        console.error("Failed to parse JSON", e);
      }
      return;
    }

    const importedData = parseNotionHTML(content);
    setCharacter(prev => ({
      ...prev,
      ...importedData,
      id: importedData.name?.toLowerCase().replace(/\s+/g, '-') || prev.id,
      // Ensure we have some default values for missing fields
      xp: importedData.xp ?? prev.xp,
      maxXp: importedData.maxXp ?? prev.maxXp,
      alignment: importedData.alignment ?? prev.alignment,
      background: importedData.background ?? prev.background,
      archetype: importedData.archetype ?? prev.archetype,
      originDomain: importedData.originDomain ?? prev.originDomain,
      originDomainLink: importedData.originDomainLink ?? prev.originDomainLink,
      deity: importedData.deity ?? prev.deity,
      deityLink: importedData.deityLink ?? prev.deityLink,
      gold: importedData.gold ?? prev.gold,
      silver: importedData.silver ?? prev.silver,
      copper: importedData.copper ?? prev.copper,
      luck: importedData.luck ?? prev.luck,
    }));
  };

  const handleUpdateCharacter = (updates: Partial<Character>) => {
    setCharacter(prev => ({ ...prev, ...updates }));
  };

  const renderView = () => {
    switch (currentView) {
      case 'character':
        return <CharacterView character={character} onRoll={handleRoll} onUpdateCharacter={handleUpdateCharacter} />;
      case 'inventory':
        return <InventoryView character={character} onUpdateCharacter={handleUpdateCharacter} onRoll={handleRoll} />;
      case 'spells':
        return <SpellsView character={character} onRoll={handleRoll} onUpdateCharacter={handleUpdateCharacter} />;
      default:
        return <CharacterView character={character} onRoll={handleRoll} onUpdateCharacter={handleUpdateCharacter} />;
    }
  };

  if (currentView === 'wizard') {
    return (
      <CharacterWizard 
        onComplete={(newChar) => {
          setCharacter(newChar);
          setCurrentView('character');
        }}
        onCancel={() => setCurrentView('character')}
      />
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onViewChange={setCurrentView}
    >
      <CharacterSidebar character={character} onUpdateCharacter={handleUpdateCharacter} onImport={handleImport} onRoll={handleRoll} onCreateNew={() => setCurrentView('wizard')} />
      {renderView()}
      <RollToasts 
        rolls={rollHistory} 
        onRoll={handleRoll} 
      />
      <DiceOverlay isRolling={isRolling} lastResult={lastResult} />
    </Layout>
  );
}
