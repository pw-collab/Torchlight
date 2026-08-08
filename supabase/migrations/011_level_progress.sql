-- Torchlight — per-level advancement log behind the "Progresso" battlepass track.
-- Shape: [{ level, kind, hpRoll?, hpDie?, conMod?, hpGain?,
--           talentId?, talentRoll?, talentDie1?, talentDie2?, talentEffect?, sealedAt? }]
-- One entry per *resolved* level; unreached levels are simply absent.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS level_progress JSONB NOT NULL DEFAULT '[]'::jsonb;
