-- Torchlight — campaign roster: /home lists the whole cast, not just your own.
--
-- Players may only SELECT their own rows (characters_select_own), so the
-- homepage could never show the rest of the party. Adding a blanket SELECT
-- policy would fix the listing but hand every player the *entire* row of
-- everyone else — backstory, impulses, relations, inventory, spells. The
-- roster therefore goes through a SECURITY DEFINER function that returns only
-- the six values the cards render, and resolves ownership server-side so no
-- Discord id ever reaches the browser. Opening a sheet still goes through RLS:
-- players get their own, the GM gets all (characters_select_gm_all).

CREATE OR REPLACE FUNCTION public.campaign_roster()
RETURNS TABLE (
  id UUID,
  name TEXT,
  concept TEXT,
  portrait_url TEXT,
  owner_name TEXT,
  is_own BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name,
    -- "Conceito" is the one-line pitch written in the sheet's backstory tab;
    -- blank strings collapse to NULL so the card can fall back cleanly.
    NULLIF(TRIM(c.background_details ->> 'concept'), '') AS concept,
    c.portrait_url,
    c.player_name AS owner_name,
    COALESCE(c.user_id = public.auth_discord_id(), FALSE) AS is_own
  FROM characters c
  -- SECURITY DEFINER bypasses RLS, so the allowlist check RLS would normally
  -- perform has to happen here: only campaign members get to see the cast.
  WHERE EXISTS (
    SELECT 1 FROM allowed_discord_ids a
    WHERE a.discord_id = public.auth_discord_id()
  )
  -- The viewer's own characters lead the grid (true sorts before false under
  -- DESC), newest first inside each group.
  ORDER BY (c.user_id = public.auth_discord_id()) DESC, c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.campaign_roster() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.campaign_roster() TO authenticated;
