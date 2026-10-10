-- Torchlight — schema hygiene from the architecture audit (replica/architecture.md).
--
-- Nothing here changes what a signed-in player or GM can do. Checked against
-- production on 2026-10-10 before writing: every existing row passes the new
-- checks, and the only policy open to the anon role is the public avatar read,
-- which calls none of the helpers locked below.

-- 1. Avatars: images only. The browser already checks; now the bucket does too.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

-- 2. The two foreign keys without an index. Both are SET NULL targets, so a
--    deleted session or character no longer scans the whole child table.
CREATE INDEX IF NOT EXISTS npcs_session_idx ON npcs (session_id);
CREATE INDEX IF NOT EXISTS session_events_character_idx ON session_events (character_id);

-- 3. Sanity bounds on characters. Loose on purpose: they catch corrupt values,
--    not rules. Level follows the progression track (1 to 20). Stats stop at
--    30, since talents can lift a stat past creation's cap of 20. There is no
--    hp_current <= hp_max check: undoing a level lowers hp_max on its own.
ALTER TABLE characters
  ADD CONSTRAINT characters_level_range  CHECK (level BETWEEN 1 AND 20),
  ADD CONSTRAINT characters_stats_range  CHECK (
    str BETWEEN 1 AND 30 AND dex BETWEEN 1 AND 30 AND con BETWEEN 1 AND 30 AND
    int BETWEEN 1 AND 30 AND wis BETWEEN 1 AND 30 AND cha BETWEEN 1 AND 30),
  ADD CONSTRAINT characters_hp_range     CHECK (hp_max >= 1 AND hp_current >= 0),
  ADD CONSTRAINT characters_counters_min CHECK (
    luck_tokens >= 0 AND xp >= 0 AND gold >= 0 AND silver >= 0 AND copper >= 0);

-- 4. Helpers that only make sense for a signed-in caller, out of anon's reach.
--    Revoking from PUBLIC also removes the implicit grant, so authenticated
--    (RLS and the column default on sessions.code) and service_role get theirs
--    back explicitly.
DO $$
DECLARE fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'public.auth_discord_id()',
    'public.is_gm()',
    'public.is_session_gm(uuid)',
    'public.is_session_member(uuid)',
    'public.encounter_session(uuid)',
    'public.generate_session_code()'
  ]::regprocedure[]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
  END LOOP;
END $$;
