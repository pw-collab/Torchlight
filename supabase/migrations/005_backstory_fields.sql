-- Torchlight — backstory fields: knowledge areas, domain of origin, faith
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS knowledge_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Shape: [{ name: string, bonus: number }]
  ADD COLUMN IF NOT EXISTS domain_id TEXT,
  ADD COLUMN IF NOT EXISTS faith TEXT;
