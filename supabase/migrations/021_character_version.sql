-- Torchlight — a version on every character, so two saves can't silently
-- overwrite each other.
--
-- The GM's panel and the player's sheet both write the same row: HP, luck, XP,
-- conditions, the inventory a torch lives in. Each wrote absolute values worked
-- out from its own copy, so when both acted at once the later save erased the
-- earlier one without anyone seeing it (replica/architecture.md, "lost updates").
--
-- The database bumps `version` on every update, whatever the client sends. A
-- client that saves "where version = what I saw" lands only if nobody saved in
-- between; if someone did, nothing is written and the client recomputes from
-- the fresh row (the GM's actions) or shows the player what changed (the
-- sheet). See src/lib/characterWrite.ts and src/hooks/useCharacter.ts.
--
-- Safe before the app ships: code that doesn't send a version keeps working;
-- the trigger just counts.

ALTER TABLE characters ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.bump_character_version()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

-- CREATE OR REPLACE (Postgres 14+) keeps this file re-runnable without a DROP.
CREATE OR REPLACE TRIGGER characters_bump_version
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION public.bump_character_version();
