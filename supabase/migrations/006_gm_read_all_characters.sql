-- GM can read ALL characters (not just those in their active sessions)
CREATE POLICY characters_select_gm_all ON characters
  FOR SELECT
  TO authenticated
  USING (public.is_gm());

-- Store player's display name alongside each character for GM visibility
ALTER TABLE characters ADD COLUMN player_name TEXT;
