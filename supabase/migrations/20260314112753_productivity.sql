-- Migration: productivity
-- Generated: 2026-03-14T11:27:53.293419+00:00
-- Type: incremental

-- Row Level Security ----------------------------------------------------

ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_tools_owner_all ON public.agent_tools;
DROP POLICY IF EXISTS agent_tools_select ON public.agent_tools;
CREATE POLICY agent_tools_select ON public.agent_tools FOR SELECT USING (is_public = true OR auth.uid() = user_id OR user_id IS NULL);
DROP POLICY IF EXISTS agent_tools_insert ON public.agent_tools;
CREATE POLICY agent_tools_insert ON public.agent_tools FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS agent_tools_update ON public.agent_tools;
CREATE POLICY agent_tools_update ON public.agent_tools FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS agent_tools_delete ON public.agent_tools;
CREATE POLICY agent_tools_delete ON public.agent_tools FOR DELETE USING (auth.uid() = user_id);
