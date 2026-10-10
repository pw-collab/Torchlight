import { NextResponse, connection } from 'next/server'

/**
 * The server's clock, so every device can agree on one time (see
 * `src/lib/serverClock.ts`). `connection()` keeps it computed per request:
 * a cached or prerendered time would be worse than none.
 */
export async function GET() {
  await connection()
  return NextResponse.json({ now: Date.now() }, { headers: { 'Cache-Control': 'no-store' } })
}
