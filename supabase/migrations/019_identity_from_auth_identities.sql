-- Torchlight — read the Discord ID from auth.identities, not user_metadata.
--
-- auth_discord_id() is the identity every RLS policy and helper is built on
-- (17 policies directly, plus is_gm, is_session_member, is_session_gm,
-- campaign_roster and the session RPCs). It read the ID from the JWT's
-- user_metadata, which the signed-in user can rewrite with auth.updateUser();
-- Supabase's docs warn against authorising on it. The Discord identity row in
-- auth.identities is written by the auth server at sign-in and the user can't
-- change it. The app reads the same row (src/lib/discordId.ts).
--
-- On 2026-10-10 the two sources held the same ID for all 6 Discord users, so
-- nobody's access changes.
--
-- SECURITY DEFINER because the authenticated role can't read the auth schema.
-- search_path is pinned empty and every name is qualified, which also clears
-- the function_search_path_mutable advisor. Grants are left as they were.
--
-- Rollback, the previous body:
--   CREATE OR REPLACE FUNCTION public.auth_discord_id() RETURNS text
--   LANGUAGE sql STABLE SECURITY INVOKER AS $$
--     SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'provider_id',
--                     auth.jwt() -> 'user_metadata' ->> 'sub');
--   $$;

CREATE OR REPLACE FUNCTION public.auth_discord_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT i.provider_id
  FROM auth.identities i
  WHERE i.user_id = auth.uid()
    AND i.provider = 'discord'
  LIMIT 1;
$$;
