export function modifier(stat: number): number {
  return Math.floor((stat - 10) / 2)
}

export function modifierStr(stat: number): string {
  const mod = modifier(stat)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

export function roll3d6(): number {
  return rollDie(6) + rollDie(6) + rollDie(6)
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
