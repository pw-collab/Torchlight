-- Torchlight — per-character spellcasting attribute

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS casting_attr TEXT NOT NULL DEFAULT 'int';
