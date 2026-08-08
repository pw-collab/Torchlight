-- Torchlight — per-level advancement log behind the "Progresso" battlepass track.
-- Shape: [{ level, hpRoll?, hpDie?, hpGain?, conMod?,
--           talentId?, talentRoll?, talentDie1?, talentDie2?, talentEffect?, sealedAt? }]
-- Every level-up rolls the hit die (hp*); odd levels also roll a talent
-- (talent*), so an odd level carries both. One entry per level with something
-- resolved; unreached levels are simply absent.
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS level_progress JSONB NOT NULL DEFAULT '[]'::jsonb;
