-- Add integration_configs to agents table
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS integration_configs JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS allows reading and writing this new column
-- RLS on `agents` uses direct table access, so standard policies will just include this column automatically.
