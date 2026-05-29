export interface RollResult {
  id: string
  timestamp: number
  label: string
  subLabel?: string
  die: string
  result: number
  modifier?: number
  total: number
  isCritical?: boolean
  isFumble?: boolean
  rolls?: number[]
  advantage?: 'advantage' | 'disadvantage'
}

export function modifier(stat: number): number {
  return Math.floor((stat - 10) / 2)
}

export function modifierStr(stat: number): string {
  const mod = modifier(stat)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function rollSides(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export function rollDie(
  die: string,
  label: string,
  subLabel?: string,
  mod: number = 0,
  advantage = false,
  disadvantage = false,
): RollResult {
  const sides = parseInt(die.substring(1))
  let result = rollSides(sides)
  let rolls: number[] | undefined
  let advMode: 'advantage' | 'disadvantage' | undefined

  if (advantage && !disadvantage) {
    const r2 = rollSides(sides)
    rolls = [result, r2]
    result = Math.max(result, r2)
    subLabel = subLabel ? `${subLabel} (Vantagem)` : '(Vantagem)'
    advMode = 'advantage'
  } else if (disadvantage && !advantage) {
    const r2 = rollSides(sides)
    rolls = [result, r2]
    result = Math.min(result, r2)
    subLabel = subLabel ? `${subLabel} (Desvantagem)` : '(Desvantagem)'
    advMode = 'disadvantage'
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    label,
    subLabel,
    die,
    result,
    modifier: mod,
    total: result + mod,
    isCritical: die === 'd20' && result === 20,
    isFumble: die === 'd20' && result === 1,
    rolls,
    advantage: advMode,
  }
}

export function rollFormula(formula: string, label: string, subLabel?: string): RollResult {
  let clean = formula.toLowerCase().replace(/\s+/g, '')
  if (clean.startsWith('d')) clean = '1' + clean

  const match = clean.match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) {
    return rollDie(formula.includes('d') ? formula : 'd20', label, subLabel)
  }

  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  const mod = match[3] ? parseInt(match[3]) : 0

  let total = 0
  for (let i = 0; i < count; i++) total += rollSides(sides)

  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    label,
    subLabel: subLabel ?? formula,
    die: clean,
    result: total,
    modifier: mod,
    total: total + mod,
    isCritical: count === 1 && sides === 20 && total === 20,
    isFumble: count === 1 && sides === 20 && total === 1,
  }
}

export function roll3d6(): number {
  return rollSides(6) + rollSides(6) + rollSides(6)
}

export function rollStats(): Record<string, number> {
  return {
    str: roll3d6(),
    dex: roll3d6(),
    con: roll3d6(),
    int: roll3d6(),
    wis: roll3d6(),
    cha: roll3d6(),
  }
}
