-- Torchlight — npcs RLS: the policy tested the row, never the caller.
--
-- 007 wrote:
--
--   USING ( gm_id IN (SELECT discord_id FROM allowed_discord_ids WHERE role = 'gm') )
--
-- which asks "is this row owned by some GM?" and never "is the caller that
-- GM?". Every row in the table answers yes, so every authenticated user could
-- read, edit and delete every GM's bestiary — the players included, who got the
-- whole campaign's monsters. It was also FOR ALL with no WITH CHECK, so anyone
-- could insert rows stamped with another GM's id. And with no TO clause it
-- applied to `anon` as well as `authenticated`.

DROP POLICY IF EXISTS "gm_manage_own_npcs" ON npcs;

CREATE POLICY npcs_manage_own_gm ON npcs
  FOR ALL
  TO authenticated
  USING (gm_id = public.auth_discord_id() AND public.is_gm())
  WITH CHECK (gm_id = public.auth_discord_id() AND public.is_gm());
