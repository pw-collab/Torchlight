-- Create avatars storage bucket (public reads, authenticated writes)
-- Run in Supabase SQL editor or via the dashboard bucket setup.

-- NOTE: This migration originally required creating the bucket by hand:
--   Storage → New bucket → Name: "avatars" → Public: true
-- Superseded by 010_avatar_bucket.sql, which creates the bucket in SQL and
-- re-declares the policies below idempotently. Run 010 on any project where
-- portrait uploads fail with "Bucket not found".

-- Allow anyone to read avatar images (public bucket)
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload/update their own character avatars.
-- Path convention: avatars/{character_id}/portrait.jpg
-- Owners check: the character must belong to the uploader.
CREATE POLICY "avatars_owner_upsert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      -- Owner: character belongs to this user
      EXISTS (
        SELECT 1 FROM public.characters
        WHERE id::text = (storage.foldername(name))[1]
          AND user_id = auth_discord_id()
      )
      -- OR: user is a GM
      OR public.is_gm()
    )
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.characters
        WHERE id::text = (storage.foldername(name))[1]
          AND user_id = auth_discord_id()
      )
      OR public.is_gm()
    )
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      EXISTS (
        SELECT 1 FROM public.characters
        WHERE id::text = (storage.foldername(name))[1]
          AND user_id = auth_discord_id()
      )
      OR public.is_gm()
    )
  );
