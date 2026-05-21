// Shadowdark rule: player can re-roll all stats if no single stat exceeds 14
export function canReroll(stats: number[]): boolean {
  return !stats.some(s => s > 14)
}
