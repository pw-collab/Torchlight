import type { CharacterRow } from '@/types/character.types'

/** One save against the database: lands only on `expected` when it is set. */
export type WriteRow = (
  updates: Partial<CharacterRow>,
  expected: number | undefined,
) => Promise<{ row: CharacterRow | null; error: unknown }>

export interface SaverHooks {
  write: WriteRow
  /** Reads the row as it is now. */
  read: () => Promise<CharacterRow | null>
  /** A row to show: a save's result, or the fresh row after a miss. */
  onRow: (row: CharacterRow) => void
  onSaved: () => void
  /** Someone else saved first; the sheet now shows their version. */
  onConflict: () => void
  onError?: (updates: Partial<CharacterRow>, error: unknown) => void
}

/**
 * The sheet's saves, one at a time, each on the version the last one left.
 *
 * Saves land only on the version they were made from (migration 021), so the
 * sheet can't overwrite a change the GM made a moment earlier. Three quick
 * clicks are three versions in a row, not three conflicts. While any save is
 * queued, realtime doesn't move the expected version: the echo of our own save
 * looks just like someone else's, and a foreign save in that window should
 * make our next one miss. After a miss, saves queued behind it were worked out
 * from a sheet that no longer exists, so they are dropped.
 */
export function createCharacterSaver(hooks: SaverHooks) {
  let version: number | undefined
  let pending = 0
  let generation = 0
  let queue: Promise<unknown> = Promise.resolve()

  async function reload() {
    const row = await hooks.read()
    if (row) {
      version = row.version
      hooks.onRow(row)
    }
  }

  return {
    /** The row as first loaded. */
    loaded(row: CharacterRow) {
      version = row.version
    },

    /** A row from realtime. Moves the expected version only while idle. */
    observed(row: CharacterRow) {
      if (pending === 0 && row.version !== undefined) {
        version = Math.max(version ?? row.version, row.version)
      }
    },

    /** Resolves true when the save landed, false when it didn't. */
    save(updates: Partial<CharacterRow>): Promise<boolean> {
      const mine = generation
      pending += 1

      const run = async (): Promise<boolean> => {
        try {
          if (mine !== generation) return false

          const { row, error } = await hooks.write(updates, version)
          if (error) {
            hooks.onError?.(updates, error)
            generation += 1
            await reload()
            return false
          }
          if (!row) {
            generation += 1
            await reload()
            hooks.onConflict()
            return false
          }

          if (row.version !== undefined) version = Math.max(version ?? row.version, row.version)
          hooks.onRow(row)
          hooks.onSaved()
          return true
        } finally {
          pending -= 1
        }
      }

      const result = queue.then(run, run)
      queue = result.catch(() => undefined)
      return result
    },
  }
}
