-- Torchlight — archetype chosen alongside the class during character creation.
-- Stores the archetype id from src/data/archetypes; the talent, kit item and
-- narrative hook it grants are resolved from that catalog at read time.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS archetype_id TEXT;
