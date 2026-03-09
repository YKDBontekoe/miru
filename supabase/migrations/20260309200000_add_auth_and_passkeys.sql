-- Migration: Add authentication support with passkeys
-- This migration adds:
--   1. user_id column to memories table (links memories to Supabase Auth users)
--   2. passkeys table for storing WebAuthn credentials
--   3. Row Level Security (RLS) policies for both tables
--   4. Updated match_memories RPC function that filters by user_id

-- ---------------------------------------------------------------------------
-- 1. Add user_id to memories
-- ---------------------------------------------------------------------------

ALTER TABLE public.memories
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for efficient per-user queries
CREATE INDEX idx_memories_user_id ON public.memories(user_id);

-- ---------------------------------------------------------------------------
-- 2. Create passkeys table for WebAuthn credentials
-- ---------------------------------------------------------------------------

CREATE TABLE public.passkeys (
    id             uuid        NOT NULL DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- credential_id is the raw bytes returned by the authenticator
    credential_id  bytea       NOT NULL,
    -- public_key is the COSE-encoded public key from the authenticator
    public_key     bytea       NOT NULL,
    -- sign_count for replay attack detection
    sign_count     bigint      NOT NULL DEFAULT 0,
    -- transports hint (e.g. {"internal","hybrid"})
    transports     text[]      NOT NULL DEFAULT '{}',
    -- human-readable label the user can assign
    device_name    text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    last_used_at   timestamptz,

    PRIMARY KEY (id),
    UNIQUE (credential_id)
);

CREATE INDEX idx_passkeys_user_id       ON public.passkeys(user_id);
CREATE INDEX idx_passkeys_credential_id ON public.passkeys(credential_id);

-- ---------------------------------------------------------------------------
-- 3. Enable Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.memories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkeys  ENABLE ROW LEVEL SECURITY;

-- memories: users can only see/create/delete their own rows
CREATE POLICY "memories_select_own"
    ON public.memories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "memories_insert_own"
    ON public.memories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "memories_delete_own"
    ON public.memories FOR DELETE
    USING (auth.uid() = user_id);

-- passkeys: users can only see/insert/delete their own credentials
CREATE POLICY "passkeys_select_own"
    ON public.passkeys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "passkeys_insert_own"
    ON public.passkeys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "passkeys_delete_own"
    ON public.passkeys FOR DELETE
    USING (auth.uid() = user_id);

-- passkeys: backend service role can update sign_count after authentication
CREATE POLICY "passkeys_update_service"
    ON public.passkeys FOR UPDATE
    USING (true);  -- service role bypasses RLS; this policy applies to anon/authenticated

-- ---------------------------------------------------------------------------
-- 4. Updated match_memories RPC — now filters by user_id
-- ---------------------------------------------------------------------------

-- Drop the old function first (signature changed)
DROP FUNCTION IF EXISTS match_memories(vector(1536), float, int);

CREATE FUNCTION match_memories(
    query_embedding  vector(1536),
    match_threshold  float,
    match_count      int,
    p_user_id        uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.content,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM public.memories m
    WHERE
        -- When p_user_id is provided, filter to that user only.
        -- NULL means "no filter" — used by service-role callers.
        (p_user_id IS NULL OR m.user_id = p_user_id)
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
