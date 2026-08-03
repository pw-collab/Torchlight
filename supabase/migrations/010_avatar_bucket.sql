-- Create the "avatars" storage bucket in SQL.
--
-- Migration 009 declared the RLS policies but left the bucket itself as a
-- manual "Storage → New bucket" step in the dashboard. Where that step was
-- never performed, every portrait upload fails with "Bucket not found" and the
-- sheet silently keeps its old portrait. Creating it here removes the manual
-- step and makes a fresh project work out of the box.
--
-- Safe to run on a project that already has the bucket: the INSERT upserts and
-- the policies are dropped before being recreated.

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('avatars', 'avatars', true, 5 * 1024 * 1024)
ON CONFLICT (id) DO UPDATE
  SET public          = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit;

-- ---------------------------------------------------------------------------
-- Policies — same rules as 009, re-declared idempotently so a single run of
-- this file leaves storage fully configured.
-- Path convention: avatars/{character_id}/portrait.jpg
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_owner_upsert" ON storage.objects;
CREATE POLICY "avatars_owner_upsert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.characters
        WHERE id::text = (storage.foldername(name))[1]
          AND user_id = public.auth_discord_id()
      )
      OR public.is_gm()
    )
  );

-- upsert:true on an existing object goes through UPDATE, so the owner needs
-- both this and the INSERT policy above.
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.characters
        WHERE id::text = (storage.foldername(name))[1]
          AND user_id = public.auth_discord_id()
      )
      OR public.is_gm()
    )
  );

DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;
CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.characters
        WHERE id::text = (storage.foldername(name))[1]
          AND user_id = public.auth_discord_id()
      )
      OR public.is_gm()
    )
  );
