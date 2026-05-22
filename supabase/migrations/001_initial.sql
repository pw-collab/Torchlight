-- Torchlight / Shadowdark VTT — initial schema

CREATE OR REPLACE FUNCTION public.auth_discord_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'provider_id',
    auth.jwt() -> 'user_metadata' ->> 'sub'
  );
$$;

CREATE TABLE allowed_discord_ids (
  discord_id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('player', 'gm')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gm_id TEXT NOT NULL REFERENCES allowed_discord_ids (discord_id),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES allowed_discord_ids (discord_id),
  session_id UUID REFERENCES sessions (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  class_id TEXT NOT NULL,
  ancestry_id TEXT NOT NULL,
  level INT NOT NULL DEFAULT 1,
  str INT NOT NULL,
  dex INT NOT NULL,
  con INT NOT NULL,
  int INT NOT NULL,
  wis INT NOT NULL,
  cha INT NOT NULL,
  hp_max INT NOT NULL,
  hp_current INT NOT NULL,
  ac INT NOT NULL,
  luck_tokens INT NOT NULL DEFAULT 0,
  equipment JSONB NOT NULL DEFAULT '[]'::jsonb,
  spells JSONB NOT NULL DEFAULT '[]'::jsonb,
  torch_end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX characters_user_id_idx ON characters (user_id);
CREATE INDEX characters_session_id_idx ON characters (session_id);
CREATE INDEX sessions_gm_active_idx ON sessions (gm_id, active);

CREATE OR REPLACE FUNCTION public.is_gm()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM allowed_discord_ids
    WHERE discord_id = public.auth_discord_id()
      AND role = 'gm'
  );
$$;

ALTER TABLE allowed_discord_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Allowlist: authenticated users may read their own row (auth gate in proxy)
CREATE POLICY allowed_discord_ids_select_own ON allowed_discord_ids
  FOR SELECT
  TO authenticated
  USING (discord_id = public.auth_discord_id());

-- Sessions: GM manages own sessions
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT
  TO authenticated
  USING (gm_id = public.auth_discord_id());

CREATE POLICY sessions_insert_gm ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (gm_id = public.auth_discord_id() AND public.is_gm());

CREATE POLICY sessions_update_own ON sessions
  FOR UPDATE
  TO authenticated
  USING (gm_id = public.auth_discord_id())
  WITH CHECK (gm_id = public.auth_discord_id());

-- Characters: owner CRUD; GM read/update for characters in their active sessions
CREATE POLICY characters_select_own ON characters
  FOR SELECT
  TO authenticated
  USING (user_id = public.auth_discord_id());

CREATE POLICY characters_select_gm_session ON characters
  FOR SELECT
  TO authenticated
  USING (
    public.is_gm()
    AND session_id IN (
      SELECT id FROM sessions WHERE gm_id = public.auth_discord_id()
    )
  );

CREATE POLICY characters_insert_own ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.auth_discord_id());

CREATE POLICY characters_update_own ON characters
  FOR UPDATE
  TO authenticated
  USING (user_id = public.auth_discord_id())
  WITH CHECK (user_id = public.auth_discord_id());

CREATE POLICY characters_update_gm_session ON characters
  FOR UPDATE
  TO authenticated
  USING (
    public.is_gm()
    AND session_id IN (
      SELECT id FROM sessions WHERE gm_id = public.auth_discord_id()
    )
  );

-- Realtime for GM panel
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
