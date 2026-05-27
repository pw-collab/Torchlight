-- Add technique_states column to store per-character runtime state for class
-- techniques (choices made, uses remaining, expended spell-like abilities).
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS technique_states JSONB NOT NULL DEFAULT '[]'::jsonb;
