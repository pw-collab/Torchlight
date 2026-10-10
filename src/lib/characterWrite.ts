import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { rowToCharacter, type Character, type CharacterRow } from '@/types/character.types'

/** The columns to write, and whatever the caller wants back with them (the event to log). */
export type CharacterChange<T> = { patch: Partial<CharacterRow>; result: T } | null

export type ChangeOutcome<T> =
  | { ok: true; character: Character; result: T }
  | { ok: false; reason: 'unchanged' | 'conflict' | 'error'; error?: PostgrestError | null }

/**
 * Applies a change to a character without overwriting anyone else's.
 *
 * `compute` turns the character as it stands into the columns to write. The
 * write only lands on the version the change was computed from (migration
 * 021); if someone saved in between, nothing is written, and the change is
 * computed again from the fresh row. "Deal 3 damage" worked out against an HP
 * the player had just changed is how damage got lost; worked out against the
 * HP that is there now, it can't be.
 *
 * Without a version (before migration 021) it writes as it always did.
 */
export async function changeCharacter<T>(
  supabase: SupabaseClient,
  seen: Character,
  compute: (character: Character) => CharacterChange<T>,
  attempts = 3,
): Promise<ChangeOutcome<T>> {
  let current = seen

  for (let attempt = 0; attempt < attempts; attempt++) {
    const change = compute(current)
    if (!change) return { ok: false, reason: 'unchanged' }

    let query = supabase.from('characters').update(change.patch).eq('id', current.id)
    if (current.version !== undefined) query = query.eq('version', current.version)
    const { data, error } = await query.select().maybeSingle()

    if (error) return { ok: false, reason: 'error', error }
    if (data) return { ok: true, character: rowToCharacter(data as CharacterRow), result: change.result }

    // Someone saved first. Start again from what is there now.
    const { data: fresh, error: readError } = await supabase
      .from('characters')
      .select('*')
      .eq('id', current.id)
      .single()
    if (readError || !fresh) return { ok: false, reason: 'error', error: readError }
    current = rowToCharacter(fresh as CharacterRow)
  }

  return { ok: false, reason: 'conflict' }
}
