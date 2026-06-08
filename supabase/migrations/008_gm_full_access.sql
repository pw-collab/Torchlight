-- GM can UPDATE any character (not just those in their active sessions)
CREATE POLICY characters_update_gm_all ON characters
  FOR UPDATE
  TO authenticated
  USING (public.is_gm())
  WITH CHECK (public.is_gm());

-- GM can DELETE any character
CREATE POLICY characters_delete_gm_all ON characters
  FOR DELETE
  TO authenticated
  USING (public.is_gm());
