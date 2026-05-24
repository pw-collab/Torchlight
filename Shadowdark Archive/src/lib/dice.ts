import { RollResult } from '../types';

export function rollDie(die: string, label: string, subLabel?: string, modifier: number = 0, advantage: boolean = false, disadvantage: boolean = false): RollResult {
  const sides = parseInt(die.substring(1));
  let result = Math.floor(Math.random() * sides) + 1;
  let rolls: number[] | undefined;
  
  if (advantage && !disadvantage) {
    const result2 = Math.floor(Math.random() * sides) + 1;
    rolls = [result, result2];
    result = Math.max(result, result2);
    subLabel = subLabel ? `${subLabel} (Adv)` : '(Adv)';
  } else if (disadvantage && !advantage) {
    const result2 = Math.floor(Math.random() * sides) + 1;
    rolls = [result, result2];
    result = Math.min(result, result2);
    subLabel = subLabel ? `${subLabel} (Dis)` : '(Dis)';
  }

  const total = result + modifier;
  
  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    label,
    subLabel,
    die,
    result,
    modifier,
    total,
    isCritical: die === 'd20' && result === 20,
    isFumble: die === 'd20' && result === 1,
    rolls,
  };
}

export function rollFormula(formula: string, label: string, subLabel?: string): RollResult {
  // Clean formula and handle optional leading 1 (e.g., "d6" -> "1d6")
  let cleanFormula = formula.toLowerCase().replace(/\s+/g, '');
  if (cleanFormula.startsWith('d')) {
    cleanFormula = '1' + cleanFormula;
  }

  // Regex for XdY[+Z] or XdY[-Z]
  const match = cleanFormula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  
  if (!match) {
    // Fallback to single die if it doesn't match the formula
    return rollDie(formula.includes('d') ? formula : 'd20', label, subLabel);
  }

  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;

  let total = 0;
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    label,
    subLabel: subLabel || formula,
    die: cleanFormula,
    result: total,
    modifier,
    total: total + modifier,
    isCritical: count === 1 && sides === 20 && total === 20,
    isFumble: count === 1 && sides === 20 && total === 1,
  };
}
