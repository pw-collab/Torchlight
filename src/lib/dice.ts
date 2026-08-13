/** One physical die on the table: its shape and the face it shows. */
export interface DieThrow {
  sides: number
  value: number
}

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
  /** The advantage/disadvantage pair — both faces, kept and discarded. */
  rolls?: number[]
  advantage?: 'advantage' | 'disadvantage'
  /**
   * Every physical die that was thrown, in order. One entry per die on the
   * table — the adv/dis pair is two entries, `3d6` is three, and a mixed pool
   * carries a different `sides` on each. The renderers need this to give every
   * die its own shape and target face; `rolls` stays the adv/dis pair alone,
   * which is what the roll toasts and the Discord relay report.
   */
  dice?: DieThrow[]
  /**
   * The die type, when the whole roll is one type. Undefined for a mixed pool —
   * read `dice` for anything that has to be right per die.
   */
  sides?: number
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
    dice: (rolls ?? [result]).map(value => ({ sides, value })),
    sides,
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

  const dice: DieThrow[] = []
  let total = 0
  for (let i = 0; i < count; i++) {
    const face = rollSides(sides)
    dice.push({ sides, value: face })
    total += face
  }

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
    dice,
    sides,
  }
}

/**
 * Standard notation for a handful of dice: `2d6 + d20`, sorted by shape so the
 * same pool always reads the same way regardless of the order it was built in.
 */
export function poolNotation(sidesList: number[]): string {
  const counts = new Map<number, number>()
  for (const s of sidesList) counts.set(s, (counts.get(s) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sides, n]) => `${n > 1 ? n : ''}d${sides}`)
    .join(' + ')
}

/**
 * Rolls a handful of dice at once. `sidesList` is one entry per physical die,
 * so `[6, 6, 20]` throws three. Types may be mixed; the total is the sum of
 * every face plus the modifier.
 *
 * Crit and fumble stay a single-d20 idea — a 20 among a fistful of damage dice
 * isn't a critical hit — so they're only flagged when the pool is exactly one
 * d20, matching what rollDie and rollFormula already do.
 */
export function rollPool(sidesList: number[], label: string, mod: number = 0, subLabel?: string): RollResult {
  const dice: DieThrow[] = []
  let total = 0
  for (const sides of sidesList) {
    const value = rollSides(sides)
    dice.push({ sides, value })
    total += value
  }

  const notation = poolNotation(sidesList)
  const loneD20 = sidesList.length === 1 && sidesList[0] === 20
  const uniform = new Set(sidesList).size === 1

  return {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    label,
    subLabel: subLabel ?? notation,
    die: notation,
    result: total,
    modifier: mod,
    total: total + mod,
    isCritical: loneD20 && total === 20,
    isFumble: loneD20 && total === 1,
    dice,
    sides: uniform ? sidesList[0] : undefined,
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
