-- Torchlight — extended character fields for full Shadowdark feature set

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS xp INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gold INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS silver INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS copper INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portrait_url TEXT,
  ADD COLUMN IF NOT EXISTS melee_bonus INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ranged_bonus INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spellcasting_bonus INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS talents JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS background_text TEXT,
  ADD COLUMN IF NOT EXISTS background_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS relations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS impulses JSONB NOT NULL DEFAULT '{}'::jsonb;

-- equipment column already JSONB; existing rows store {itemId, slots}[]
-- New rows will store full InventoryItem objects.
-- The application layer handles both formats via rowToCharacter().
