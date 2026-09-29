-- 016_storage.sql
-- Supabase Storage buckets & policies for creator reels, profile images, and business logos

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    (
        'creator-reels',
        'creator-reels',
        true,
        19922944, -- 19 MB maximum file size limit
        ARRAY['video/mp4', 'video/webm', 'video/quicktime']
    ),
    (
        'creator-profiles',
        'creator-profiles',
        true,
        5242880, -- 5 MB maximum file size limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    ),
    (
        'business-logos',
        'business-logos',
        true,
        5242880, -- 5 MB maximum file size limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    )
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for creator-reels
DROP POLICY IF EXISTS "Public access to creator reels" ON storage.objects;
CREATE POLICY "Public access to creator reels"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'creator-reels');

DROP POLICY IF EXISTS "Authenticated creators can upload reels" ON storage.objects;
CREATE POLICY "Authenticated creators can upload reels"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'creator-reels'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Creators can update own reels" ON storage.objects;
CREATE POLICY "Creators can update own reels"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'creator-reels'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Creators can delete own reels" ON storage.objects;
CREATE POLICY "Creators can delete own reels"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'creator-reels'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. Storage Policies for creator-profiles
DROP POLICY IF EXISTS "Public access to creator profiles" ON storage.objects;
CREATE POLICY "Public access to creator profiles"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'creator-profiles');

DROP POLICY IF EXISTS "Authenticated users can upload own profile picture" ON storage.objects;
CREATE POLICY "Authenticated users can upload own profile picture"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'creator-profiles'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 4. Storage Policies for business-logos
DROP POLICY IF EXISTS "Public access to business logos" ON storage.objects;
CREATE POLICY "Public access to business logos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'business-logos');

DROP POLICY IF EXISTS "Authenticated businesses can upload logos" ON storage.objects;
CREATE POLICY "Authenticated businesses can upload logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'business-logos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
