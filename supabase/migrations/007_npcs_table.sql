-- NPC/Monster cards owned by GMs
CREATE TABLE npcs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id         TEXT        NOT NULL,
  session_id    UUID        REFERENCES sessions(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  npc_type      TEXT,
  flavor_text   TEXT,
  motives       TEXT,
  difficulty    INTEGER,
  hp            INTEGER,
  ac            INTEGER,
  atk_desc      TEXT,
  weapon_desc   TEXT,
  level         INTEGER,
  movement      TEXT,
  alignment     TEXT,
  stats         JSONB       NOT NULL DEFAULT '{"str":0,"dex":0,"con":0,"int":0,"wis":0,"cha":0}',
  experience    TEXT,
  features      JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE npcs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gm_manage_own_npcs" ON npcs
  FOR ALL
  USING (
    gm_id IN (
      SELECT discord_id FROM allowed_discord_ids WHERE role = 'gm'
    )
  );
