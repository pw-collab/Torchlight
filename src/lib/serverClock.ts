/**
 * One clock for every device at the table.
 *
 * A torch burns by elapsed time, and each phone measured that against its own
 * clock: a phone running two minutes slow showed two more minutes of light
 * than the GM saw, and lit its torches two minutes in the past. This keeps the
 * offset between this device and the server, measured once per page load, and
 * `serverNow()` applies it. Until the first measurement lands it is simply the
 * device clock, so nothing waits on the network.
 */

let offsetMs = 0
let syncing: Promise<void> | null = null

/** A round trip slower than this says more about the network than the clock. */
const MAX_ROUND_TRIP_MS = 5000

/** Now, on the server's clock. */
export function serverNow(): number {
  return Date.now() + offsetMs
}

/** Measures the offset once; later calls share the first measurement. */
export function syncServerClock(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  syncing ??= measure().catch(() => {
    // Offline or blocked: keep the device clock, and try again next load.
  })
  return syncing
}

async function measure(): Promise<void> {
  const sent = Date.now()
  const res = await fetch('/api/time', { cache: 'no-store' })
  const received = Date.now()
  if (!res.ok || received - sent > MAX_ROUND_TRIP_MS) return

  const { now } = (await res.json()) as { now?: unknown }
  if (typeof now !== 'number' || !Number.isFinite(now)) return

  // The server read its clock somewhere in the round trip; the midpoint is
  // the best guess, and good to well under a second.
  offsetMs = Math.round(now - (sent + received) / 2)
}
