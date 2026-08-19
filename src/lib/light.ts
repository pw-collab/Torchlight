import type { InventoryItem } from '@/types/inventory.types'

/** What a source burns for when the item says nothing — a torch's hour. */
const DEFAULT_MINUTES = 60

/** Minutes a source holds when it has never been lit. */
export function fullMinutes(item: InventoryItem): number {
  return item.lightMaxMinutes ?? DEFAULT_MINUTES
}

/**
 * Minutes left on a light source, read off the wall clock.
 *
 * A lit source records the moment it was lit (`litAt`) and the minutes it had
 * at that moment (`lightMinutesLeft`); everything else is subtraction. Nothing
 * has to be running for time to pass, so closing the tab, backgrounding the
 * phone, or being a different browser altogether — the GM's panel — all read
 * the same number. In Shadowdark the torch *is* the clock, so it cannot depend
 * on whose window is open.
 *
 * Rows written before this (lit, no `litAt`) count from the first time they
 * are read: a snapshot with no clock attached says nothing about elapsed time,
 * and the next light or snuff normalises the item.
 */
export function minutesLeft(item: InventoryItem, now: number = Date.now()): number {
  const banked = Math.max(0, item.lightMinutesLeft ?? fullMinutes(item))
  if (!item.isLit || !item.litAt) return banked

  const elapsedMs = now - new Date(item.litAt).getTime()
  if (!Number.isFinite(elapsedMs)) return banked
  return Math.max(0, banked - Math.floor(Math.max(0, elapsedMs) / 60_000))
}

/** Burning means equipped, lit, and with time still on it. */
export function isBurning(item: InventoryItem, now: number = Date.now()): boolean {
  return Boolean(item.equipped && item.isLight && item.isLit) && minutesLeft(item, now) > 0
}

/** The burning source with the most time left — that's the party's light. */
export function brightest(inventory: InventoryItem[], now: number = Date.now()): InventoryItem | null {
  const lit = inventory.filter(i => isBurning(i, now))
  if (lit.length === 0) return null
  return lit.reduce((a, b) => (minutesLeft(b, now) > minutesLeft(a, now) ? b : a))
}

/** A carried source that still has time and could be lit right now. */
export function spareSource(inventory: InventoryItem[], now: number = Date.now()): InventoryItem | undefined {
  return inventory.find(i => i.isLight && !isBurning(i, now) && minutesLeft(i, now) > 0)
}

/** Lights a source. One write, and the clock does the rest. */
export function lightSource(item: InventoryItem, now: number = Date.now()): InventoryItem {
  return {
    ...item,
    isLit: true,
    litAt: new Date(now).toISOString(),
    lightMinutesLeft: minutesLeft(item, now),
  }
}

/** Puts a source out, banking the minutes it still had. */
export function extinguishSource(item: InventoryItem, now: number = Date.now()): InventoryItem {
  return {
    ...item,
    isLit: false,
    litAt: null,
    lightMinutesLeft: minutesLeft(item, now),
  }
}

/**
 * Puts out whatever is burning; anything that isn't a lit light source passes
 * through untouched. Stowing a torch has to stop its clock, and a sword must
 * not come back from this carrying light fields it never had.
 */
export function snuff(item: InventoryItem, now: number = Date.now()): InventoryItem {
  if (!item.isLight || !item.isLit) return item
  return extinguishSource(item, now)
}

/**
 * Snuffs every source that has burned down to nothing. Returns `null` when
 * there is nothing to reconcile, so the caller can skip the write — the
 * displayed minutes are derived either way, and this only settles the record.
 */
export function snuffBurnedOut(
  inventory: InventoryItem[],
  now: number = Date.now(),
): InventoryItem[] | null {
  const burnedOut = new Set(
    inventory.filter(i => i.isLight && i.isLit && minutesLeft(i, now) <= 0).map(i => i.id),
  )
  if (burnedOut.size === 0) return null

  return inventory.map(i =>
    burnedOut.has(i.id) ? { ...i, isLit: false, litAt: null, lightMinutesLeft: 0 } : i,
  )
}
