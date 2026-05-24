export type AttributeName = 'Strength' | 'Dexterity' | 'Constitution' | 'Intelligence' | 'Wisdom' | 'Charisma';

export interface Attribute {
  name: AttributeName;
  value: number;
  modifier: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  weight: number;
  quantity: number;
  type: 'weapon' | 'armor' | 'gear' | 'treasure' | 'shield';
  equipped?: boolean;
  slot?: 'mainHand' | 'offHand' | 'armor';
  weaponType?: 'melee' | 'ranged';
  attackBonus?: number;
  damageDie?: string;
  acBonus?: number;
  isTorch?: boolean;
  lightSourceType?: 'torch' | 'candle' | 'lantern';
  lightSourceMaxTime?: number;
  torchTimeRemaining?: number;
  isLit?: boolean;
  cost?: string;
  range?: string;
}

export interface Spell {
  id: string;
  name: string;
  tier: number;
  type: string;
  range: string;
  duration: string;
  castingTime: string;
  description: string;
  isLost?: boolean;
  alignment?: string;
  classes?: string[];
  darkPowersCheck?: boolean;
  school?: string;
  source?: string;
}

export interface Talent {
  id: string;
  name: string;
  type: 'ancestry' | 'class' | 'general';
  description: string;
  levelGained?: number;
}

export interface RollResult {
  id: string;
  timestamp: number;
  label: string;
  subLabel?: string;
  die: string;
  result: number;
  modifier?: number;
  total: number;
  isCritical?: boolean;
  isFumble?: boolean;
  rolls?: number[];
}

export interface CombatAction {
  name: string;
  attribute: AttributeName;
  bonus: number;
}

export interface Character {
  id: string;
  name: string;
  ancestry: string;
  class: string;
  archetype?: string;
  alignment: string;
  level: number;
  xp: number;
  maxXp: number;
  hp: number;
  maxHp: number;
  ac: number;
  attributes: Attribute[];
  combatActions: {
    melee: CombatAction;
    ranged: CombatAction;
    spellcasting: CombatAction;
  };
  inventory: Item[];
  spells: Spell[];
  talents: Talent[];
  gold: number;
  silver: number;
  copper: number;
  background: string;
  portraitUrl?: string;
  originDomain?: string;
  originDomainLink?: string;
  deity?: string;
  deityLink?: string;
  languages: string[];
  luck: boolean;
  knowledge?: string[];
  backgroundDetails?: {
    concept?: string;
    origin?: string;
    backstory?: string;
    traumaticEvents?: string;
  };
  relations?: {
    family?: string[];
    allies?: string[];
    rivals?: string[];
    faction?: string;
  };
  impulses?: {
    secrets?: string;
    flaws?: string;
    fears?: string;
    objectives?: string;
  };
}
