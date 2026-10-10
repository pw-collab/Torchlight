import type { User } from '@supabase/supabase-js'

/**
 * The viewer's Discord ID, from the Discord identity Supabase recorded at
 * sign-in. Not from `user_metadata`: the user can rewrite that with
 * `auth.updateUser()`, so it can't decide who someone is. Display names may
 * still come from metadata; they are cosmetic.
 *
 * Mirrors `public.auth_discord_id()` (migration 019), so the app and the
 * database agree on who is asking. Needs a `User` from `getUser()`, which
 * carries `identities`; a session's cached user may not.
 */
export function discordIdOf(user: User): string | undefined {
  return user.identities?.find(identity => identity.provider === 'discord')?.id
}
